pragma solidity ^0.4.11;

import "./misc/SafeMath.sol";
import "./interface/Controlled.sol";
import "./interface/TokenController.sol";
import "./SIT.sol";
import "./MSP.sol";


/*
  Copyright 2017, Anton Egorov (Mothership Foundation)
  Copyright 2017, Jordi Baylina (Giveth)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

  Based on SampleCampaign-TokenController.sol from https://github.com/Giveth/minime
  Original contract is https://github.com/status-im/status-network-token/blob/master/contracts/StatusContribution.sol
*/

contract Contribution is Controlled, TokenController {
  using SafeMath for uint256;

  uint256 constant public maxGasPrice = 50000000000;
  uint256 constant public maxCallFrequency = 100;

  uint256 public totalSupplyCap;
  uint256 public exchangeRate;

  MiniMeToken public SIT;
  MiniMeToken public MSP;
  uint256 public startBlock;
  uint256 public endBlock;

  address public destEthDevs;
  address public destTokensSit;
  address public destTokensTeam;

  address public mspController;

  uint256 public finalizedBlock;
  uint256 public finalizedTime;

  mapping (address => uint256) public lastCallBlock;

  bool public paused;

  modifier initialized() {
    require(address(MSP) != 0x0);
    _;
  }

  modifier contributionOpen() {
    require(getBlockNumber() >= startBlock &&
            getBlockNumber() <= endBlock &&
            finalizedBlock == 0 &&
            address(MSP) != 0x0);
    _;
  }

  modifier notPaused() {
    require(!paused);
    _;
  }

  function Contribution() {
    paused = false;
  }

  /// @notice This method should be called by the controller before the contribution
  ///  period starts This initializes most of the parameters
  /// @param _msp Address of the MSP token contract
  /// @param _mspController Token controller for the MSP that will be transferred after
  ///  the contribution finalizes.
  /// @param _totalSupplyCap Maximum amount of tokens to generate during the contribution
  /// @param _exchangeRate ETH to MSP rate for the token sale
  /// @param _startBlock Block when the contribution period starts
  /// @param _endBlock The last block that the contribution period is active
  /// @param _destEthDevs Destination address where the contribution ether is sent
  /// @param _destTokensSit Address of the exchanger SIT-MSP where the MSP are sent
  ///  to be distributed to the SIT holders.
  /// @param _destTokensTeam Address where the tokens for the team are sent
  /// @param _sit Address of the SIT token contract
  function initialize(
      address _msp,
      address _mspController,

      uint256 _totalSupplyCap,
      uint256 _exchangeRate,

      uint256 _startBlock,
      uint256 _endBlock,

      address _destEthDevs,
      address _destTokensSit,
      address _destTokensTeam,

      address _sit
  ) public onlyController {
    // Initialize only once
    require(address(MSP) == 0x0);

    MSP = MiniMeToken(_msp);
    require(MSP.totalSupply() == 0);
    require(MSP.controller() == address(this));
    require(MSP.decimals() == 18);  // Same amount of decimals as ETH

    require(_mspController != 0x0);
    mspController = _mspController;

    require(_exchangeRate > 0);
    exchangeRate = _exchangeRate;

    require(_startBlock >= getBlockNumber());
    require(_startBlock < _endBlock);
    startBlock = _startBlock;
    endBlock = _endBlock;

    require(_destEthDevs != 0x0);
    destEthDevs = _destEthDevs;

    require(_destTokensSit != 0x0);
    destTokensSit = _destTokensSit;

    require(_destTokensTeam != 0x0);
    destTokensTeam = _destTokensTeam;

    require(_sit != 0x0);
    SIT = MiniMeToken(_sit);

    // SIT amount should be no more than 20% of MSP total supply cap
    require(MiniMeToken(SIT).totalSupply() * 5 <= _totalSupplyCap);
    totalSupplyCap = _totalSupplyCap;
  }

  /// @notice If anybody sends Ether directly to this contract, consider he is
  ///  getting MSPs.
  function () public payable notPaused {
    proxyPayment(msg.sender);
  }


  //////////
  // TokenController functions
  //////////

  /// @notice This method will generally be called by the MSP token contract to
  ///  acquire MSPs. Or directly from third parties that want to acquire MSPs in
  ///  behalf of a token holder.
  /// @param _th MSP holder where the MSPs will be minted.
  function proxyPayment(address _th) public payable notPaused initialized contributionOpen returns (bool) {
    require(_th != 0x0);
    doBuy(_th);
    return true;
  }

  function onTransfer(address, address, uint256) public returns (bool) {
    return false;
  }

  function onApprove(address, address, uint256) public returns (bool) {
    return false;
  }

  function doBuy(address _th) internal {
    require(tx.gasprice <= maxGasPrice);

    // Antispam mechanism
    address caller;
    if (msg.sender == address(MSP)) {
      caller = _th;
    } else {
      caller = msg.sender;
    }

    // Do not allow contracts to game the system
    require(!isContract(caller));

    require(getBlockNumber().sub(lastCallBlock[caller]) >= maxCallFrequency);
    lastCallBlock[caller] = getBlockNumber();

    uint256 toFund = msg.value;
    if (toFund > 0) {
      uint256 tokensGenerated = toFund.mul(exchangeRate);

      // Check total supply cap reached
      uint256 newTotalSupply = tokensGenerated.add(MSP.totalSupply());
      if (newTotalSupply > totalSupplyCap) {
        tokensGenerated = tokensGenerated.sub(newTotalSupply.sub(totalSupplyCap));
        toFund = tokensGenerated.div(exchangeRate);
      }

      assert(MSP.generateTokens(_th, tokensGenerated));
      destEthDevs.transfer(toFund);
      NewSale(_th, toFund, tokensGenerated);
    }

    uint256 toReturn = msg.value.sub(toFund);
    if (toReturn > 0) {
      // If the call comes from the Token controller,
      // then we return it to the token Holder.
      // Otherwise we return to the sender.
      if (msg.sender == address(MSP)) {
        _th.transfer(toReturn);
      } else {
        msg.sender.transfer(toReturn);
      }
    }
  }

  /// @dev Internal function to determine if an address is a contract
  /// @param _addr The address being queried
  /// @return True if `_addr` is a contract
  function isContract(address _addr) constant internal returns (bool) {
    if (_addr == 0) return false;
    uint256 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }


  //////////
  // Constant functions
  //////////

  /// @return Total tokens issued in weis.
  function tokensIssued() public constant returns (uint256) {
    return MSP.totalSupply();
  }


  //////////
  // Testing specific methods
  //////////

  /// @notice This function is overridden by the test Mocks.
  function getBlockNumber() internal constant returns (uint256) {
    return block.number;
  }


  //////////
  // Safety Methods
  //////////

  /// @notice This method can be used by the controller to extract mistakenly
  ///  sent tokens to this contract.
  /// @param _token The address of the token contract that you want to recover
  ///  set to 0 in case you want to extract ether.
  function claimTokens(address _token) public onlyController {
    if (MSP.controller() == address(this)) {
      MSP.claimTokens(_token);
    }
    if (_token == 0x0) {
      controller.transfer(this.balance);
      return;
    }

    ERC20Token token = ERC20Token(_token);
    uint256 balance = token.balanceOf(this);
    token.transfer(controller, balance);
    ClaimedTokens(_token, controller, balance);
  }


  /// @notice Pauses the contribution if there is any issue
  function pauseContribution() onlyController {
    paused = true;
  }

  /// @notice Resumes the contribution
  function resumeContribution() onlyController {
    paused = false;
  }

  event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
  event NewSale(address indexed _th, uint256 _amount, uint256 _tokens);
  event Finalized();
}
