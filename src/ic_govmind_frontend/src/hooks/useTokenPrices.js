import { useQuery } from '@tanstack/react-query';

// Map frontend symbols to CoinGecko IDs
const COINGECKO_IDS = {
  ICP: 'internet-computer',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
};

export function useTokenPrices(symbols = ['ICP', 'BTC', 'ETH', 'USDT']) {
  const ids = symbols
    .map((s) => COINGECKO_IDS[s])
    .filter(Boolean)
    .join(',');

  return useQuery({
    queryKey: ['tokenPrices', ids],
    queryFn: async () => {
      if (!ids) return {};
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      const data = await res.json();
      const prices = {};
      for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
        const p = data[id]?.usd;
        if (typeof p === 'number') prices[sym] = p;
      }
      return prices;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}