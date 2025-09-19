import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import DaoTabs from '../components/DaoTabs';
import { useDaoInfo, useBackendDaoInfo, useDaoWalletAddresses, useDaoTokenBalances, useDaoProposals, useDistributionRecords, useMemberBalances } from '../hooks/daoHooks';
import { useAuthClient } from '../hooks/useAuthClient';

import {
  Building2,
  Users,
  Coins,
  Globe,
  Settings,
  ArrowLeft,
  Plus,
  FileText,
  BarChart3,
  X,
  AlertTriangle,
  Wallet,
  Hash,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Calendar,
  Brain
} from 'lucide-react';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';
import OverviewTab from '../components/tabs/OverviewTab';
import MembersTab from '../components/tabs/MembersTab';
import ProposalsTab from '../components/tabs/ProposalsTab';
import DistributionTab from '../components/tabs/DistributionTab';
import TreasuryTab from '../components/tabs/TreasuryTab';
import GovernanceTab from '../components/tabs/GovernanceTab';
import CommitteesTab from '../components/tabs/CommitteesTab';
import CanisterTab from '../components/tabs/CanisterTab';

function formatDate(bigintOrNumber) {
  let ms;
  if (typeof bigintOrNumber === 'bigint') {
    // Assume nanoseconds, convert to milliseconds
    ms = Number(bigintOrNumber) / 1000000;
  } else {
    ms = Number(bigintOrNumber);
  }
  return new Date(ms).toLocaleDateString();
}

// Centralized Treasury Data Object (simulating backend response)
const getTreasuryData = () => {
  return {
    totalBalance: {
      usd: 1247893.45,
      change: {
        percentage: 15.3,
        period: 'quarter',
        direction: 'up'
      },
      lastUpdated: '2:34:12 PM'
    },
    assets: [
      {
        chain: 'Bitcoin',
        symbol: 'BTC',
        amount: 18.5432,
        usdValue: 349876.23,
        percentage: 28.0,
        color: '#f7931a',
        price: 18900.45
      },
      {
        chain: 'Ethereum',
        symbol: 'ETH',
        amount: 142.789,
        usdValue: 274536.78,
        percentage: 22.0,
        color: '#627eea',
        price: 1923.45
      },
      {
        chain: 'Internet Computer',
        symbol: 'ICP',
        amount: 4567.234,
        usdValue: 237089.12,
        percentage: 19.0,
        color: '#29abe2',
        price: 51.89
      },
      {
        chain: 'Solana',
        symbol: 'SOL',
        amount: 1876.543,
        usdValue: 187184.32,
        percentage: 15.0,
        color: '#9945ff',
        price: 99.78
      },
      {
        chain: 'Others',
        symbol: 'MISC',
        amount: 1,
        usdValue: 199207.00,
        percentage: 16.0,
        color: '#64748b',
        price: 199207.00
      }
    ],
    performanceHistory: [
      { date: '2024-01-01', value: 785432.12 },
      { date: '2024-01-02', value: 792156.34 },
      { date: '2024-01-03', value: 788934.56 },
      { date: '2024-01-04', value: 801245.78 },
      { date: '2024-01-05', value: 795678.90 },
      { date: '2024-01-06', value: 812456.12 },
      { date: '2024-01-07', value: 808123.34 },
      { date: '2024-01-08', value: 825789.56 },
      { date: '2024-01-09', value: 819456.78 },
      { date: '2024-01-10', value: 834567.90 },
      { date: '2024-01-11', value: 828234.12 },
      { date: '2024-01-12', value: 845123.34 },
      { date: '2024-01-13', value: 839789.56 },
      { date: '2024-01-14', value: 856456.78 },
      { date: '2024-01-15', value: 851123.90 },
      { date: '2024-01-16', value: 867890.12 },
      { date: '2024-01-17', value: 862567.34 },
      { date: '2024-01-18', value: 879234.56 },
      { date: '2024-01-19', value: 873901.78 },
      { date: '2024-01-20', value: 890568.90 },
      { date: '2024-01-21', value: 885235.12 },
      { date: '2024-01-22', value: 901902.34 },
      { date: '2024-01-23', value: 896569.56 },
      { date: '2024-01-24', value: 913236.78 },
      { date: '2024-01-25', value: 907903.90 },
      { date: '2024-01-26', value: 924570.12 },
      { date: '2024-01-27', value: 919237.34 },
      { date: '2024-01-28', value: 935904.56 },
      { date: '2024-01-29', value: 930571.78 },
      { date: '2024-01-30', value: 1247893.45 }
    ],
    transactions: [
      {
        type: 'Received',
        asset: 'ICP',
        amount: 245.67,
        usdValue: 12734.56,
        time: '12 minutes ago',
        hash: '0x1a2b3c4d5e6f7890abcdef1234567890'
      },
      {
        type: 'Sent',
        asset: 'ckBTC',
        amount: 0.15,
        usdValue: 2835.12,
        time: '28 minutes ago',
        hash: '0x9876543210fedcba0987654321abcdef'
      },
      {
        type: 'Swapped',
        asset: 'ckETH',
        amount: 3.42,
        usdValue: 6578.90,
        time: '45 minutes ago',
        hash: '0xabcdef1234567890fedcba0987654321'
      },
      {
        type: 'Staked',
        asset: 'USDC',
        amount: 1500.00,
        usdValue: 1500.00,
        time: '1 hour ago',
        hash: '0x1234567890abcdef1234567890abcdef'
      },
      {
        type: 'Received',
        asset: 'SOL',
        amount: 89.23,
        usdValue: 8901.23,
        time: '2 hours ago',
        hash: '0xfedcba0987654321fedcba0987654321'
      }
    ],
    stats: {
      totalAssets: 23,
      activeChains: 5,
      monthlyGrowth: 12.7,
      riskScore: 'Medium'
    }
  };
};


function DaoInfoPage() {
  const { daoId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  // Initialize treasury data
  const treasuryData = getTreasuryData();

  // Debug: Log the principal from the frontend
  //   console.log("Frontend principal:", principal);

  const { data: dao, isLoading, error } = useDaoInfo();

  // Fetch complete DAO info from backend canister for accurate distribution model
  const { data: backendInfo, isLoading: backendDaoLoading } = useBackendDaoInfo(dao);
  const backendDao = backendInfo?.backendDao;
  const backendActor = backendInfo?.backendActor;

  // Fetch DAO wallet addresses from backend canister
  const { data: daoWalletAddresses, isLoading: addressesLoading, error: addressesError } = useDaoWalletAddresses(dao);


  // Helper to scale nat balances to decimal numbers for display
  const scaleByDecimals = (balanceNat, decimals) => {
    try {
      if (balanceNat === null || balanceNat === undefined) return 0;
      const bn = typeof balanceNat === 'bigint' ? balanceNat : BigInt(balanceNat);
      const denom = 10n ** BigInt(decimals);
      const integer = bn / denom;
      const fraction = bn % denom;
      const fracStr = fraction.toString().padStart(Number(decimals), '0').slice(0, 6);
      return Number(`${integer}.${fracStr}`);
    } catch (e) {
      return 0;
    }
  };

  // Fetch token balances for required assets across chains
  const { data: tokenBalances, isLoading: daoTreasuryBalancesLoading, error: balancesError, refetch: refetchDaoTreasuryBalances } = useDaoTokenBalances(dao, daoWalletAddresses);

  // Fetch real-time proposals from the DAO canister
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useDaoProposals(dao);

  // Fetch distribution records
  const { data: distributionRecords = [], isLoading: distributionRecordsLoading, error: distributionRecordsError } = useDistributionRecords(dao);

  // Fetch member token balances
  const { data: memberBalances = {}, isLoading: balancesLoading } = useMemberBalances(dao);

  const validTabs = new Set(['overview','members','proposals','distribution','treasury','governance','committees','canister']);
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(validTabs.has(initialTab) ? initialTab : 'overview');

  // Keep activeTab in sync with URL query param changes
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && validTabs.has(t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const [isRetryingToken, setIsRetryingToken] = useState(false);
  const [tokenRetryStatus, setTokenRetryStatus] = useState(null); // 'success', 'error', or null
  const handleRetryTokenCreation = async () => {
    if (!dao || !dao.base_token.distribution_model) {
      console.error('Missing required data for token creation retry');
      return;
    }

    setIsRetryingToken(true);
    setTokenRetryStatus(null);

    try {
      const tokenArg = {
        name: dao.base_token.name,
        symbol: dao.base_token.symbol,
        decimals: dao.base_token.decimals,
        total_supply: dao.base_token.total_supply,
        distribution_model: dao.base_token.distribution_model,
      };

      console.log('Retrying token creation...');

      const tokenResult = await backendActor.create_dao_base_token(tokenArg, {Text: 'Token Logo'});

      if (tokenResult && tokenResult.Ok) {
        setTokenRetryStatus('success');
        console.log('Token created successfully:', tokenResult.Ok);
        // Refresh the backend DAO data to show the new token
        await queryClient.invalidateQueries({ queryKey: ['backend-dao-info', dao.id] });
      } else {
        setTokenRetryStatus('error');
        console.error('Token creation failed:', tokenResult?.Err || tokenResult);
      }
    } catch (err) {
      setTokenRetryStatus('error');
      console.error('Failed to retry token creation:', err);
    } finally {
      setIsRetryingToken(false);
      // Reset status after 5 seconds
      setTimeout(() => setTokenRetryStatus(null), 5000);
    }
  };

  // Mock data - replace with actual API call
  useEffect(() => {
    // This useEffect is no longer needed as data fetching is handled by react-query
    // The mock data fetching logic is removed.
  }, [daoId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading DAO information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading DAO</h2>
          <p className="text-slate-600 mb-4">Failed to fetch DAO information.</p>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">DAO Not Found</h2>
          <p className="text-slate-600 mb-4">The DAO you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DAO Header */}
        <div className="flex items-center gap-6 mb-8">
          <Link to="/dashboard" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center overflow-hidden">
              {dao.icon_url ? (
                <img src={dao.icon_url} alt={dao.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="text-white w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{dao.name}</h1>
              <p className="text-xs text-slate-400">Created {formatDate(dao.created_at)}</p>
            </div>
          </div>

        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col min-h-[600px]">
          <div className="border-b border-slate-200">
            <DaoTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 min-h-0 flex flex-col">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewTab
                dao={dao}
                proposals={proposals}
                proposalsLoading={proposalsLoading}
                scaleByDecimals={scaleByDecimals}
                formatDate={formatDate}
              />
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersTab
                dao={dao}
                memberBalances={memberBalances}
                balancesLoading={balancesLoading}
                scaleByDecimals={scaleByDecimals}
                formatDate={formatDate}
              />
            )}

            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <ProposalsTab
                dao={dao}
                backendDao={backendDao}
                backendActor={backendActor}
                proposals={proposals}
                proposalsLoading={proposalsLoading}
                proposalsError={proposalsError}
                refetchProposals={refetchProposals}
              />
            )}

            {/* Distribution Tab */}
            {activeTab === 'distribution' && (
              <DistributionTab
                dao={dao}
                distributionRecords={distributionRecords}
                distributionRecordsLoading={distributionRecordsLoading}
                distributionRecordsError={distributionRecordsError}
                scaleByDecimals={scaleByDecimals}
                formatDate={formatDate}
              />
            )}

            {/* Treasury Tab */}
            {activeTab === 'treasury' && (
              <TreasuryTab
                dao={dao}
                treasuryData={treasuryData}
                transactions={treasuryData?.transactions || []}
                transactionsLoading={false}
                transactionsError={null}
                formatDate={formatDate}
                scaleByDecimals={scaleByDecimals}
                daoWalletAddresses={daoWalletAddresses}
                tokenBalances={tokenBalances}
                daoTreasuryBalancesLoading={daoTreasuryBalancesLoading}
                balancesError={balancesError}
                addressesLoading={addressesLoading}
                addressesError={addressesError}
              />
            )}

            {/* Governance Tab */}
            {activeTab === 'governance' && (
              <GovernanceTab dao={dao} backendDao={backendDao} scaleByDecimals={scaleByDecimals} />
            )}

            {/* Committees Tab */}
            {activeTab === 'committees' && (
              <CommitteesTab
                dao={dao}
                backendDao={backendDao}
                backendDaoLoading={backendDaoLoading}
                backendActor={backendActor}
              />
            )}

            {/* Canister Tab */}
            {activeTab === 'canister' && (
              <CanisterTab dao={dao} />
            )}
          </div>
        </div>
      </main>

      {/* Removed: Proposal Creation Modal, Success Toast, and Proposal Co-pilot Modal (moved into ProposalsTab) */}
    </div>
  );
}

export default DaoInfoPage;