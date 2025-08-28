// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AbstractBlocklockReceiver
 * @notice An abstract contract that other contracts can inherit from to receive blocklocks.
 */
abstract contract AbstractBlocklockReceiver is Ownable {
    constructor(address blocklockSender)
        Ownable(msg.sender)
    {}

    /**
     * @notice Sets a lock for a given token ID until a specific block number.
     * @param _tokenId The unique identifier of the item to be locked.
     * @param _unlockBlockNumber The block number at which the lock expires.
     */
    function setLock(uint256 _tokenId, uint256 _unlockBlockNumber) external virtual;

    /**
     * @notice Checks if a specific token ID is currently locked.
     * @param _tokenId The unique identifier of the item to check.
     * @return A boolean value, true if the item is locked, false otherwise.
     */
    function isLocked(uint256 _tokenId) external view virtual returns (bool);
}