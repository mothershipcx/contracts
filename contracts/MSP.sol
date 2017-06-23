pragma solidity ^0.4.11;

import "./MetaToken.sol";

/**
 * @title Strategic Investors Token
 */
contract MSP is MetaToken {
  function MSP()
    MetaToken(
              "Mothership Token",
              "MSP",
              18,
              200000000
    ) {}
}
