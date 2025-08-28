// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBlocklock {
    function isLocked(uint256 _tokenId) external view returns (bool);
    function setLock(uint256 _tokenId, uint256 _unlockBlockNumber) external;
}
