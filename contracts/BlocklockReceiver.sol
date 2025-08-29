// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IBlocklock.sol";

abstract contract BlocklockReceiver {
    IBlocklock internal immutable blocklock;

    constructor(address _blocklockAddress) {
        blocklock = IBlocklock(_blocklockAddress);
    }

    function _setLock(uint256 tokenId, uint256 unlockBlockNumber) internal {
        blocklock.setLock(tokenId, unlockBlockNumber);
    }
}
