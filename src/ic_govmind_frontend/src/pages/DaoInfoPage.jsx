import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import DaoTabs from '../components/DaoTabs';
import { useDaoInfo, useBackendDaoInfo, useDaoWalletAddresses, useDaoTokenBalances, useDaoProposals, useDistributionRecords, useMemberBalances } from '../hooks/daoHooks';
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
  RefreshCw,
  Clock,
  Calendar,
  Brain
} from 'lucide-react';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';
import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';
import OverviewTab from '../components/tabs/OverviewTab';
import MembersTab from '../components/tabs/MembersTab';
import ProposalsTab from '../components/tabs/ProposalsTab';
import DistributionTab from '../components/tabs/DistributionTab';
import TreasuryTab from '../components/tabs/TreasuryTab';
import GovernanceTab from '../components/tabs/GovernanceTab';

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

// Helper function to get unlock schedule for a specific member
function getMemberUnlockSchedule(dao, member) {
  if (!dao.base_token?.distribution_model || dao.base_token.distribution_model.length === 0) {
    return [];
  }
  
  const distributionModel = dao.base_token.distribution_model[0];
  if (!distributionModel.unlock_schedule || distributionModel.unlock_schedule.length === 0) {
    return [];
  }
  
  const unlockSchedule = distributionModel.unlock_schedule[0] || [];
  
  // Get member's principal address
  const memberPrincipal = member.icp_principal && member.icp_principal.length > 0 
    ? (typeof member.icp_principal[0] === 'object' && member.icp_principal[0].toText 
        ? member.icp_principal[0].toText() 
        : String(member.icp_principal[0]))
    : null;
  
  if (!memberPrincipal) {
    return [];
  }
  
  // Filter unlock schedule items for this member
  return unlockSchedule.filter(item => item.addr === memberPrincipal)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

// Helper function to calculate total locked tokens for a member
function getTotalLockedTokens(unlockSchedule) {
  try {
    return unlockSchedule.reduce((total, item) => {
      return total + BigInt(item.amount);
    }, 0n);
  } catch {
    return 0n;
  }
}

// Helper function to calculate available (unlocked) tokens
function getAvailableTokens(unlockSchedule) {
  try {
    const now = BigInt(Date.now()) * 1000000n; // Convert to nanoseconds
    return unlockSchedule.reduce((total, item) => {
      try {
        const ts = BigInt(item.timestamp);
        if (ts <= now) {
          return total + BigInt(item.amount);
        }
        return total;
      } catch {
        return total;
      }
    }, 0n);
  } catch {
    return 0n;
  }
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

  const { data: dao, isLoading, error } = useDaoInfo();

  // Fetch complete DAO info from backend canister for accurate distribution model
  const { data: backendDao, isLoading: backendDaoLoading } = useBackendDaoInfo(dao);

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

  // Proposal Co-pilot state
  const [showProposalCopilot, setShowProposalCopilot] = useState(false);
  const [copilotIdea, setCopilotIdea] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [draftError, setDraftError] = useState(null);

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

  // Handle AI draft generation
  const handleGenerateAIDraft = async () => {
    if (!copilotIdea.trim()) {
      setDraftError('Please enter a proposal idea');
      return;
    }

    setIsGeneratingDraft(true);
    setDraftError(null);
    setGeneratedDraft(null);

    try {
      const result = await ic_govmind_proposal_analyzer.draft_proposal(copilotIdea.trim());
      
      if (result && result.Ok) {
        setGeneratedDraft(result.Ok);
      } else {
        setDraftError(result?.Err || 'Failed to generate proposal draft');
      }
    } catch (err) {
      console.error('Error generating AI draft:', err);
      setDraftError('Failed to generate proposal draft. Please try again.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Handle using the generated draft
  const handleUseDraft = () => {
    if (generatedDraft) {
      setProposalTitle(generatedDraft.title);
      // Combine summary, rationale, and specifications into description
      const description = `${generatedDraft.summary}\n\n**Rationale:**\n${generatedDraft.rationale}\n\n**Specifications:**\n${generatedDraft.specifications}`;
      setProposalContent(description);
      
      // Close co-pilot and show proposal form
      setShowProposalCopilot(false);
      setShowCreateProposal(true);
      
      // Reset co-pilot state
      setCopilotIdea('');
      setGeneratedDraft(null);
      setDraftError(null);
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
                getMemberUnlockSchedule={getMemberUnlockSchedule}
                getTotalLockedTokens={getTotalLockedTokens}
                getAvailableTokens={getAvailableTokens}
                formatDate={formatDate}
              />
            )}

            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <ProposalsTab
                dao={dao}
                proposals={proposals}
                proposalsLoading={proposalsLoading}
                proposalsError={proposalsError}
                refetchProposals={refetchProposals}
                selectedProposalId={selectedProposalId}
                setSelectedProposalId={setSelectedProposalId}
                setShowProposalCopilot={setShowProposalCopilot}
                setShowCreateProposal={setShowCreateProposal}
                calculateVoteStats={calculateVoteStats}
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

      {/* Proposal Co-pilot Modal */}
      {showProposalCopilot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Proposal Co-pilot</h2>
                  <p className="text-sm text-slate-600">AI-powered proposal drafting assistant</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProposalCopilot(false);
                  setCopilotIdea('');
                  setGeneratedDraft(null);
                  setDraftError(null);
                }}
                disabled={isGeneratingDraft}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Idea Input */}
                <div>
                  <label htmlFor="copilot-idea" className="block text-sm font-medium text-slate-700 mb-2">
                    Describe your proposal idea
                  </label>
                  <textarea
                    id="copilot-idea"
                    value={copilotIdea}
                    onChange={(e) => setCopilotIdea(e.target.value)}
                    placeholder="Describe your proposal idea in one sentence. For example: 'Implement a bug bounty program to incentivize security researchers' or 'Create a community fund for supporting open source projects'"
                    disabled={isGeneratingDraft}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">{copilotIdea.length}/500 characters</p>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateAIDraft}
                    disabled={isGeneratingDraft || !copilotIdea.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm flex items-center space-x-2"
                  >
                    {isGeneratingDraft ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating AI Draft...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>Generate AI Draft</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Display */}
                {draftError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">Error</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{draftError}</p>
                  </div>
                )}

                {/* Generated Draft Display */}
                {generatedDraft && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Generated Proposal Draft</h3>
                      <button
                        onClick={handleUseDraft}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Use This Draft</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                      {/* Title */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Title</h4>
                        <p className="text-slate-900 font-medium">{generatedDraft.title}</p>
                      </div>

                      {/* Summary */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{generatedDraft.summary}</p>
                      </div>

                      {/* Rationale */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Rationale</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{generatedDraft.rationale}</p>
                      </div>

                      {/* Specifications */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Specifications</h4>
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{generatedDraft.specifications}</p>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        onClick={handleUseDraft}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-sm flex items-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Use This Draft</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DaoInfoPage;