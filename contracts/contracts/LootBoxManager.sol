// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Simple interface to interact with the Blocklock contract
interface IBlocklock {
    function isLocked(uint256 _tokenId) external view returns (bool);
}

/**
 * @title Blocklock Contract (Included for completeness, but typically deployed separately)
 * @notice Manages time-based locks on assets based on block numbers.
 * Only the owner (the LootBoxManager / now LootBox contract) can set locks.
 */
contract Blocklock is IBlocklock, Ownable { // It implements the IBlocklock interface itself
    mapping(uint256 => uint256) private _lockedUntilBlock;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setLock(uint256 _tokenId, uint256 _unlockBlockNumber) external override onlyOwner {
        require(_unlockBlockNumber > block.number, "Blocklock: Unlock block must be in the future");
        _lockedUntilBlock[_tokenId] = _unlockBlockNumber;
    }

    function isLocked(uint256 _tokenId) public view override returns (bool) {
        return _lockedUntilBlock[_tokenId] > 0 && block.number < _lockedUntilBlock[_tokenId];
    }
}


/**
 * @title LootBox
 * @notice Combines ERC721 NFT, Blocklock integration, and loot box opening logic.
 * @dev Assumes OpenZeppelin Contracts v5.x for internal functions like _owner.
 */
contract LootBox is ERC721, Ownable {
    IBlocklock public immutable blocklock; // Still an interface to the *separate* Blocklock contract
    address public immutable userAddress; // Hardcoded user for the hackathon
    uint256 private _nextTokenId; // Tracks the next token ID to be minted

    uint256 public constant RARE_ITEM_LOCK_DURATION_IN_BLOCKS = 50; // Approx 25 minutes on Filecoin

    event LootBoxOpened(address indexed user, uint256 indexed tokenId, bool wasLocked);

    /**
     * @dev Constructor for the combined LootBox contract.
     * @param _blocklockAddress The address of the *already deployed* Blocklock contract.
     * @param _userAddress The hardcoded user address for MVP.
     * @param initialOwner The address that will own this LootBox contract.
     */
    constructor(
        address _blocklockAddress,
        address _userAddress,
        address initialOwner // The deployer, who will also trigger `openBox`
    ) ERC721("LootBox Item", "LBI") Ownable(initialOwner) {
        require(_blocklockAddress != address(0), "LootBox: Invalid blocklock address");
        require(_userAddress != address(0), "LootBox: Invalid user address");
        
        blocklock = IBlocklock(_blocklockAddress);
        userAddress = _userAddress;
        _nextTokenId = 1; // Start token IDs from 1
    }

    /**
     * @notice The main function to open a loot box.
     * Can only be called by the owner of this LootBox contract (the deployer/backend).
     */
    function openBox() external onlyOwner {
        // WARNING: INSECURE pseudo-randomness for MVP/hackathon purposes ONLY.
        // This method is more portable across EVM chains than using block.prevrandao.
        uint256 pseudoRandom = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));

        // Mint the new NFT directly (internal call)
        uint256 newItemId = _mintNFT(userAddress); // Calls the internal minting logic

        bool wasLocked = false;
        // 10% chance to get a "rare" item that gets locked (e.g., if random number ends in 7)
        if (pseudoRandom % 10 == 7) {
            uint256 unlockBlock = block.number + RARE_ITEM_LOCK_DURATION_IN_BLOCKS;
            // Call the separate Blocklock contract to set the lock
            blocklock.setLock(newItemId, unlockBlock);
            wasLocked = true;
        }

        emit LootBoxOpened(userAddress, newItemId, wasLocked);
    }

    /**
     * @dev Internal helper function to mint a new token.
     * Moved logic from the old external `mint` function.
     */
    function _mintNFT(address to) internal returns (uint256) {
        require(to != address(0), "LootBox: Cannot mint to zero address");
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Override _update (OpenZeppelin v5.x hook) to check for locked tokens before transfer.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        // Use _owner for OZ v5.x
        address from = _owner(tokenId);
        
        // Only check lock status for actual transfers (not mints or burns)
        if (from != address(0) && to != address(0)) {
            require(!blocklock.isLocked(tokenId), "LootBox: Token is locked");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view
        override(ERC721) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Check if a token exists and is locked.
     */
    function isTokenLocked(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "LootBox: Token does not exist");
        return blocklock.isLocked(tokenId);
    }
}