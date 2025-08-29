// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RandomnessReceiver.sol";
import "./BlocklockReceiver.sol";

/**
 * @title IntegratedLootBox Contract
 * @notice An ERC721 contract that properly integrates external Randomness and Blocklock services.
 * @dev This contract uses an asynchronous model for randomness and delegates lock management.
 * It is compatible with OpenZeppelin Contracts v5.x.
 */
contract IntegratedLootBox is ERC721, Ownable, RandomnessReceiver, BlocklockReceiver {
    // --- State Variables ---
    uint256 private _nextTokenId;
    address public immutable userAddress; // Hardcoded user for the hackathon MVP.

    // Mapping to link a randomness request back to the user who should receive the NFT.
    // For this MVP, it's not strictly needed since we mint to a hardcoded userAddress,
    // but it's essential for a multi-user system.
    mapping(bytes32 => address) public requestToSender;

    uint256 public constant RARE_ITEM_LOCK_DURATION_IN_BLOCKS = 50;

    event LootBoxRequest(bytes32 indexed requestId, address indexed user);
    event LootBoxOpened(bytes32 indexed requestId, address indexed user, uint256 indexed tokenId, bool wasLocked);

    // --- Constructor ---
    constructor(
        address _randomnessAddress,
        address _blocklockAddress,
        address _userAddress,
        address initialOwner
    ) 
        ERC721("Integrated LootBox", "ILB") 
        Ownable(initialOwner)
        RandomnessReceiver(_randomnessAddress)
        BlocklockReceiver(_blocklockAddress)
    {
        require(_userAddress != address(0), "IntegratedLootBox: Invalid user address");
        userAddress = _userAddress;
        _nextTokenId = 1;
    }

    // --- Core Logic (Asynchronous Flow) ---

    /**
     * @notice Step 1: User calls this to request opening a loot box.
     */
    function requestLootBoxOpen() external {
        bytes32 requestId = _requestRandomness();
        // For this MVP, we use the hardcoded userAddress. In a real app, you'd use msg.sender.
        requestToSender[requestId] = userAddress;
        emit LootBoxRequest(requestId, userAddress);
    }

    /**
     * @notice Step 2: This is the callback function that the Randomness oracle calls.
     * @dev It implements the abstract `_fulfillRandomness` from RandomnessReceiver.
     */
    function _fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        address recipient = requestToSender[requestId];
        require(recipient != address(0), "Invalid request ID");

        // Mint the token to the original requester.
        uint256 newItemId = _internalMint(recipient);
        
        bool wasLocked = false;
        // 10% chance to get a "rare" item that gets locked.
        if (randomness % 10 == 7) {
            uint256 unlockBlock = block.number + RARE_ITEM_LOCK_DURATION_IN_BLOCKS;
            // Call the inherited helper to set the lock on the external contract.
            _setLock(newItemId, unlockBlock);
            wasLocked = true;
        }

        emit LootBoxOpened(requestId, recipient, newItemId, wasLocked);
    }

    // --- Internal Functions ---

    function _internalMint(address to) internal returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    // --- ERC721 Hooks (For enforcing the lock) ---

    /**
     * @dev Hook that is called before any token transfer in OpenZeppelin v5.x.
     * It checks the lock status by calling the external Blocklock contract.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _owner(tokenId);
        
        if (from != address(0)) {
            // Call the external 'blocklock' contract to check the lock status.
            require(!blocklock.isLocked(tokenId), "IntegratedLootBox: Token is locked");
        }
        
        return super._update(to, tokenId, auth);
    }
}
