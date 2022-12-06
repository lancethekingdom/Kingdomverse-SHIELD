// contracts/King.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./Shield.sol";

// import "hardhat/console.sol";

contract TestShield is Shield {
    constructor() Shield(_msgSender()) {
        _mint(_msgSender(), RESERVE);
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
