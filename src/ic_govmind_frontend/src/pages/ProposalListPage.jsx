import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Users,
  Settings,
  Activity,
  Clock,
  Hourglass,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useSnsProposals } from '../hooks/useSnsGovernance';

function ProposalListPage() {
  const { canisterId } = useParams();
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useSnsProposals(canisterId);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showComplexityBreakdown, setShowComplexityBreakdown] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);

  // Utility function to format numbered text into bullet points
  const formatBulletPoints = (text) => {
    if (!text) return text;
    const numberedPattern = /\(\d+\)\s*([^0-9]*?)(?=\(\d+\)|$)/g;
    const matches = [...text.matchAll(numberedPattern)];
    if (matches.length > 1) {
      return (
        <ul className="space-y-2 list-none">
          {matches.map((match, index) => {
            const content = match[1].trim();
            if (!content) return null;
            return (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-white border-2 border-current rounded-full text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{content}</span>
              </li>
            );
          }).filter(Boolean)}
        </ul>
      );
    }
    // Fallback: try to split by periods and numbers at start of sentences
    const sentences = text.split(/(?:\d+\.\s*)/g)
      .filter(sentence => sentence.trim().length > 5)
      .map(sentence => sentence.trim());
    if (sentences.length > 1) {
      return (
        <ul className="space-y-2 list-none">
          {sentences.map((sentence, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-white border-2 border-current rounded-full text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                {index + 1}
              </span>
              <span className="leading-relaxed">{sentence}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <div className="leading-relaxed">{text}</div>;
  };

  // Helper to format large numbers with commas and K/M/B suffixes
  function formatLargeNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + 'T';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toLocaleString();
  }

  // Handle proposal selection
  const handleProposalSelect = (proposal) => {
    setSelectedProposalId(proposal.id);
    setShowDescription(false);
    setShowAnalysisPanel(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/sns-governance" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <span className="text-lg">←</span>
              <span>Back to SNS List</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-900">SNS Proposals</h1>
            <div />
          </div>
        </div>
      </header>
      {/* Main Content - Dynamic Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-6 h-[calc(100vh-12rem)] transition-all duration-500 ${selectedProposalId && showAnalysisPanel
          ? 'grid-cols-1 lg:grid-cols-[35%_65%]'
          : 'grid-cols-1'
          }`}>
          {/* Proposals List - Left Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-green-600 font-semibold w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">All Proposals</h2>
              </div>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {proposals.length} proposals
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 min-h-0">
              {proposalsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-slate-500">Loading proposals...</p>
                </div>
              ) : proposalsError ? (
                <div className="text-center py-12 text-red-500">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="text-red-600 w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium">Error loading proposals</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-600 w-10 h-10" />
                  </div>
                  <p className="text-base font-medium mb-2">No proposals yet</p>
                  <p className="text-sm mb-4">No proposals for this SNS canister.</p>
                </div>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={`${canisterId}-${proposal.id}`}
                    data-proposal-id={proposal.id}
                    onClick={() => handleProposalSelect(proposal)}
                    className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md relative bg-white
                      ${selectedProposalId === proposal.id
                        ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg ring-2 ring-blue-300 ring-opacity-50'
                        : 'border-slate-200 hover:border-cyan-400 hover:shadow-sm'
                      }`}
                  >
                    {selectedProposalId === proposal.id && (
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        #{proposal.id}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border
                        ${proposal.status === 'Open' ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : proposal.status === 'Executed' ? 'border-green-300 text-green-700 bg-green-50'
                          : proposal.status === 'Rejected' ? 'border-red-300 text-red-700 bg-red-50'
                          : 'border-slate-300 text-slate-700 bg-slate-100'
                        }`}>
                        {proposal.status}
                      </span>
                    </div>
                    <h4 className="text-slate-900 font-semibold text-base mb-1 line-clamp-2">{proposal.title}</h4>
                    <div className="flex items-center text-xs text-slate-500 space-x-2 mb-1">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Proposer: {proposal.proposer}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{proposal.submittedAt ? new Date(Number(proposal.submittedAt) / 1000000).toLocaleString() : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-xs font-medium rounded-full overflow-hidden border border-slate-200 bg-slate-50 divide-x divide-slate-200 shadow-sm">
                        <span className="flex items-center px-3 py-1 bg-green-50 text-green-700">
                          <TrendingUp className="w-3 h-3 mr-1" /> For: {formatLargeNumber(proposal.votesFor)}
                        </span>
                        <span className="flex items-center px-3 py-1 bg-red-50 text-red-700">
                          <X className="w-3 h-3 mr-1" /> Against: {formatLargeNumber(proposal.votesAgainst)}
                        </span>
                        <span className="flex items-center px-3 py-1 bg-slate-100 text-slate-700">
                          <BarChart3 className="w-3 h-3 mr-1" /> Total: {formatLargeNumber(proposal.totalVotes)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Analysis Results - Right Column - Only show when proposal is selected AND panel is visible */}
          {selectedProposalId && showAnalysisPanel && (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-400 shadow-lg shadow-blue-100 ring-1 ring-blue-200 p-6 flex flex-col min-h-0 transition-all duration-500">
              <div className="flex-shrink-0 mb-4">
                <div className="flex items-center space-x-3 mb-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 -m-4 mb-2 rounded-xl">
                  <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800">Proposal Details</h2>
                    <p className="text-xs text-slate-500 truncate">#{selectedProposalId}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setShowAnalysisPanel(false);
                        setSelectedProposalId(null);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-100 transition-colors text-slate-400 hover:text-red-600"
                      title="Close Analysis Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDescription(!showDescription)}
                      className="flex-shrink-0 p-1 rounded-md hover:bg-cyan-100 transition-colors text-slate-500 hover:text-slate-700"
                      title={showDescription ? "Hide description" : "Show description"}
                    >
                      {showDescription ? (
                        <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Expandable Description */}
                {showDescription && proposals.find(p => p.id === selectedProposalId) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="text-slate-600 text-xs font-semibold w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {proposals.find(p => p.id === selectedProposalId)?.summary && (
                          <>
                            <div className="prose prose-sm max-w-none text-slate-700 max-h-64 overflow-auto rounded border border-slate-100 bg-white shadow-inner">
                                <Markdown>
                                {proposals.find(p => p.id === selectedProposalId)?.summary}
                                </Markdown>
                            </div>
                            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent rounded-b"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
                {/* Placeholder for analysis results, as SNS proposals may not have AI analysis */}
                <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Hourglass className="text-slate-600 w-6 h-6" />
                    </div>
                    <p className="text-slate-600 font-medium">No analysis available for this proposal</p>
                    <p className="text-xs text-slate-500">SNS proposals do not have AI analysis in this demo</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProposalListPage; 