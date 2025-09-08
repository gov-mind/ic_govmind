use candid::Principal;
use ethers_core::abi::{encode, Abi, Token};
use ethers_core::types::{Address as EthersAddress, U256};
use hex::decode;
use serde_json::from_str;

use crate::chain::ethereum::keccak256;
use crate::utils::principal_to_eth_hex;

#[allow(dead_code)]
pub const BALANCE_OF_ABI_JSON: &str = r#"
    [{
        "constant": true,
        "inputs": [
        {
            "name": "_owner",
            "type": "address"
        }
        ],
        "name": "balanceOf",
        "outputs": [
        {
            "name": "balance",
            "type": "uint256"
        }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }]
"#;

#[allow(dead_code)]
pub const CKETH_DEPOSIT_ABI_JSON: &str = r#"
    [{
        "inputs": [
            { "internalType": "bytes32", "name": "_principal", "type": "bytes32" }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }]
"#;

#[allow(dead_code)]
pub const CREATE_TOKEN_ABI_JSON: &str = r#"
    [{
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "supply",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "createToken",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }]
"#;

pub fn parse_abi(abi_json: &str) -> Abi {
    from_str(abi_json).expect("Failed to parse ABI")
}

pub fn generate_erc20_transfer_data(recipient: &str, amount: u64) -> Result<Vec<u8>, String> {
    // Define the function signature hash for "transfer(address,uint256)"
    let function_signature = keccak256(b"transfer(address,uint256)")[..4].to_vec();

    let trimmed_recipient = recipient.strip_prefix("0x").unwrap_or(recipient);
    // Decode recipient address from hex string to create ethers_core::Address (H160)
    let decoded_address =
        decode(trimmed_recipient).map_err(|e| format!("Invalid hex in address: {:?}", e))?;
    // Check if the decoded address has the correct length (20 bytes for H160)
    if decoded_address.len() != 20 {
        return Err("Invalid address length".to_string());
    }
    let ethers_recipient_address = EthersAddress::from_slice(&decoded_address);

    let amount_u256 = U256::from(amount);

    // Encode the function call using ethers ABI encode function
    let data = [
        function_signature,
        encode(&[
            Token::Address(ethers_recipient_address),
            Token::Uint(amount_u256),
        ]),
    ]
    .concat();

    Ok(data)
}

pub fn generate_erc20_approve(spender: &str, amount: u64) -> Result<Vec<u8>, String> {
    let function_signature = keccak256(b"approve(address,uint256)")[..4].to_vec();

    let trimmed_spender = spender.strip_prefix("0x").unwrap_or(spender);
    let decoded_address =
        decode(trimmed_spender).map_err(|e| format!("Invalid hex in address: {:?}", e))?;
    if decoded_address.len() != 20 {
        return Err("Invalid address length".to_string());
    }
    let ethers_spender_address = EthersAddress::from_slice(&decoded_address);

    let amount_u256 = U256::from(amount);

    let data = [
        function_signature,
        encode(&[
            Token::Address(ethers_spender_address),
            Token::Uint(amount_u256),
        ]),
    ]
    .concat();

    Ok(data)
}

/// Constructs the calldata for calling `depositEth(bytes32,bytes32)`
pub fn generate_cketh_deposit(principal: Principal) -> Result<Vec<u8>, String> {
    // Function signature for `deposit(bytes32)`
    let function_signature = keccak256(b"deposit(bytes32)")[..4].to_vec();

    let fixed_principal_bytes = principal_to_eth_hex(&principal);

    // Encode the function call data
    let data = [
        function_signature,
        encode(&[Token::FixedBytes(fixed_principal_bytes.to_vec())]),
    ]
    .concat();

    Ok(data)
}

/// Constructs the calldata for calling `depositEth(bytes32,bytes32)`
pub fn generate_cketh_deposit_eth(
    principal: Principal,
    subaccount: [u8; 32],
) -> Result<Vec<u8>, String> {
    // Function selector for depositErc20(address,uint256,bytes32,bytes32)
    let function_signature = keccak256("depositEth(bytes32,bytes32)".as_bytes())[..4].to_vec();

    let fixed_principal_bytes = principal_to_eth_hex(&principal);
    let principal_token = Token::FixedBytes(fixed_principal_bytes.to_vec());
    let subaccount_token = Token::FixedBytes(subaccount.to_vec());

    // ABI encode the tokens and concatenate with function selector
    let data = [
        function_signature,
        encode(&[principal_token, subaccount_token]),
    ]
    .concat();

    Ok(data)
}

/// Constructs the calldata for calling `depositErc20(address,uint256,bytes32,bytes32)`
pub fn generate_cketh_deposit_erc20(
    erc20_address: EthersAddress,
    amount: u128,
    principal: Principal,
    subaccount: [u8; 32],
) -> Result<Vec<u8>, String> {
    let function_signature =
        keccak256("depositErc20(address,uint256,bytes32,bytes32)".as_bytes())[..4].to_vec();

    let fixed_principal_bytes = principal_to_eth_hex(&principal);

    let tokens = vec![
        Token::Address(erc20_address),
        Token::Uint(amount.into()),
        Token::FixedBytes(fixed_principal_bytes.to_vec()),
        Token::FixedBytes(subaccount.to_vec()),
    ];

    // ABI encode the tokens and concatenate with function selector
    let data = [function_signature, encode(&tokens)].concat();

    Ok(data)
}

/// Constructs the calldata for calling `createToken(string,string,uint256,address)`
pub fn generate_create_token(
    name: String,
    symbol: String,
    supply: u64,
    owner: EthersAddress,
) -> Result<Vec<u8>, String> {
    // Function signature for `createToken(string,string,uint256,address)`
    let function_signature = keccak256(b"createToken(string,string,uint256,address)")[..4].to_vec();

    let name_token = Token::String(name);
    let symbol_token = Token::String(symbol);
    let supply_token = Token::Uint(U256::from(supply));
    let owner_token = Token::Address(owner);

    // ABI encode the tokens and concatenate with function selector
    let data = [
        function_signature,
        encode(&[name_token, symbol_token, supply_token, owner_token]),
    ]
    .concat();

    Ok(data)
}
