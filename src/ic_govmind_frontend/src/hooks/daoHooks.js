import { useQuery } from '@tanstack/react-query';
import { useAuthClient } from './useAuthClient';
import { Principal } from '@dfinity/principal';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';

export function useDaoInfo() {
  const { principal, factoryActor } = useAuthClient();

  return useQuery({
    queryKey: ['dao-info', principal],
    queryFn: async () => {
      if (!factoryActor || !principal) return null;
      const principalObj = Principal.fromText(principal);
      const result = await factoryActor.get_dao_info(principalObj);
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!factoryActor && !!principal,
    staleTime: 30000,
  });
}

export function useBackendDaoInfo(dao) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['backend-dao-info', dao?.id],
    queryFn: async () => {
      if (!dao?.id || !agent) return null;
      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const result = await daoActor.dao_info();
        return result && result.length > 0 ? result[0] : null;
      } catch (err) {
        console.error('Error fetching backend DAO info:', err);
        return null;
      }
    },
    enabled: !!dao?.id && !!agent,
    staleTime: 30000,
  });
}

export function useDaoWalletAddresses(dao) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['dao-wallet-addresses', dao?.id],
    queryFn: async () => {
      if (!dao?.id || !agent) return null;
      const daoActor = createBackendActor(dao.id, { agent });
      const addr = await daoActor.get_dao_wallet_addresses();
      console.log(addr);
      return addr;
    },
    enabled: !!dao?.id && !!agent,
    staleTime: 30000,
  });
}

export function useDaoTokenBalances(dao, daoWalletAddresses) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['dao-token-balances', dao?.id, daoWalletAddresses?.account_identifier_string, daoWalletAddresses?.icrc1_string, daoWalletAddresses?.bitcoin, daoWalletAddresses?.ethereum],
    queryFn: async () => {
      if (!dao?.id || !agent || !daoWalletAddresses) return null;
      const daoActor = createBackendActor(dao.id, { agent });
      const addr = daoWalletAddresses;

      const call = (wallet_address, chain_type, token_name, subaccount = []) => {
        return daoActor.wallet_query_balance({ wallet_address, chain_type, token_name, subaccount });
      };

      const [icpRes, daoRes, btcRes, ethRes, usdtRes] = await Promise.all([
        call(addr.icrc1.owner.toText(), { InternetComputer: null }, 'ICP'),
        call(addr.icrc1.owner.toText(), { InternetComputer: null }, dao?.base_token?.name || 'DAO', addr.icrc1.subaccount),
        call(addr.bitcoin, { Bitcoin: null }, 'BTC'),
        call(addr.ethereum, { Ethereum: null }, 'ETH'),
        call(addr.ethereum, { Ethereum: null }, 'USDT'),
      ]);

      const unwrap = (res) => (res && res.Ok ? res.Ok.balance : 0n);

      return {
        icp: unwrap(icpRes),
        dao: unwrap(daoRes),
        btc: unwrap(btcRes),
        eth: unwrap(ethRes),
        usdt: unwrap(usdtRes),
      };
    },
    enabled: !!dao?.id && !!agent && !!daoWalletAddresses,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useDaoProposals(dao) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['dao-proposals', dao?.id],
    queryFn: async () => {
      if (!dao?.id || !agent) return [];
      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const result = await daoActor.get_all_proposals();
        return result || [];
      } catch (err) {
        console.error('Error fetching proposals:', err);
        return [];
      }
    },
    enabled: !!dao?.id && !!agent,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useDistributionRecords(dao) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['distribution-records', dao?.id],
    queryFn: async () => {
      if (!dao?.id || !agent) return [];
      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const result = await daoActor.list_distribution_records(0n, 100n);
        return result || [];
      } catch (err) {
        console.error('Error fetching distribution records:', err);
        return [];
      }
    },
    enabled: !!dao?.id && !!agent,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useMemberBalances(dao) {
  const { agent } = useAuthClient();

  return useQuery({
    queryKey: ['member-balances', dao?.id, dao?.members?.length],
    queryFn: async () => {
      if (!dao?.id || !agent || !dao?.members) return {};
      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const balances = {};
        for (const member of dao.members) {
          try {
            const walletAddress = member.icp_principal && member.icp_principal.length > 0
              ? (typeof member.icp_principal[0] === 'object' && member.icp_principal[0].toText
                 ? member.icp_principal[0].toText()
                 : String(member.icp_principal[0]))
              : member.user_id;

            const balanceResult = await daoActor.wallet_query_balance({
              chain_type: { InternetComputer: null },
              token_name: dao.base_token.name,
              wallet_address: walletAddress,
              subaccount: []
            });

            if (balanceResult.Ok) {
              balances[member.user_id] = balanceResult.Ok.balance;
            } else {
              balances[member.user_id] = 0n;
            }
          } catch (err) {
            console.error(`Error fetching balance for ${member.user_id}:`, err);
            balances[member.user_id] = 0n;
          }
        }
        return balances;
      } catch (err) {
        console.error('Error fetching member balances:', err);
        return {};
      }
    },
    enabled: !!dao?.id && !!agent && !!dao?.members,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}