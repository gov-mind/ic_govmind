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
  Activity,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Wallet,
  Calendar,
  Hash,
  ExternalLink
} from 'lucide-react';
import { Principal } from '@dfinity/principal';

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
  const { principal, factoryActor } = useAuthClient();
  const { daoId } = useParams();

  // Debug: Log the principal from the frontend
//   console.log("Frontend principal:", principal);

  const { data: dao, isLoading, error } = useQuery({
    queryKey: ['dao-info', principal],
    queryFn: async () => {
      if (!factoryActor || !principal) return null;
      const principalObj = Principal.fromText(principal);
      // Debug: Log the principal used in the API call
      console.log("Calling get_dao_info with principal:", principalObj.toText());
      const result = await factoryActor.get_dao_info(principalObj);
      // Debug: Log the result from the backend
      console.log("get_dao_info result:", result);
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!factoryActor && !!principal,
    staleTime: 30000,
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateProposal, setShowCreateProposal] = useState(false);

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
    const totalVotes = proposal.votes.length;
    const yesVotes = proposal.votes.filter(v => v.vote_choice === 'Yes').length;
    const noVotes = proposal.votes.filter(v => v.vote_choice === 'No').length;
    const abstainVotes = proposal.votes.filter(v => v.vote_choice === 'Abstain').length;
    
    const totalWeight = proposal.votes.reduce((sum, vote) => sum + vote.weight, 0);
    const yesWeight = proposal.votes.filter(v => v.vote_choice === 'Yes').reduce((sum, vote) => sum + vote.weight, 0);
    
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
          <button
            onClick={() => setShowCreateProposal(true)}
            className="ml-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'proposals', label: 'Proposals', icon: FileText },
                { id: 'treasury', label: 'Treasury', icon: Wallet },
                { id: 'governance', label: 'Governance', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
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
          <div className="p-6">
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
                          {dao.proposals.filter(p => p.status === 'Active').length}
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Proposals</h3>
                  <button
                    onClick={() => setShowCreateProposal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Proposal</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {dao.proposals.map(proposal => {
                    const voteStats = calculateVoteStats(proposal);
                    return (
                      <div key={proposal.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-slate-900">{proposal.title}</h4>
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </div>
                            <p className="text-slate-600 text-sm mb-2">{proposal.content}</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>Proposed by {proposal.proposer}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(proposal.created_at)}</span>
                              {proposal.status === 'Active' && (
                                <>
                                  <span>•</span>
                                  <span>Expires {formatRelativeTime(proposal.expires_at)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-700">Voting Results</span>
                            <span className="text-sm text-slate-500">
                              {voteStats.totalVotes} votes • {voteStats.approvalPercentage}% approval
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{voteStats.yesVotes}</div>
                              <div className="text-xs text-slate-500">Yes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{voteStats.noVotes}</div>
                              <div className="text-xs text-slate-500">No</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-600">{voteStats.abstainVotes}</div>
                              <div className="text-xs text-slate-500">Abstain</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default DaoInfoPage; 