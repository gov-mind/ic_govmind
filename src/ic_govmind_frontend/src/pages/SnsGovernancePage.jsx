import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  Users,
  Activity,
  ArrowLeft,
  CheckCircle,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import {
  useSnsCanisters,
  useSnsProposals,
  useSnsStatistics,
  getSnsProposalStatusClass,
  formatVoteCount,
  calculateVotePercentage
} from '../hooks/useSnsGovernance';

function SnsGovernancePage() {
  const [selectedCanister, setSelectedCanister] = useState(null);
  const [showProposals, setShowProposals] = useState(false);
  const [canisterPage, setCanisterPage] = useState(1);
  const canisterPageSize = 10;
  const navigate = useNavigate();

  // React Query hooks
  const {
    data: canistersData = { canisters: [], paginationInfo: {} },
    isLoading: canistersLoading,
    error: canistersError
  } = useSnsCanisters(canisterPage, canisterPageSize);
  const canisters = canistersData.canisters || [];
  const paginationInfo = canistersData.paginationInfo || {};
  const { data: proposals = [], isLoading: proposalsLoading } = useSnsProposals(selectedCanister?.canisterId);
  const { data: statistics } = useSnsStatistics();

  // Handle canister selection
  const handleCanisterSelect = (canister) => {
    navigate(`/sns-governance/${canister.canisterId}`);
  };

  // Handle back to canisters list
  const handleBackToCanisters = () => {
    setSelectedCanister(null);
    setShowProposals(false);
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="GovMind Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GovMind</h1>
                <p className="text-sm text-slate-600">AI Mind for DAO</p>
              </div>
            </Link>

            <nav className="flex space-x-4">
              <Link to="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors font-medium">
                Home
              </Link>
              <Link to="/proposals" className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors font-medium">
                Proposals
              </Link>
              <Link 
                to="/sns-governance" 
                className="bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm"
              >
                SNS Governance
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {showProposals && (
              <button
                onClick={handleBackToCanisters}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Canisters</span>
              </button>
            )}
                      <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-blue-600 font-semibold w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {showProposals ? `${selectedCanister?.name} Proposals` : 'SNS Governance Canisters'}
            </h1>
          </div>
          
          {/* Statistics */}
          {!showProposals && statistics && (
            <div className="flex space-x-4 mt-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-600">Total Canisters</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{statistics.totalCanisters}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-600">Total Proposals</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{statistics.totalProposals}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-slate-600">Active Proposals</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{statistics.activeProposals}</p>
              </div>
            </div>
          )}
          </div>

          {showProposals && selectedCanister && (
            <div>
              <div className="flex items-center space-x-4 mb-4">
                {Array.isArray(selectedCanister.logo)
                  ? (selectedCanister.logo.length > 0 && (
                      <img src={selectedCanister.logo[0]} alt={selectedCanister.name} className="w-12 h-12 rounded-lg" />
                    ))
                  : (selectedCanister.logo && (
                      <img src={selectedCanister.logo} alt={selectedCanister.name} className="w-12 h-12 rounded-lg" />
                    ))}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCanister.name}</h2>
                  <p className="text-sm text-slate-600">{selectedCanister.description}</p>
                </div>
              </div>
              {/* Proposals */}
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{proposal.title}</h3>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSnsProposalStatusClass(proposal.status)}`}>
                            {proposal.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{proposal.summary}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Proposer: {proposal.proposer}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {proposal.executed ? `Executed ${formatRelativeTime(proposal.executedAt)}` : 'Voting Open'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">For: {formatVoteCount(proposal.votesFor)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Against: {formatVoteCount(proposal.votesAgainst)}</span>
                      </div>
                    </div>
                    {/* Vote Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Vote Progress</span>
                        <span className="font-medium text-slate-900">
                          {calculateVotePercentage(proposal.votesFor, proposal.totalVotes)}% For
                        </span>
                      </div>
                      <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${calculateVotePercentage(proposal.votesFor, proposal.totalVotes)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Total Votes: {formatVoteCount(proposal.totalVotes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* SNS Canisters List */}
          <div>
            {canistersLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-slate-500">Loading SNS canisters...</p>
              </div>
            ) : canistersError ? (
              <div className="text-center py-12 text-red-500">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="text-red-600 w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Error loading SNS canisters</p>
              </div>
            ) : canisters.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="text-slate-600 w-10 h-10" />
                </div>
                <p className="text-base font-medium mb-2">No SNS canisters found</p>
                <p className="text-sm">No SNS governance canisters are currently available.</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {canisters.map((canister) => (
                  <div
                    key={canister.id}
                    onClick={() => handleCanisterSelect(canister)}
                    className="p-6 border-2 border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center overflow-hidden">
                        {Array.isArray(canister.logo)
                          ? (canister.logo.length > 0 ? (
                              <img src={canister.logo[0]} alt={canister.name} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="text-white w-6 h-6" />
                            ))
                          : (canister.logo ? (
                              <img src={canister.logo} alt={canister.name} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="text-white w-6 h-6" />
                            ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{canister.name}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{canister.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Total Proposals:</span>
                        <span className="font-medium text-slate-900">{canister.totalProposals}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Active:</span>
                        <span className="font-medium text-green-600">{canister.activeProposals}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Last Activity:</span>
                        <span className="font-medium text-slate-900">{formatRelativeTime(canister.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {canister.canisterId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  className="px-4 py-2 rounded bg-slate-100 text-slate-700 disabled:opacity-50 transition-colors duration-150 hover:bg-blue-600 hover:text-white hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setCanisterPage((p) => Math.max(1, p - 1))}
                  disabled={!paginationInfo.has_prev_page}
                >
                  Previous
                </button>
                <span className="text-slate-700 font-medium">
                  Page {paginationInfo.current_page || canisterPage} of {paginationInfo.total_pages || 1}
                </span>
                <button
                  className="px-4 py-2 rounded bg-slate-100 text-slate-700 disabled:opacity-50 transition-colors duration-150 hover:bg-blue-600 hover:text-white hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setCanisterPage((p) => p + 1)}
                  disabled={!paginationInfo.has_next_page}
                >
                  Next
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SnsGovernancePage; 