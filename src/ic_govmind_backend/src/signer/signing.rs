//! Signing capabilities and utilities.

use ethers_core::types::H256;

/// Error during signing.
#[derive(Debug, derive_more::Display, PartialEq, Clone)]
pub enum SigningError {
    /// A message to sign is invalid. Has to be a non-zero 32-bytes slice.
    #[display(fmt = "Message has to be a non-zero 32-bytes slice.")]
    InvalidMessage,
}
impl std::error::Error for SigningError {}

/// Error during sender recovery.
#[derive(Debug, derive_more::Display, PartialEq, Clone)]
pub enum RecoveryError {
    /// A message to recover is invalid. Has to be a non-zero 32-bytes slice.
    #[display(fmt = "Message has to be a non-zero 32-bytes slice.")]
    InvalidMessage,
    /// A signature is invalid and the sender could not be recovered.
    #[display(fmt = "Signature is invalid (check recovery id).")]
    InvalidSignature,
}
impl std::error::Error for RecoveryError {}

/// A struct that represents the components of a secp256k1 signature.
pub struct Signature {
    /// V component in electrum format with chain-id replay protection.
    pub v: u64,
    /// R component of the signature.
    pub r: H256,
    /// S component of the signature.
    pub s: H256,
}

/// Compute the Keccak-256 hash of input bytes.
pub fn keccak256(bytes: &[u8]) -> [u8; 32] {
    use tiny_keccak::{Hasher, Keccak};
    let mut output = [0u8; 32];
    let mut hasher = Keccak::v256();
    hasher.update(bytes);
    hasher.finalize(&mut output);
    output
}

/// Hash a message according to EIP-191.
///
/// The data is a UTF-8 encoded string and will enveloped as follows:
/// `"\x19Ethereum Signed Message:\n" + message.length + message` and hashed
/// using keccak256.
pub fn hash_message<S>(message: S) -> H256
where
    S: AsRef<[u8]>,
{
    let message = message.as_ref();

    let mut eth_message = format!("\x19Ethereum Signed Message:\n{}", message.len()).into_bytes();
    eth_message.extend_from_slice(message);

    keccak256(&eth_message).into()
}
