// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBlocklock {
    function setLock(uint256 tokenId, uint256 unlockBlockNumber) external;
    function isLocked(uint256 tokenId) external view returns (bool);
}
