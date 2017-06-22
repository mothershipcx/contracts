pragma solidity ^0.4.11;


import "zeppelin-solidity/contracts/token/MintableToken.sol";


/**
 * @title MetaToken
 */
contract MetaToken is MintableToken {

  string public name;          // The Token's name: e.g. Mothership Tokens
  string public symbol;        // An identifier: e.g. MSP
  uint8 public decimals;       // Number of decimals of the smallest unit 

  uint public totalSupplyCap;  // Total supply cap

  /**
   * @dev Contructor that create a token with caped total supply
   */
  function MetaToken(
    string _tokenName,
    string _tokenSymbol,
    uint8 _decimalUnits,
    uint _totalSupplyCap
  ) {
    name = _tokenName;
    decimals = _decimalUnits;
    symbol = _tokenSymbol;
    totalSupplyCap = _totalSupplyCap;
  }

  /**
   * @dev Function to mint tokens. Overrided to respect total supply cap.
   * @param _to The address that will recieve the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint _amount) onlyOwner canMint returns (bool) {
    uint newTotalSupply = totalSupply.add(_amount);
    if (newTotalSupply > totalSupplyCap) throw;
    totalSupply = newTotalSupply;
    balances[_to] = balances[_to].add(_amount);
    Mint(_to, _amount);
    return true;
  }
}
