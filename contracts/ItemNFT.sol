// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AbstractBlocklockReceiver.sol";

contract ItemNFT is ERC721, ERC721Enumerable, Ownable, AbstractBlocklockReceiver {
    uint256 private _nextTokenId;

    constructor(address initialOwner, address blocklockAddress)
        ERC721("LootBox Item", "LBI")
        Ownable(initialOwner)
    {
        setBlocklockAddress(blocklockAddress);
    }

    function safeMint(address to) public {
        // In a real scenario, this should be restricted to the LootBoxManager contract
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // Using the inherited hook from AbstractBlocklockReceiver
        AbstractBlocklockReceiver._beforeTokenTransfer(from, to, tokenId);
    }
}
