pragma solidity ^0.4.11;

import "../../contracts/interface/Finalizable.sol";

contract FinalizableMock is Finalizable {

  bool has_finalized;

  function finalize() {
    has_finalized = true;
  }

  function finalized() returns (bool) {
    return has_finalized;
  }
}
