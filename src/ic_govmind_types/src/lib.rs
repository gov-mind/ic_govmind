use candid::Nat;
use ciborium::into_writer;
use num_traits::cast::ToPrimitive;
use serde::Serialize;

pub mod chain;
pub mod constants;
pub mod dao;
pub mod icrc;
pub mod payment;
pub mod status;
pub mod user;

mod bytes;
pub use bytes::*;

pub fn crc32(data: &[u8]) -> u32 {
    let mut h = crc32fast::Hasher::new();
    h.update(data);
    h.finalize()
}

pub fn nat_to_u64(nat: &Nat) -> u64 {
    nat.0.to_u64().unwrap_or(0)
}

// to_cbor_bytes returns the CBOR encoding of the given object that implements the Serialize trait.
pub fn to_cbor_bytes(obj: &impl Serialize) -> Vec<u8> {
    let mut buf: Vec<u8> = Vec::new();
    into_writer(obj, &mut buf).expect("failed to encode in CBOR format");
    buf
}
