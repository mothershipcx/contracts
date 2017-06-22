pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "./MetaToken.sol";

/**
 * @title Strategic Investors Token
 */
contract SIT is HasNoEther, MetaToken {
  function SIT()
    MetaToken(
              "Strategic Investors Token",
              "SIT",
              18,
              40000000
    ) {}
}
