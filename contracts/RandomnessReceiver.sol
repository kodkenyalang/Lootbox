// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRandomness.sol";

abstract contract RandomnessReceiver {
    IRandomness internal immutable randomness;

    constructor(address _randomnessAddress) {
        randomness = IRandomness(_randomnessAddress);
    }

    function _requestRandomness() internal returns (bytes32 requestId) {
        requestId = randomness.requestRandomness();
        return requestId;
    }

    function _fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual;
}
