// Shared formatting helpers for principals and member IDs

// Shorten an ICP principal string safely
export function formatPrincipalShort(principalText, head = 8, tail = 4) {
  if (!principalText || typeof principalText !== 'string') return '';
  const s = principalText.trim();
  if (s.length <= head + tail) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// Derive a display ID for a member, prioritizing ICP principal
export function formatMemberDisplayId(member, index = 0) {
  const principalText = member?.icpPrincipal || member?.icp_principal || '';
  const short = formatPrincipalShort(principalText);
  if (short) return short;
  const fallbackIndex = typeof index === 'number' ? index + 1 : 1;
  return `member-${fallbackIndex}`;
}

// Backward-compatible function to shorten generic IDs (user_id, other strings)
export function shortenId(idText, head = 6, tail = 6) {
  if (!idText) return '';
  const s = String(idText);
  return s.length > head + tail ? `${s.slice(0, head)}...${s.slice(-tail)}` : s;
}