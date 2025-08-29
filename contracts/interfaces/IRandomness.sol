// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRandomness {
    function requestRandomness() external returns (bytes32 requestId);
}
