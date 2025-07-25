import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Check
} from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { createActor as createBackendActor } from 'declarations/ic_govmind_backend';
import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';
import ProposalAnalysisPanel from '../components/ProposalAnalysisPanel';

function formatDate(bigintOrNumber) {
  let ms;
  if (typeof bigintOrNumber === 'bigint') {
    // Assume nanoseconds, convert to milliseconds
    ms = Number(bigintOrNumber / 1000000n);
  } else {
    ms = Number(bigintOrNumber);
  }
  return new Date(ms).toLocaleDateString();
}

function formatMemberDate(joined_at) {
  if (typeof joined_at === 'bigint') {
    // Assume nanoseconds, convert to ms
    return new Date(Number(joined_at) / 1_000_000).toLocaleDateString();
  } else if (typeof joined_at === 'number') {
    // If value is suspiciously small, treat as seconds
    return new Date(joined_at < 10000000000 ? joined_at * 1000 : joined_at).toLocaleDateString();
  }
  return '-';
}

function DaoInfoPage() {
  const { principal, factoryActor, authClient, agent } = useAuthClient();
  const { daoId } = useParams();

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

        // Call submit_proposal_with_analysis in the proposal analyzer with AI analysis
        const analyzerProposalId = `${dao.id}-${proposalId}`;
        
        let analyzerResult;
        try {
          // Get AI analysis
          const { getAIAnalysis, getMockAnalysis } = await import('../services/aiService');
          let analysis = null;
          let status = { Pending: null };
          
          try {
            analysis = await getAIAnalysis(proposalTitle.trim(), proposalContent.trim());
            status = { Analyzed: null };
          } catch (aiError) {
            console.warn('AI analysis failed:', aiError.message);
            // Submit with failed status and no analysis
            status = { Failed: null };
            analysis = null;
          }
          
          // Submit with optional analysis and status
          // TODO: Add signature from API proxy when implementing backend signing
          analyzerResult = await ic_govmind_proposal_analyzer.submit_proposal_with_analysis(
            [analyzerProposalId], // Some(proposalId)
            proposalTitle.trim(),
            proposalContent.trim(),
            analysis ? [analysis] : [], // Convert to Option type for Candid
            status,
            [] // No signature yet - will be added when implementing backend signing
          );
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
                        <p className="text-sm text-purple-600 font-medium">Total Supply</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {parseInt(dao.base_token.total_supply).toLocaleString()}
                        </p>
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
                      {dao.chains.map(chain => (
                        <span key={chain} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm">
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
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{member.user_id}</h4>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeClass(member.role)}`}>{Object.keys(member.role)[0]}</span>
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

            {/* Treasury Tab */}
            {activeTab === 'treasury' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Treasury Assets</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dao.treasury.map((asset, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <Coins className="text-white w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{asset.symbol}</h4>
                            <p className="text-sm text-slate-500">{asset.chain}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Amount:</span>
                          <span className="font-medium">{parseInt(asset.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Type:</span>
                          <span className="font-medium">{asset.asset_type}</span>
                        </div>
                        {asset.canister_id && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Canister:</span>
                            <span className="font-mono text-xs truncate max-w-24">{asset.canister_id.slice(0, 8)}...</span>
                          </div>
                        )}
                        {asset.external_address && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Address:</span>
                            <span className="font-mono text-xs truncate max-w-24">{asset.external_address.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    </div>
                  </div>
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