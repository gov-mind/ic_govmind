// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CustomToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, supply);
    }

    /// @notice Burn a specific amount of tokens from msg.sender
    /// @param amount The number of tokens to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
