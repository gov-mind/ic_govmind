use candid::{Nat, Principal};
use ethers_core::abi::{Abi, Address, FunctionExt, Token};
use evm_rpc_types::{
    CallArgs, MultiRpcResult, RpcApi, RpcConfig, RpcError, RpcService, RpcServices,
    SendRawTransactionStatus,
};
use ic_cdk::api::call::CallResult;
use ic_govmind_types::constants::EVM_CALL_DEFAULT_CYCLES;
use serde_json::{json, Value};

use crate::services::evm_abi::{parse_abi, BALANCE_OF_ABI_JSON};

pub struct EvmService {
    pub principal: Principal,
}

#[allow(dead_code)]
impl EvmService {
    pub fn new(principal_text: &str) -> Result<Self, String> {
        let principal = Principal::from_text(principal_text)
            .map_err(|_| format!("Invalid principal PID: {}", principal_text))?;
        Ok(Self { principal })
    }

    fn build_json_rpc_request(method: &str, params: Vec<Value>) -> String {
        json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1,
        })
        .to_string()
    }

    pub async fn get_eth_balance(
        &self,
        service: RpcService,
        address: &str,
    ) -> CallResult<(Result<String, RpcError>,)> {
        let json_request =
            Self::build_json_rpc_request("eth_getBalance", vec![json!(address), json!("latest")]);
        ic_cdk::println!("{}", json_request);
        let params = (service, json_request, 1000_u64);

        match ic_cdk::api::call::call_with_payment128(
            self.principal,
            "request",
            params,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
        {
            Ok(result) => {
                ic_cdk::println!("success calling get_eth_balance: {:?}", result);
                Ok(result)
            }
            Err((rejection_code, msg)) => {
                ic_cdk::println!(
                    "Error calling get_eth_balance: {:?}, {:?}",
                    rejection_code,
                    msg
                );
                Err((rejection_code, msg))
            }
        }
    }

    pub async fn get_gas_price(
        &self,
        service: RpcService,
    ) -> CallResult<(Result<String, RpcError>,)> {
        let json_request = Self::build_json_rpc_request("eth_gasPrice", vec![]);
        let params = (service, json_request, 1000_u64);

        ic_cdk::api::call::call_with_payment128(
            self.principal,
            "request",
            params,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
        .map_err(|err| {
            ic_cdk::println!("Error calling get_gas_price: {:?}", err);
            err
        })
    }

    pub async fn get_token_prices(
        &self,
        token_symbols: Vec<&str>,
    ) -> CallResult<(Result<String, RpcError>,)> {
        // Base URL for the API
        let base_url =
            "https://api.g.alchemy.com/prices/v1/Zrf_uaW1uz6JoGyTeZBXvxz5msbiTjeA/tokens/by-symbol";

        // Construct query parameters for the symbols
        let query_params: String = token_symbols
            .iter()
            .map(|symbol| format!("symbols={}", symbol))
            .collect::<Vec<String>>()
            .join("&");

        // Final URL
        let final_url = format!("{}?{}", base_url, query_params);

        // Log the constructed URL
        ic_cdk::println!("Constructed URL: {}", final_url);

        let rpc_api = RpcApi {
            url: final_url,
            headers: None, // Add headers if necessary, e.g., authentication headers
        };

        // Create the RpcService instance
        let service: RpcService = RpcService::Custom(rpc_api);

        let json_request = String::from("{}");

        let params = (service, json_request, 1000_u64);

        // Perform the API call
        match ic_cdk::api::call::call_with_payment128(
            self.principal,
            "request",
            params,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
        {
            Ok(result) => {
                ic_cdk::println!("Success calling get_token_prices: {:?}", result);
                Ok(result)
            }
            Err((rejection_code, msg)) => {
                ic_cdk::println!(
                    "Error calling get_token_prices: {:?}, {:?}",
                    rejection_code,
                    msg
                );
                Err((rejection_code, msg))
            }
        }
    }

    pub async fn eth_send_raw_transaction(
        &self,
        rpc_services: &RpcServices,
        rpc_config: Option<RpcConfig>,
        raw_signed_transaction_hex: String,
    ) -> CallResult<(MultiRpcResult<SendRawTransactionStatus>,)> {
        let raw_signed_transaction_hex_with_prefix = format!("0x{}", raw_signed_transaction_hex);

        let args: (RpcServices, Option<RpcConfig>, String) = (
            rpc_services.clone(),
            rpc_config,
            raw_signed_transaction_hex_with_prefix,
        );

        ic_cdk::api::call::call_with_payment128(
            self.principal,
            "eth_sendRawTransaction",
            args,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
    }

    pub async fn eth_call(
        &self,
        rpc_services: RpcServices,
        rpc_config: Option<RpcConfig>,
        call_args: CallArgs,
    ) -> CallResult<(MultiRpcResult<String>,)> {
        let args = (rpc_services, rpc_config, call_args);
        ic_cdk::call(self.principal, "eth_call", (args,))
            .await
            .map_err(|err| {
                ic_cdk::println!("Error calling eth_call: {:?}", err);
                err
            })
    }

    pub async fn request_cost(
        &self,
        rpc_service: RpcService,
        json: String,
        max_response_bytes: u64,
    ) -> CallResult<(Result<Nat, RpcError>,)> {
        let args = (rpc_service, json, max_response_bytes);
        ic_cdk::call(self.principal, "requestCost", (args,))
            .await
            .map_err(|err| {
                ic_cdk::println!("Error calling requestCost: {:?}", err);
                err
            })
    }

    /// Call a smart contract function using the provided ABI.
    pub async fn eth_contract_call(
        &self,
        service: RpcService,
        contract_address: String,
        abi: &Abi,
        function_name: &str,
        args: &[Token],
        block_number: &str,
    ) -> CallResult<(Result<String, RpcError>,)> {
        let f = match abi.functions_by_name(function_name).map(|v| &v[..]) {
            Ok([f]) => f,
            Ok(fs) => panic!(
                "Found {} function overloads. Please pass one of the following: {}",
                fs.len(),
                fs.iter()
                    .map(|f| format!("{:?}", f.abi_signature()))
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            Err(_) => abi
                .functions()
                .find(|f| function_name == f.abi_signature())
                .expect("Function not found"),
        };

        let data = f
            .encode_input(args)
            .expect("Error while encoding input args");
        let data_hex = format!("0x{}", hex::encode(data));

        let formatted_block_number = if block_number.starts_with("0x") || block_number == "latest" {
            block_number.to_string()
        } else {
            format!("0x{}", block_number)
        };

        let call_params = vec![
            json!({
                "to": contract_address,
                "data": &data_hex,
            }),
            json!(formatted_block_number),
        ];

        let json_request = Self::build_json_rpc_request("eth_call", call_params);
        ic_cdk::println!("{}", json_request);
        let params = (service, json_request, 1000_u64);

        match ic_cdk::api::call::call_with_payment128(
            self.principal,
            "request",
            params,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
        {
            Ok(result) => {
                ic_cdk::println!("success calling eth_contract_call: {:?}", result);
                Ok(result)
            }
            Err((rejection_code, msg)) => {
                ic_cdk::println!(
                    "Error calling eth_contract_call: {:?}, {:?}",
                    rejection_code,
                    msg
                );
                Err((rejection_code, msg))
            }
        }
    }

    pub async fn get_erc20_balance(
        &self,
        rpc_service: RpcService,
        contract_address: String,
        user_address: Address,
        block_number: &str,
    ) -> CallResult<(Result<String, RpcError>,)> {
        // Prepare the parameters for the `balanceOf` function call
        let args = vec![Token::Address(user_address)];
        let balance_of_abi = parse_abi(BALANCE_OF_ABI_JSON);

        // Call `eth_contract_call` with the `balanceOf` function
        self.eth_contract_call(
            rpc_service,
            contract_address,
            &balance_of_abi,
            "balanceOf",
            &args,
            block_number,
        )
        .await
    }

    /// Get the current transaction count (nonce) for an account.
    pub async fn get_account_nonce(
        &self,
        rpc_service: RpcService,
        address: &str,
    ) -> CallResult<(Result<String, RpcError>,)> {
        // Build the JSON-RPC request payload
        let json_request = Self::build_json_rpc_request(
            "eth_getTransactionCount",
            vec![json!(address), json!("latest")],
        );

        ic_cdk::println!("get_account_nonce request: {}", json_request);

        let params = (rpc_service, json_request, 1000_u64);

        // Call the underlying EVM RPC canister
        match ic_cdk::api::call::call_with_payment128(
            self.principal,
            "request",
            params,
            EVM_CALL_DEFAULT_CYCLES,
        )
        .await
        {
            Ok(result) => {
                ic_cdk::println!("success calling get_account_nonce: {:?}", result);
                Ok(result)
            }
            Err((rejection_code, msg)) => {
                ic_cdk::println!(
                    "Error calling get_account_nonce: {:?}, {:?}",
                    rejection_code,
                    msg
                );
                Err((rejection_code, msg))
            }
        }
    }
}
