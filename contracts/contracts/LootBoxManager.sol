// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ItemNFT.sol";
import "./Blocklock.sol";

/**
 * @title LootBoxManager
 * @notice Orchestrates the loot box opening process for an FVM/EVM compatible chain.
 */
contract LootBoxManager {
    ItemNFT public immutable itemNFT;
    Blocklock public immutable blocklock;
    address public immutable userAddress; // Hardcoded user for the hackathon

    uint256 public constant RARE_ITEM_LOCK_DURATION_IN_BLOCKS = 50; // Approx 25 minutes on Filecoin

    event LootBoxOpened(address indexed user, uint256 indexed tokenId, bool wasLocked);

    constructor(
        address _itemNFTAddress,
        address _blocklockAddress,
        address _userAddress
    ) {
        itemNFT = ItemNFT(_itemNFTAddress);
        blocklock = Blocklock(_blocklockAddress);
        userAddress = _userAddress;
    }

    /**
     * @notice The main function to open a loot box.
     */
    function openBox() external {
        // WARNING: INSECURE pseudo-randomness for MVP/hackathon purposes ONLY.
        // This method is more portable across EVM chains than using block.prevrandao.
        uint256 pseudoRandom = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));

        // Mint the new NFT.
        uint256 newItemId = itemNFT.mint(userAddress);
        
        bool wasLocked = false;
        // 10% chance to get a "rare" item that gets locked (e.g., if random number ends in 7)
        if (pseudoRandom % 10 == 7) {
            uint256 unlockBlock = block.number + RARE_ITEM_LOCK_DURATION_IN_BLOCKS;
            blocklock.setLock(newItemId, unlockBlock);
            wasLocked = true;
        }

        emit LootBoxOpened(userAddress, newItemId, wasLocked);
    }
}