pragma solidity ^0.4.11;

import "./MiniMeToken.sol";

/*
  Copyright 2017, Anton Egorov (Mothership)
*/

contract SIT is MiniMeToken {

  function SIT(address _tokenFactory)
    MiniMeToken(
                _tokenFactory,
                0x0,                         // no parent token
                0,                           // no snapshot block number from parent
                "Strategic Investors Token", // Token name
                18,                          // Decimals
                "SIT",                       // Symbol
                false                        // Enable transfers
                ) {}
}
