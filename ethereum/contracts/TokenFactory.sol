// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CustomToken.sol";

/// @notice Token Factory for creating CustomToken instances
contract TokenFactory {
    address[] public allTokens;

    /// @notice Emitted when a new token is created
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 supply,
        address owner
    );

    /// @notice Create a new CustomToken
    /// @param name Token name
    /// @param symbol Token symbol
    /// @param supply Initial supply (in smallest unit, e.g., wei)
    /// @param owner Owner of the newly minted tokens
    function createToken(
        string memory name,
        string memory symbol,
        uint256 supply,
        address owner
    ) external returns (address) {
        // Deploy a new CustomToken
        CustomToken token = new CustomToken(name, symbol, supply, owner);

        // Store the token address
        allTokens.push(address(token));

        // Emit event
        emit TokenCreated(address(token), name, symbol, supply, owner);

        return address(token);
    }

    /// @notice Get all token addresses created by this factory
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
}
