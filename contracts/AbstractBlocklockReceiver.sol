// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBlocklock.sol";

abstract contract AbstractBlocklockReceiver {
    IBlocklock public blocklock;

    modifier onlyBlocklock() {
        require(msg.sender == address(blocklock), "Only Blocklock");
        _;
    }

    function setBlocklockAddress(address _blocklockAddress) external {
        // This function should be access controlled, e.g., only owner
        blocklock = IBlocklock(_blocklockAddress);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal view virtual {
        if (address(blocklock) != address(0)) {
            require(!blocklock.isLocked(tokenId), "Token is locked");
        }
    }
}
