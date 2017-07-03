pragma solidity ^0.4.11;

contract Finalizable {
  uint256 public finalizedBlock;

  function canFinalize() returns (bool);
  function finalize();
  function finalized() returns (bool);
}
