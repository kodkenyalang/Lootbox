# **App Name**: LootBox

## Core Features:

- Single-Action Loot Box Opening: One API call triggers the entire on-chain process on the Filecoin network.
- Portable Randomness: Use RVF from https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Franda-mu%2Frandomness-solidity%2Fblob%2Fmain%2Fsrc%2Fmocks%2FMockRandomnessReceiver.sol
- Block-Based Item Locking: Rare items are minted in a "locked" state via the Blocklock.sol contract(https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Franda-mu%2Fblocklock-solidity%2Fblob%2Fmain%2Fsrc%2FAbstractBlocklockReceiver.sol) and are non-transferable.
- Lootbox Manager: // SPDX-License-Identifier: MIT
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
- Minimalist API for Interaction: Two API endpoints: one to open a box, one to check your items' status on-chain.

## Style Guidelines:

- Primary color: Deep indigo (#4B0082) to convey a sense of mystery and value.
- Background color: Very dark gray (#222222) to create a high contrast and focus on the loot box content.
- Accent color: Gold (#FFD700) to highlight important elements such as unlock times and the revealed NFT.
- Font: 'Inter', a grotesque-style sans-serif, for all headings and body text, as it lends a modern and neutral look appropriate to the topic of web3 and distributed data.
- Use clear, minimalist icons representing blockchain and NFT concepts, with a slightly futuristic feel.
- A centered layout with a strong focal point on the loot box and associated information, optimized for desktop and mobile.
- Subtle animations to highlight state transitions, like opening the loot box and revealing the NFT.