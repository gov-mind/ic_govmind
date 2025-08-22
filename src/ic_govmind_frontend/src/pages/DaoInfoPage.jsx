import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClient } from '../hooks/useAuthClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
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
  RefreshCw
} from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';
import ProposalAnalysisPanel from '../components/ProposalAnalysisPanel';

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

function formatMemberDate(joined_at) {
  return new Date(Number(joined_at)).toLocaleDateString();
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

// Treasury Performance Chart Component
function TreasuryPerformanceChart({ data }) {
  const chartData = {
    labels: data.performanceHistory.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Treasury Value',
        data: data.performanceHistory.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#64748b',
          callback: function(value) {
            return '$' + (value / 1000).toFixed(0) + 'K';
          }
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div style={{ width: '100%', height: '250px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

// Treasury Asset Allocation Pie Chart Component
function TreasuryAllocationChart({ data }) {
  const chartData = {
    labels: data.assets.map(asset => asset.chain),
    datasets: [
      {
        data: data.assets.map(asset => asset.percentage),
        backgroundColor: data.assets.map(asset => asset.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#64748b',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const asset = data.assets[context.dataIndex];
            return `${asset.chain}: ${asset.percentage}% ($${asset.usdValue.toLocaleString()})`;
          }
        }
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '200px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}

// AI Treasury Analysis Component
function AITreasuryAnalysis({ data }) {
  // Calculate health score based on diversification, growth, and risk factors
  const calculateHealthScore = () => {
    let score = 10;
    
    // Diversification factor (penalize if too concentrated)
    const maxAllocation = Math.max(...data.assets.map(asset => asset.percentage));
    if (maxAllocation > 70) score -= 2;
    else if (maxAllocation > 50) score -= 1;
    
    // Growth factor (reward positive growth)
    if (data.totalBalance.change.percentage > 10) score += 0.5;
    else if (data.totalBalance.change.percentage < 0) score -= 1;
    
    return Math.max(1, Math.min(10, score)).toFixed(1);
  };

  const healthScore = calculateHealthScore();
  const maxAsset = data.assets.reduce((max, asset) => asset.percentage > max.percentage ? asset : max);
  const growthPercentage = data.totalBalance.change.percentage;
  
  const getHealthColor = (score) => {
    if (score >= 8) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' };
    if (score >= 6) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  };
  
  const healthColors = getHealthColor(healthScore);
  
  return (
    <div className={`${healthColors.bg} ${healthColors.border} border rounded-xl overflow-hidden mb-6`}>
      {/* Header with Health Score */}
      <div className="bg-white/60 backdrop-blur-sm px-6 py-4 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">AI Treasury Analysis</h4>
              <p className="text-sm text-slate-500">Real-time insights powered by AI</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm text-slate-600 font-medium">Health Score</span>
              <span className={`text-2xl font-bold ${healthColors.text}`}>{healthScore}</span>
              <span className="text-lg text-slate-400 font-medium">/10</span>
            </div>
            <span className={`text-xs px-3 py-1 ${healthColors.badge} rounded-full font-medium`}>
              {healthScore >= 8 ? 'Excellent' : healthScore >= 6 ? 'Good' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Insight */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">📈</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">Key Insight</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Treasury grew by <span className="font-medium text-green-600">+{growthPercentage}%</span> this month, driven by strong {maxAsset.chain} performance.
                </p>
              </div>
            </div>
          </div>
          
          {/* Potential Risk */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-sm">⚠️</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">Risk Alert</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-medium text-amber-600">{maxAsset.percentage}%</span> concentrated in {maxAsset.chain}. Consider diversification.
                </p>
              </div>
            </div>
          </div>
          
          {/* Opportunity */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-sm">💡</span>
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-slate-900 mb-1">Opportunity</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Staking idle assets could yield <span className="font-medium text-purple-600">~${(data.totalBalance.usd * 0.06).toLocaleString()}</span> annually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DaoInfoPage() {
  const { principal, factoryActor, authClient, agent } = useAuthClient();
  const { daoId } = useParams();
  const queryClient = useQueryClient();
  
  // Initialize treasury data
  const treasuryData = getTreasuryData();

  // Debug: Log the principal from the frontend
  //   console.log("Frontend principal:", principal);

  const { data: dao, isLoading, error } = useQuery({
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

  // Fetch complete DAO info from backend canister for accurate distribution model
  const { data: backendDao, isLoading: backendDaoLoading } = useQuery({
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

  // Fetch real-time proposals from the DAO canister
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useQuery({
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
    staleTime: 10000, // Refresh more frequently for proposals
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch distribution records
  const { data: distributionRecords = [], isLoading: distributionRecordsLoading, error: distributionRecordsError } = useQuery({
    queryKey: ['distribution-records', dao?.id],
    queryFn: async () => {
      if (!dao?.id || !agent) return [];

      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const result = await daoActor.list_distribution_records(0n, 100n); // offset, limit
        return result || [];
      } catch (err) {
        console.error('Error fetching distribution records:', err);
        return [];
      }
    },
    enabled: !!dao?.id && !!agent,
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000, // Auto-refresh every 1 minute
  });

  // Fetch member token balances
  const { data: memberBalances = {}, isLoading: balancesLoading } = useQuery({
    queryKey: ['member-balances', dao?.id, dao?.members?.length],
    queryFn: async () => {
      if (!dao?.id || !agent || !dao?.members) return {};

      try {
        const daoActor = createBackendActor(dao.id, { agent });
        const balances = {};
        
        // Query balance for each member
        for (const member of dao.members) {
          try {
            // Use ICP principal if available, otherwise use user_id
            const walletAddress = member.icp_principal && member.icp_principal.length > 0 
              ? (typeof member.icp_principal[0] === 'object' && member.icp_principal[0].toText 
                 ? member.icp_principal[0].toText() 
                 : String(member.icp_principal[0]))
              : member.user_id;
            
            console.log('Querying wallet balance for:', walletAddress);
            const balanceResult = await daoActor.query_wallet_balance({
              chain_type: { InternetComputer: null },
              token_name: dao.base_token.name,
              wallet_address: walletAddress,
              subaccount: []
            });
            
            if (balanceResult.Ok) {
              console.log('Balance for', walletAddress, ':', balanceResult);
              balances[member.user_id] = balanceResult.Ok.balance;
            }
            else {
              console.log('Error fetching balance for', walletAddress, ':', balanceResult);
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
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Auto-refresh every 1 minute
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState(null); // 'success', 'error', or null

  // Proposal creation state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [proposalCreationStatus, setProposalCreationStatus] = useState(null); // 'success', 'error', or null
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [isRetryingToken, setIsRetryingToken] = useState(false);
  const [tokenRetryStatus, setTokenRetryStatus] = useState(null); // 'success', 'error', or null

  // Handle copy to clipboard with feedback
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle DAO upgrade
  const handleUpgrade = async () => {
    if (!factoryActor) {
      console.error('Factory actor not available');
      return;
    }

    setIsUpgrading(true);
    setUpgradeStatus(null);

    try {
      const result = await factoryActor.upgrade_gov_dao();
      console.log(result);

      if (result && result.Ok !== undefined) {
        setUpgradeStatus('success');
        console.log('DAO upgraded successfully');
        setTimeout(() => setUpgradeStatus(null), 3000); // Reset after 3 seconds
      } else {
        setUpgradeStatus('error');
        console.error('Upgrade failed:', result?.Err || 'Unknown error');
        setTimeout(() => setUpgradeStatus(null), 5000); // Reset after 5 seconds
      }
    } catch (err) {
      setUpgradeStatus('error');
      console.error('Failed to upgrade DAO:', err);
      setTimeout(() => setUpgradeStatus(null), 5000); // Reset after 5 seconds
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle proposal creation
  const handleCreateProposal = async () => {
    if (!proposalTitle.trim() || !proposalContent.trim() || !dao) return;

    setIsCreatingProposal(true);
    setProposalCreationStatus(null);

    try {
      const daoActor = createBackendActor(dao.id, { agent });

      // Call create_proposal on the DAO canister
      const createProposalResult = await daoActor.create_proposal(
        proposalTitle.trim(),
        proposalContent.trim()
      );

      if (createProposalResult && createProposalResult.Ok !== undefined) {
        const proposalId = createProposalResult.Ok;
        console.log('Proposal created with ID:', proposalId);

        // Call submit_proposal_and_analyze in the proposal analyzer with automatic AI analysis
        const analyzerProposalId = `${dao.id}-${proposalId}`;
        
        let analyzerResult;
        try {
          // Use the new combined submit and analyze function
          const { submitProposalAndAnalyze } = await import('../services/aiService');
          
          const result = await submitProposalAndAnalyze(
            proposalTitle.trim(),
            proposalContent.trim(),
            analyzerProposalId
          );
          
          if (result.success) {
            analyzerResult = result.proposalId;
          } else {
            throw new Error(result.error);
          }
        } catch (analyzerError) {
          console.error('Analysis submission failed:', analyzerError.message);
          throw analyzerError; // Re-throw the error since we no longer have a fallback
        }

        console.log('Proposal submitted to analyzer:', analyzerResult);

        // Clear form and close modal
        setProposalTitle('');
        setProposalContent('');
        setShowCreateProposal(false);
        setProposalCreationStatus('success');

        // Refetch proposals data and switch to proposals tab
        await refetchProposals();
        setActiveTab('proposals');
        setSelectedProposalId(proposalId);

        setTimeout(() => setProposalCreationStatus(null), 3000);
      } else {
        setProposalCreationStatus('error');
        console.error('Failed to create proposal:', createProposalResult?.Err || 'Unknown error');
        setTimeout(() => setProposalCreationStatus(null), 5000);
      }
    } catch (err) {
      setProposalCreationStatus('error');
      console.error('Error creating proposal:', err);
      setTimeout(() => setProposalCreationStatus(null), 5000);
    } finally {
      setIsCreatingProposal(false);
    }
  };

  // Handle retry token creation
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

      // Create backend actor for the DAO canister
      const daoActor = createBackendActor(dao.id);
      
      const tokenResult = await daoActor.create_dao_base_token(tokenArg, {Text: 'Token Logo'});

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

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Executed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Expired': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Founder': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Council': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contributor': return 'bg-green-100 text-green-800 border-green-200';
      case 'Voter': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Observer': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const calculateVoteStats = (proposal) => {
    const totalVotes = proposal.votes?.length || 0;
    const yesVotes = proposal.votes?.filter(v => {
      // Handle both string and object formats
      const choice = typeof v.vote_choice === 'string' ? v.vote_choice : Object.keys(v.vote_choice)[0];
      return choice === 'Yes';
    }).length || 0;
    const noVotes = proposal.votes?.filter(v => {
      const choice = typeof v.vote_choice === 'string' ? v.vote_choice : Object.keys(v.vote_choice)[0];
      return choice === 'No';
    }).length || 0;
    const abstainVotes = proposal.votes?.filter(v => {
      const choice = typeof v.vote_choice === 'string' ? v.vote_choice : Object.keys(v.vote_choice)[0];
      return choice === 'Abstain';
    }).length || 0;

    const totalWeight = proposal.votes?.reduce((sum, vote) => sum + Number(vote.weight || 0), 0) || 0;
    const yesWeight = proposal.votes?.filter(v => {
      const choice = typeof v.vote_choice === 'string' ? v.vote_choice : Object.keys(v.vote_choice)[0];
      return choice === 'Yes';
    }).reduce((sum, vote) => sum + Number(vote.weight || 0), 0) || 0;

    return {
      totalVotes,
      yesVotes,
      noVotes,
      abstainVotes,
      totalWeight,
      yesWeight,
      approvalPercentage: totalWeight > 0 ? Math.round((yesWeight / totalWeight) * 100) : 0
    };
  };

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
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'proposals', label: 'Proposals', icon: FileText },
                { id: 'distribution', label: 'Distribution', icon: Coins },
                { id: 'treasury', label: 'Treasury', icon: Wallet },
                { id: 'governance', label: 'Governance', icon: Settings },
                { id: 'canister', label: 'Canister', icon: Hash }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 min-h-0 flex flex-col">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="text-blue-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Members</p>
                        <p className="text-2xl font-bold text-blue-900">{dao.members.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-green-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Active Proposals</p>
                        <p className="text-2xl font-bold text-green-900">
                          {proposalsLoading ? (
                            <span className="text-sm">Loading...</span>
                          ) : (
                            proposals.filter(p => {
                              const status = typeof p.status === 'string' ? p.status : Object.keys(p.status)[0];
                              return status === 'Active';
                            }).length
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Coins className="text-purple-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Token Information</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {parseInt(dao.base_token.total_supply).toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Total Supply</p>
                        {dao.base_token.distribution_model && dao.base_token.distribution_model.length > 0 && dao.base_token.distribution_model[0].emission_rate && dao.base_token.distribution_model[0].emission_rate.length > 0 && (
                          <p className="text-sm text-purple-700 mt-2">
                            Emission Rate: {parseInt(dao.base_token.distribution_model[0].emission_rate[0]).toLocaleString()} per period
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Supported Chains
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dao.chains.map((chain, index) => (
                        <span key={`${Object.keys(chain)[0]}-${index}`} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm">
                          {Object.keys(chain)[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Governance Rules
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vote Weight:</span>
                        <span className="font-medium">{dao.governance.vote_weight_type ? Object.keys(dao.governance.vote_weight_type)[0].replace(/([A-Z])/g, ' $1').trim() : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Approval Threshold:</span>
                        <span className="font-medium">{Number(dao.governance.approval_threshold)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Voting Period:</span>
                        <span className="font-medium">{Number(dao.governance.voting_period_secs) / 86400} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Quorum:</span>
                        <span className="font-medium">{Number(dao.governance.quorum)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {dao.description && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
                    <p className="text-slate-700 leading-relaxed">{dao.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">DAO Members</h3>
                  <span className="text-sm text-slate-500">{dao.members.length} members</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dao.members.map((member) => (
                    <div key={member.user_id} className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">{member.user_id}</h4>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeClass(member.role)}`}>{Object.keys(member.role)[0]}</span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Wallet className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-700">
                                {balancesLoading ? (
                                  <span className="text-xs text-slate-500">Loading...</span>
                                ) : (
                                  `${memberBalances[member.user_id] ? parseInt(memberBalances[member.user_id]).toLocaleString() : '0'} ${dao.base_token.symbol}`
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Token Balance</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                          <span>Reputation: <span className="font-semibold text-slate-800">{Number(member.reputation)}</span></span>
                          {member.icp_principal && member.icp_principal.length > 0 && (
                            <span>ICP: <span className="font-mono">{typeof member.icp_principal[0] === 'object' && member.icp_principal[0].toText ? member.icp_principal[0].toText() : String(member.icp_principal[0])}</span></span>
                          )}
                          {member.eth_address && member.eth_address.length > 0 && (
                            <span>ETH: <span className="font-mono">{member.eth_address[0]}</span></span>
                          )}
                          {member.sol_address && member.sol_address.length > 0 && (
                            <span>SOL: <span className="font-mono">{member.sol_address[0]}</span></span>
                          )}
                          <span>Joined: <span className="font-mono">{formatMemberDate(member.joined_at)}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Proposals</h3>
                    {proposalsLoading && (
                      <p className="text-sm text-slate-500 mt-1">Loading proposals...</p>
                    )}
                    {proposalsError && (
                      <p className="text-sm text-red-500 mt-1">Error loading proposals</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowCreateProposal(true)}
                    className="ml-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Proposal</span>
                  </button>
                </div>



                {proposalsLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading proposals...</p>
                    </div>
                  </div>
                ) : proposalsError ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Proposals</h3>
                      <p className="text-slate-600 mb-4">Failed to load proposals from the DAO canister.</p>
                      <button
                        onClick={() => refetchProposals()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <ProposalAnalysisPanel
                    proposals={proposals.map(proposal => {
                      const voteStats = calculateVoteStats(proposal);
                      // Handle status - it might be an object or string
                      const status = typeof proposal.status === 'string' ? proposal.status : Object.keys(proposal.status)[0];

                      return {
                        id: Number(proposal.id),
                        title: proposal.title,
                        summary: proposal.content,
                        proposer: proposal.proposer,
                        status: status,
                        votesFor: voteStats.yesVotes,
                        votesAgainst: voteStats.noVotes,
                        compositeId: `${dao.id}-${proposal.id}`, // Format for analyzer
                        created_at: Number(proposal.created_at),
                        expires_at: Number(proposal.expires_at)
                      };
                    })}
                    canisterName={dao?.name || 'DAO'}
                    selectedProposalId={selectedProposalId}
                    setSelectedProposalId={setSelectedProposalId}
                  />
                )}
              </div>
            )}

            {/* Distribution Tab */}
            {activeTab === 'distribution' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Token Distribution Records</h3>

                {distributionRecordsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading distribution records...</p>
                    </div>
                  </div>
                ) : distributionRecordsError ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Distribution Records</h3>
                    <p className="text-slate-600">Failed to load token distribution history.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {distributionRecords && distributionRecords.length > 0 ? (
                      distributionRecords.map((record_with_index) => {
                        const [index, record] = record_with_index;

                        const distributionType = typeof record.distribution_type === 'string' 
                          ? record.distribution_type 
                          : Object.keys(record.distribution_type)[0];
                        
                        return (
                          <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  distributionType === 'Initial' ? 'bg-blue-100' :
                                  distributionType === 'Emission' ? 'bg-green-100' :
                                  'bg-purple-100'
                                }`}>
                                  <Coins className={`w-5 h-5 ${
                                    distributionType === 'Initial' ? 'text-blue-600' :
                                    distributionType === 'Emission' ? 'text-green-600' :
                                    'text-purple-600'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900">{distributionType} Distribution</h4>
                                  <p className="text-sm text-slate-500">{formatDate(record.timestamp)}</p>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                distributionType === 'Initial' ? 'bg-blue-100 text-blue-800' :
                                distributionType === 'Emission' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {distributionType}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Recipient:</span>
                                  <span className="font-mono text-sm truncate max-w-32">
                                    {record.recipient.slice(0, 8)}...{record.recipient.slice(-8)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Amount:</span>
                                  <span className="font-medium text-green-600">
                                    {parseInt(record.amount).toLocaleString()} {dao.base_token.symbol}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Status:</span>
                                  <span className={`font-medium ${
                                    record.tx_result.startsWith('Success') ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {record.tx_result.startsWith('Success') ? 'Success' : 'Failed'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <Coins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Distribution Records</h3>
                        <p className="text-slate-600">No token distribution history found for this DAO.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Treasury Tab */}
            {activeTab === 'treasury' && (
              <div className="space-y-6">
                {/* Treasury Dashboard Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Treasury Dashboard</h3>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <RefreshCw className="w-4 h-4" />
                    <span>Last updated: {treasuryData.totalBalance.lastUpdated}</span>
                  </div>
                </div>

                {/* Optimized Layout */}
                <div className="space-y-6">
                  {/* AI Treasury Analysis - Full Width */}
                  <AITreasuryAnalysis data={treasuryData} />
                  
                  {/* Main Dashboard Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Stats & Navigation */}
                    <div className="lg:col-span-1 space-y-6">
                    {/* Total Treasury Value */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold">Total Treasury Value</h4>
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="text-3xl font-bold mb-1">
                        ${treasuryData.totalBalance.usd.toLocaleString()}
                      </div>
                      <div className="text-blue-100 text-sm">
                        +{treasuryData.totalBalance.change.percentage}% this {treasuryData.totalBalance.change.period}
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">Quick Actions</h5>
                      <div className="space-y-2">
                        <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                          📊 Portfolio Overview
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                          💰 Asset Management
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                          📈 Performance Analytics
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                          🔄 Transaction History
                        </button>
                      </div>
                    </div>

                    {/* Detailed Asset List by Chain */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">Assets by Chain</h5>
                      <div className="space-y-3">
                        {treasuryData.assets.map((asset, index) => {
                          const chainIcon = (() => {
                            switch(asset.chain) {
                              case 'Bitcoin': return '₿';
                              case 'Ethereum': return '🔷';
                              case 'Internet Computer': return '🌐';
                              case 'Solana': return '☀️';
                              case 'Others': return '🔗';
                              default: return '🔗';
                            }
                          })();

                          return (
                            <div key={index} className="border border-slate-100 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{chainIcon}</span>
                                  <span className="font-medium text-slate-900">{asset.chain}</span>
                                </div>
                                <span className="text-xs text-slate-500">
                                  ${asset.usdValue.toLocaleString()}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">{asset.symbol}</span>
                                  <span className="font-medium">{asset.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                    {/* Center Column - Charts & Analytics */}
                    <div className="lg:col-span-2 space-y-6">
                    {/* Treasury Performance Chart */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-slate-900">Treasury Performance</h4>
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <span className="text-green-600">+{treasuryData.totalBalance.change.percentage}% this {treasuryData.totalBalance.change.period}</span>
                        </div>
                      </div>
                      <TreasuryPerformanceChart data={treasuryData} />
                    </div>

                    {/* Asset Allocation Pie Chart */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Asset Allocation</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-48">
                          <TreasuryAllocationChart data={treasuryData} />
                        </div>
                        <div className="space-y-3">
                           {treasuryData.assets.map((asset, index) => {
                             return (
                               <div key={index} className="flex items-center space-x-3">
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }}></div>
                                 <span className="text-sm text-slate-700 flex-1">{asset.chain}</span>
                                 <span className="text-sm font-medium">{asset.percentage}%</span>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions Feed */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h4>
                      <div className="space-y-3">
                        {[
                           { type: 'Received', asset: 'ICP', amount: '245.67', usdValue: '1,234.56', time: '12 minutes ago' },
                           { type: 'Sent', asset: 'ckBTC', amount: '0.15', usdValue: '6,789.12', time: '28 minutes ago' },
                           { type: 'Swapped', asset: 'ckETH', amount: '3.42', usdValue: '8,456.78', time: '45 minutes ago' },
                           { type: 'Staked', asset: 'USDC', amount: '1,500.00', usdValue: '1,500.00', time: '1 hour ago' },
                           { type: 'Received', asset: 'SOL', amount: '89.23', usdValue: '2,345.67', time: '2 hours ago' }
                         ].map((tx, index) => {
                           return (
                             <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                               <div className="flex items-center space-x-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                   tx.type === 'Received' ? 'bg-green-100 text-green-600' :
                                   tx.type === 'Sent' ? 'bg-red-100 text-red-600' :
                                   tx.type === 'Swapped' ? 'bg-blue-100 text-blue-600' :
                                   'bg-purple-100 text-purple-600'
                                 }`}>
                                   {tx.type === 'Received' ? '↓' : tx.type === 'Sent' ? '↑' : tx.type === 'Swapped' ? '⇄' : '◉'}
                                 </div>
                                 <div>
                                   <p className="font-medium text-slate-900">{tx.type} {tx.asset}</p>
                                   <p className="text-sm text-slate-500">{tx.time}</p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="font-medium">{tx.amount} {tx.asset}</p>
                                 <p className="text-sm text-slate-500">${tx.usdValue}</p>
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  </div>

                    {/* Right Column - Actions & Governance */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Create Proposal Button */}
                    <button 
                      onClick={() => setShowCreateProposal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Proposal</span>
                    </button>

                    {/* Active Proposals List */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">Active Proposals</h5>
                      <div className="space-y-3">
                        {proposals.slice(0, 3).map((proposal, index) => (
                          <div key={index} className="border border-slate-100 rounded-lg p-3">
                            <h6 className="font-medium text-slate-900 text-sm mb-1 truncate">
                              {proposal.title || `Proposal #${proposal.id}`}
                            </h6>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Status: {Object.keys(proposal.status)[0]}</span>
                              <span>{Math.floor(Math.random() * 7 + 1)}d left</span>
                            </div>
                            <div className="mt-2 bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.floor(Math.random() * 80 + 10)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        {proposals.length === 0 && (
                          <div className="text-center py-4">
                            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No active proposals</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NFT Gallery */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">NFT Gallery</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, index) => (
                          <div key={index} className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg mx-auto mb-1"></div>
                              <p className="text-xs text-slate-600">NFT #{index + 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All NFTs →
                      </button>
                    </div>

                    {/* Treasury Stats */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-900 mb-3">Treasury Stats</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Assets</span>
                          <span className="text-sm font-medium">{dao.chains.length * 2 + Math.floor(Math.random() * 5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Active Chains</span>
                          <span className="text-sm font-medium">{dao.chains.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Monthly Growth</span>
                          <span className="text-sm font-medium text-green-600">+{(Math.random() * 20 + 5).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Risk Score</span>
                          <span className="text-sm font-medium text-yellow-600">Medium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Governance Tab */}
            {activeTab === 'governance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Governance Configuration</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Voting Rules
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Vote Weight Type</p>
                          <p className="text-sm text-slate-600">How voting power is calculated</p>
                        </div>
                        <span className="font-medium text-blue-600">
                          {dao.governance.vote_weight_type ? Object.keys(dao.governance.vote_weight_type)[0].replace(/([A-Z])/g, ' $1').trim() : ''}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Approval Threshold</p>
                          <p className="text-sm text-slate-600">Minimum percentage to pass</p>
                        </div>
                        <span className="font-medium text-green-600">{Number(dao.governance.approval_threshold)}%</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Voting Period</p>
                          <p className="text-sm text-slate-600">Duration of active voting</p>
                        </div>
                        <span className="font-medium text-purple-600">{Number(dao.governance.voting_period_secs) / 86400} days</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Quorum</p>
                          <p className="text-sm text-slate-600">Minimum participation required</p>
                        </div>
                        <span className="font-medium text-orange-600">{Number(dao.governance.quorum)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Coins className="w-5 h-5 mr-2" />
                      Token Information
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Token Name</p>
                          <p className="text-sm text-slate-600">Native governance token</p>
                        </div>
                        <span className="font-medium text-blue-600">{dao.base_token.name}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Symbol</p>
                          <p className="text-sm text-slate-600">Token ticker symbol</p>
                        </div>
                        <span className="font-medium text-green-600">{dao.base_token.symbol}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Decimals</p>
                          <p className="text-sm text-slate-600">Token decimal places</p>
                        </div>
                        <span className="font-medium text-purple-600">{dao.base_token.decimals}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Total Supply</p>
                          <p className="text-sm text-slate-600">Maximum token supply</p>
                        </div>
                        <span className="font-medium text-orange-600">
                          {parseInt(dao.base_token.total_supply).toLocaleString()}
                        </span>
                      </div>

                      {dao.base_token.distribution_model && dao.base_token.distribution_model.emission_rate && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900">Emission Rate</p>
                            <p className="text-sm text-slate-600">Tokens emitted per period</p>
                          </div>
                          <span className="font-medium text-cyan-600">
                            {parseInt(dao.base_token.distribution_model.emission_rate).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Token Creation Retry Section */}
                  {(() => {
                    if (!backendDao) return false;
                    console.log('Backend DAO base_token:', backendDao.base_token);
                    return (!backendDao.base_token.token_location || !backendDao.base_token.token_location.canister_id || backendDao.base_token.token_location.canister_id.length === 0) && dao.base_token.distribution_model;
                  })() && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="font-medium text-amber-900 mb-1">Token Creation Failed</h5>
                          <p className="text-sm text-amber-700 mb-3">
                            The DAO token was not created successfully during initial setup. You can retry the token creation process using the stored parameters.
                          </p>
                          <button
                            onClick={handleRetryTokenCreation}
                            disabled={isRetryingToken}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed rounded-md transition-colors"
                          >
                            {isRetryingToken ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Token Creation
                              </>
                            )}
                          </button>
                          
                          {/* Status Messages */}
                          {tokenRetryStatus === 'success' && (
                            <div className="mt-2 text-sm text-green-700 flex items-center">
                              <Check className="w-4 h-4 mr-1" />
                              Token created successfully! Page will refresh shortly.
                            </div>
                          )}
                          {tokenRetryStatus === 'error' && (
                            <div className="mt-2 text-sm text-red-700 flex items-center">
                              <X className="w-4 h-4 mr-1" />
                              Failed to create token. Please check the console for details.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canister Tab */}
            {activeTab === 'canister' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Canister Information</h3>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <Hash className="w-5 h-5 mr-2" />
                    Canister ID
                  </h4>

                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="mb-2 md:mb-0">
                        <p className="font-medium text-slate-900">Principal ID</p>
                        <p className="text-sm text-slate-600">Unique identifier for this DAO canister</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-blue-600 bg-white px-3 py-1 rounded-md border">
                          {dao.id}
                        </span>
                        <button
                          onClick={() => handleCopy(dao.id)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 ${copied
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'text-blue-600 hover:bg-blue-100 border border-transparent'
                            }`}
                          title={copied ? "Copied!" : "Copy to clipboard"}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="text-sm font-medium">Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleUpgrade}
                          disabled={isUpgrading}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 ${upgradeStatus === 'success'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : upgradeStatus === 'error'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isUpgrading
                                  ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                                  : 'text-purple-600 hover:bg-purple-100 border border-transparent'
                            }`}
                          title={
                            upgradeStatus === 'success'
                              ? "Upgraded successfully!"
                              : upgradeStatus === 'error'
                                ? "Upgrade failed"
                                : isUpgrading
                                  ? "Upgrading..."
                                  : "Upgrade DAO canister"
                          }
                        >
                          {upgradeStatus === 'success' ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">Upgraded!</span>
                            </>
                          ) : upgradeStatus === 'error' ? (
                            <>
                              <X className="w-4 h-4" />
                              <span className="text-sm font-medium">Failed</span>
                            </>
                          ) : isUpgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">Upgrading...</span>
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4" />
                              <span className="text-sm font-medium">Upgrade</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Network</p>
                          <p className="text-sm text-slate-600">Internet Computer</p>
                        </div>
                        <span className="font-medium text-green-600 mt-2 block">IC Mainnet</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Canister Type</p>
                          <p className="text-sm text-slate-600">DAO governance canister</p>
                        </div>
                        <span className="font-medium text-purple-600 mt-2 block">Governance</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800">Important</p>
                          <p className="text-sm text-amber-700 mt-1">
                            This canister ID is used to identify and interact with your DAO on the Internet Computer network.
                            Keep it safe and use it when connecting external applications or tools.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Proposal Creation Modal */}
      {showCreateProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Create New Proposal</h2>
              <button
                onClick={() => setShowCreateProposal(false)}
                disabled={isCreatingProposal}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateProposal(); }} className="space-y-6">
                {/* Title Input */}
                <div>
                  <label htmlFor="proposal-title" className="block text-sm font-medium text-slate-700 mb-2">
                    Proposal Title
                  </label>
                  <input
                    id="proposal-title"
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="Enter a clear, descriptive title for your proposal"
                    disabled={isCreatingProposal}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">{proposalTitle.length}/200 characters</p>
                </div>

                {/* Content Input */}
                <div>
                  <label htmlFor="proposal-content" className="block text-sm font-medium text-slate-700 mb-2">
                    Proposal Description
                  </label>
                  <textarea
                    id="proposal-content"
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    placeholder="Provide a detailed description of your proposal, including objectives, implementation plan, and expected outcomes..."
                    disabled={isCreatingProposal}
                    maxLength={5000}
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">{proposalContent.length}/5000 characters</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateProposal(false)}
                    disabled={isCreatingProposal}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProposal || !proposalTitle.trim() || !proposalContent.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm"
                  >
                    {isCreatingProposal ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating & Analyzing...</span>
                      </div>
                    ) : (
                      'Create & Analyze Proposal'
                    )}
                  </button>
                </div>

                {/* Status Messages */}
                {isCreatingProposal && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-700 font-medium">Creating proposal and submitting for analysis...</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">This may take a few moments to complete.</p>
                  </div>
                )}

                {proposalCreationStatus === 'error' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">Failed to create proposal</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Please try again. Check the console for more details.</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {proposalCreationStatus === 'success' && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">Proposal created successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DaoInfoPage;