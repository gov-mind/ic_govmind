use candid::{Nat, Principal};
use ic_cdk::call::Call;
use ic_ledger_types::{
    AccountBalanceArgs, AccountIdentifier, Memo, Subaccount, Timestamp, Tokens, TransferArgs,
    TransferResult,
};
use icrc_ledger_types::{
    icrc1::{
        account::Account,
        transfer::{Memo as ICRCMemo, TransferArg, TransferError},
    },
    icrc2::approve::{ApproveArgs, ApproveError},
};

#[derive(Clone, Debug)]
pub struct TokenICRC1 {
    pub principal: Principal,
}

#[allow(dead_code)]
impl TokenICRC1 {
    pub fn new(principal_text: &str) -> Result<Self, String> {
        let principal = Principal::from_text(principal_text)
            .map_err(|_| format!("Invalid principal PID: {}", principal_text))?;
        Ok(Self { principal })
    }

    pub async fn account_balance(
        &self,
        account_id: AccountIdentifier,
    ) -> Result<(Tokens,), String> {
        let args = AccountBalanceArgs {
            account: account_id,
        };

        match Call::bounded_wait(self.principal, "account_balance")
            .with_arg((args,))
            .await
        {
            Ok(res) => match res.candid::<Result<Tokens, String>>() {
                Ok(Ok(balance)) => Ok((balance,)),
                Ok(Err(e)) => Err(format!("Call returned an error: {}", e)),
                Err(e) => Err(format!("Decoding error: {:?}", e)),
            },
            Err(e) => Err(format!("Call failed: {:?}", e)),
        }
    }

    pub async fn transfer(
        &self,
        from_subaccount: Option<Subaccount>,
        to: AccountIdentifier,
        amount: Tokens,
        memo: Memo,
        fee: Tokens,
        created_at_time: Option<Timestamp>,
    ) -> Result<(TransferResult,), String> {
        let args = TransferArgs {
            from_subaccount,
            to,
            amount,
            memo,
            fee,
            created_at_time,
        };

        match Call::bounded_wait(self.principal, "transfer")
            .with_arg((args,))
            .await
        {
            Ok(res) => match res.candid::<(TransferResult,)>() {
                Ok(result) => Ok(result),
                Err(e) => Err(format!("Decoding error: {:?}", e)),
            },
            Err(e) => Err(format!("Call failed: {:?}", e)),
        }
    }

    pub async fn icrc1_balance_of(&self, account: Account) -> Result<(Nat,), String> {
        match Call::bounded_wait(self.principal, "icrc1_balance_of")
            .with_arg((account,))
            .await
        {
            Ok(res) => match res.candid::<(Nat,)>() {
                Ok(result) => Ok(result),
                Err(e) => Err(format!("Decoding error: {:?}", e)),
            },
            Err(e) => Err(format!("Call failed: {:?}", e)),
        }
    }

    pub async fn icrc1_transfer(
        &self,
        from_subaccount: Option<[u8; 32]>,
        to: Account,
        amount: Nat,
        fee: Option<Nat>,
        memo: Option<ICRCMemo>,
        created_at_time: Option<u64>,
    ) -> Result<(Result<Nat, TransferError>,), String> {
        let args = TransferArg {
            from_subaccount,
            to,
            amount,
            fee,
            memo,
            created_at_time,
        };

        match Call::bounded_wait(self.principal, "icrc1_transfer")
            .with_arg((args,))
            .await
        {
            Ok(res) => match res.candid::<(Result<Nat, TransferError>,)>() {
                Ok(result) => Ok(result),
                Err(e) => Err(format!("Decoding error: {:?}", e)),
            },
            Err(e) => Err(format!("Call failed: {:?}", e)),
        }
    }

    pub async fn icrc2_approve(
        &self,
        from_subaccount: Option<[u8; 32]>,
        spender: Account,
        amount: Nat,
        expected_allowance: Option<Nat>,
        fee: Option<Nat>,
        memo: Option<ICRCMemo>,
        created_at_time: Option<u64>,
        expires_at: Option<u64>,
    ) -> Result<(Result<Nat, ApproveError>,), String> {
        let args = ApproveArgs {
            from_subaccount,
            spender,
            amount,
            expected_allowance,
            fee,
            memo,
            created_at_time,
            expires_at,
        };

        match Call::bounded_wait(self.principal, "icrc2_approve")
            .with_arg((args,))
            .await
        {
            Ok(res) => match res.candid::<(Result<Nat, ApproveError>,)>() {
                Ok(result) => Ok(result),
                Err(e) => Err(format!("Decoding error: {:?}", e)),
            },
            Err(e) => Err(format!("Call failed: {:?}", e)),
        }
    }
}
