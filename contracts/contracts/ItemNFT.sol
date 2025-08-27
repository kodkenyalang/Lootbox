// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Simple interface to interact with the Blocklock contract
interface IBlocklock {
    function isLocked(uint256 _tokenId) external view returns (bool);
}

/**
 * @title ItemNFT
 * @notice An ERC721 token that checks with the Blocklock contract before allowing transfers.
 */
contract ItemNFT is ERC721, Ownable {
    IBlocklock public immutable blocklock;
    uint256 private _nextTokenId;

    constructor(
        address _blocklockAddress,
        address initialOwner
    ) ERC721("LootBox Item", "LBI") Ownable(initialOwner) {
        require(_blocklockAddress != address(0), "ItemNFT: Invalid blocklock address");
        blocklock = IBlocklock(_blocklockAddress);
    }

    /**
     * @dev Mints a new token. Can only be called by the owner (LootBoxManager).
     */
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Hook that is called before any token transfer.
     * This is where we enforce the lock.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // A mint operation is a transfer from address(0). We don't want to block minting.
        if (from != address(0)) {
            require(!blocklock.isLocked(tokenId), "ItemNFT: Token is locked and cannot be transferred");
        }
    }
}