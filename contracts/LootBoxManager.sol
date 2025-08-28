// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ItemNFT.sol";
import "./Blocklock.sol";

contract LootBoxManager {
    ItemNFT public itemNFT;
    Blocklock public blocklock;
    address public userAddress; // The user who can open the box

    uint256 constant LOCK_DURATION_IN_BLOCKS = 100;

    event LootBoxOpened(address indexed user, uint256 indexed tokenId, bool wasLocked);

    constructor(address _itemNFTAddress, address _blocklockAddress, address _userAddress) {
        itemNFT = ItemNFT(_itemNFTAddress);
        blocklock = Blocklock(_blocklockAddress);
        userAddress = _userAddress;
    }

    function openBox() external {
        require(msg.sender == userAddress, "Only the designated user can open the box");
        
        uint256 newTokenId = itemNFT.totalSupply();
        itemNFT.safeMint(msg.sender);

        // 50% chance to lock the item
        bool shouldLock = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, newTokenId))) % 2) == 0;

        if (shouldLock) {
            uint256 unlockBlock = block.number + LOCK_DURATION_IN_BLOCKS;
            // The ItemNFT contract needs to grant the Blocklock contract the ability to lock
            // For now, let's assume LootBoxManager has this power
            blocklock.setLock(newTokenId, unlockBlock);
        }

        emit LootBoxOpened(msg.sender, newTokenId, shouldLock);
    }
}
