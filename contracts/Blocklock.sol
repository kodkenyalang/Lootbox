// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Blocklock is Ownable {
    mapping(uint256 => uint256) public locks;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setLock(uint256 _tokenId, uint256 _unlockBlockNumber) external {
        // This should be called by a trusted contract (e.g., LootBoxManager)
        // For simplicity, leaving it open, but in production it needs access control
        locks[_tokenId] = _unlockBlockNumber;
    }

    function isLocked(uint256 _tokenId) public view returns (bool) {
        return block.number < locks[_tokenId];
    }
}
