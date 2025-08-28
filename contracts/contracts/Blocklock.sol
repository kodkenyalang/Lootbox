// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AbstractBlocklockReceiver.sol";

/**
 * @title Blocklock Contract
 * @notice Manages time-based locks on assets based on block numbers.
 * Only the owner (the LootBoxManager contract) can set locks.
 */
contract Blocklock is AbstractBlocklockReceiver {
    // Mapping from a token ID to the block number it unlocks at.
    mapping(uint256 => uint256) private _lockedUntilBlock;

    constructor(address blocklockSender)
        AbstractBlocklockReceiver(blocklockSender)
    {}

    /**
     * @inheritdoc AbstractBlocklockReceiver
     * @dev Sets a lock on a token. Can only be called by the owner.
     */
    function setLock(uint256 _tokenId, uint256 _unlockBlockNumber) external override onlyOwner {
        require(_unlockBlockNumber > block.number, "Blocklock: Unlock block must be in the future");
        _lockedUntilBlock[_tokenId] = _unlockBlockNumber;
    }

    /**
     * @inheritdoc AbstractBlocklockReceiver
     * @dev Checks if a token is still locked.
     */
    function isLocked(uint256 _tokenId) public view override returns (bool) {
        // If an unlock block is set and it's in the future, the token is locked.
        return _lockedUntilBlock[_tokenId] > 0 && block.number < _lockedUntilBlock[_tokenId];
    }
}