// Shared token amount conversion utilities

/**
 * Convert a human-readable decimal amount to base units (BigInt) given token decimals.
 * Accepts strings or numbers like "123.45" and enforces decimal precision.
 *
 * @param {string|number} value - Decimal amount to convert (e.g., "123.45").
 * @param {number} decimals - Number of decimals for the token.
 * @returns {bigint} Base units as BigInt.
 */
export function toUnits(value, decimals) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error("Amount is required");
  const parts = s.split(".");
  if (parts.length > 2) throw new Error("Invalid amount");
  const whole = parts[0] === "" ? "0" : parts[0];
  const frac = (parts[1] || "").replace(/[^0-9]/g, "");
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(frac)) throw new Error("Invalid amount");
  if (frac.length > Number(decimals)) throw new Error(`Too many decimal places (max ${decimals})`);
  const base = BigInt(10) ** BigInt(decimals);
  const wholeBI = BigInt(whole || "0");
  const fracBI = BigInt((frac || "").padEnd(Number(decimals), "0") || "0");
  return wholeBI * base + fracBI;
}

/**
 * Convert base units (BigInt) to a human-readable decimal number string.
 *
 * @param {bigint|number|string} balanceNat - Base units as BigInt or coercible.
 * @param {number} decimals - Number of decimals for the token.
 * @param {number} [fractionDigits=6] - Max fractional digits for display.
 * @returns {string} Decimal amount string.
 */
export function fromUnits(balanceNat, decimals, fractionDigits = 6) {
  try {
    if (balanceNat === null || balanceNat === undefined) return "0";
    const bn = typeof balanceNat === "bigint" ? balanceNat : BigInt(balanceNat);
    const denom = BigInt(10) ** BigInt(decimals);
    const integer = bn / denom;
    const fraction = bn % denom;
    const fracStr = fraction
      .toString()
      .padStart(Number(decimals), "0")
      .slice(0, Math.min(Number(decimals), Number(fractionDigits)));
    return fracStr.length > 0 ? `${integer.toString()}.${fracStr}` : integer.toString();
  } catch (e) {
    return "0";
  }
}