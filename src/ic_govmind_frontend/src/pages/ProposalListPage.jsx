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
  CheckCircle,
  Brain,
  Play,
  Building2,
  List,
  ScrollText
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useSnsProposals, useSnsCanister } from '../hooks/useSnsGovernance';
import { useProposalExists, useSubmitProposal, useProposal, getStatusString, getStatusBadgeClass, getStatusIcon } from '../hooks/useProposals';

function ProposalListPage() {
  const { canisterId } = useParams();
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useSnsProposals(canisterId);
  const { data: snsInfo, isLoading: snsLoading, error: snsError } = useSnsCanister(canisterId);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showComplexityBreakdown, setShowComplexityBreakdown] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [analyzedProposalId, setAnalyzedProposalId] = useState(null);

  // Get SNS canister info from the canisters list
  const displaySnsInfo = snsLoading ? {
    name: 'Loading SNS...',
    logo: null,
    canisterId: canisterId
  } : snsInfo || {
    name: 'Unknown SNS',
    logo: null,
    canisterId: canisterId
  };
  
  // Get the selected proposal details
  const selectedProposal = proposals.find(p => p.id === selectedProposalId);
  
  // Check if the selected proposal exists in the analyzer
  const { data: existingProposal, isLoading: existingProposalLoading } = useProposalExists(selectedProposal?.compositeId);
  
  // Get the analyzed proposal if it exists
  const { data: analyzedProposal, isLoading: analyzedProposalLoading } = useProposal(existingProposal?.[0]?.id || analyzedProposalId);
  
  // Submit proposal mutation
  const submitProposalMutation = useSubmitProposal();

  // Determine if we should show loading state
  const isAnalyzing = submitProposalMutation.isLoading || 
                     (analyzedProposalId && !analyzedProposal && !analyzedProposalLoading) ||
                     (existingProposalLoading && !existingProposal);

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
    // Reset analyzed proposal ID when selecting a different proposal
    setAnalyzedProposalId(null);
  };

  // Handle submitting proposal for analysis
  const handleAnalyzeProposal = async () => {
    if (!selectedProposal) return;
    
    try {
      // Reset the analyzed proposal ID to trigger loading state
      setAnalyzedProposalId(null);
      
      const proposalId = await submitProposalMutation.mutateAsync({
        proposalId: selectedProposal.compositeId, // Use the composite ID
        title: selectedProposal.title,
        description: selectedProposal.summary || selectedProposal.title // Use summary if available, otherwise title
      });
      
      setAnalyzedProposalId(proposalId);
    } catch (error) {
      console.error('Error submitting proposal for analysis:', error);
    }
  };

  return (
    <div className="h-[90vh] bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 overflow-hidden">
      <main className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {/* SNS Info/Header - flattened */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-1 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 ml-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center overflow-hidden">
                {displaySnsInfo.logo ? (
                  <img src={displaySnsInfo.logo} alt={displaySnsInfo.name} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="text-white w-7 h-7" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{displaySnsInfo.name}</h1>
                <p className="text-sm text-slate-500 font-mono leading-tight">{canisterId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-4 flex-1 min-h-0 pb-4 transition-all duration-500 ${
          selectedProposalId && showAnalysisPanel 
            ? 'grid-cols-1 lg:grid-cols-[40%_60%]' 
            : 'grid-cols-1'
        }`}>
          {/* Proposals List - Left Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <List className="text-green-600 font-semibold w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">All Proposals</h2>
              </div>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {proposalsLoading ? 'Loading...' : `${proposals.length} proposals`}
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
                    <List className="text-slate-600 w-10 h-10" />
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
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
                {/* Proposal Summary Section - Always Visible */}
                {proposals.find(p => p.id === selectedProposalId)?.summary && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ScrollText className="text-blue-600 text-xs font-semibold w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setShowDescription(!showDescription)}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            <span>{showDescription ? 'Show Less' : 'Show More'}</span>
                            {showDescription ? (
                              <ChevronUp className="w-3 h-3 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="w-3 h-3 transition-transform duration-200" />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <div className={`prose prose-sm max-w-none text-slate-700 transition-all duration-300 ${showDescription ? 'max-h-none' : 'max-h-20 overflow-hidden'}`}>
                            <Markdown>
                              {proposals.find(p => p.id === selectedProposalId)?.summary}
                            </Markdown>
                          </div>
                          {!showDescription && (
                            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent rounded-b"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Analysis Content */}
                {
                  // Determine status from analyzedProposal or existingProposal
                  (() => {
                    const proposalObj = Array.isArray(analyzedProposal) ? analyzedProposal[0] : analyzedProposal;
                    const status = getStatusString(proposalObj?.status || (Array.isArray(existingProposal) ? existingProposal[0]?.status : existingProposal?.status));
                    if (isAnalyzing) {
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
                          <div className="space-y-3">
                            <RefreshCw className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto text-blue-500" />
                            <p className="text-slate-600 font-medium">Analyzing proposal...</p>
                            <p className="text-xs text-slate-500">This may take a few moments</p>
                          </div>
                        </div>
                      );
                    } else if (status === 'Analyzing') {
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center">
                          <div className="space-y-3">
                            <RefreshCw className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto text-blue-500" />
                            <p className="text-slate-600 font-medium">Analyzing proposal...</p>
                            <p className="text-xs text-slate-500">This may take a few moments</p>
                          </div>
                        </div>
                      );
                    } else if (status === 'Failed') {
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center">
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                              <X className="text-red-600 w-6 h-6" />
                            </div>
                            <p className="text-slate-600 font-medium">Analysis failed</p>
                            <p className="text-xs text-slate-500 mb-3">There was an error analyzing this proposal</p>
                            <button
                              onClick={handleAnalyzeProposal}
                              disabled={submitProposalMutation.isLoading}
                              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
                            >
                              {submitProposalMutation.isLoading ? 'Retrying...' : 'Retry Analysis'}
                            </button>
                          </div>
                        </div>
                      );
                    } else if (status === 'Analyzed' && proposalObj && proposalObj.analysis && proposalObj.analysis.length > 0) {
                      return (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                          {/* Analysis Results */}
                          <div className="space-y-4">
                            {/* Summary Section */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md hover:bg-blue-100 transition-all duration-200">
                              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <ScrollText className="mr-2 text-lg w-5 h-5" /> Summary
                              </h4>
                              <div className="text-sm text-blue-700 leading-relaxed">
                                {proposalObj.analysis[0].summary || 'No summary available'}
                              </div>
                            </div>

                            {/* Risk Assessment Section */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md hover:bg-amber-100 transition-all duration-200">
                              <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                                <AlertTriangle className="mr-2 text-lg w-5 h-5" /> Risk Assessment
                              </h4>
                              <div className="text-sm text-amber-700">
                                {formatBulletPoints(proposalObj.analysis[0].risk_assessment)}
                              </div>
                            </div>

                            {/* Recommendations Section */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:shadow-md hover:bg-emerald-100 transition-all duration-200">
                              <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                                <Lightbulb className="mr-2 text-lg w-5 h-5" /> Recommendations
                              </h4>
                              <div className="text-sm text-emerald-700">
                                {formatBulletPoints(proposalObj.analysis[0].recommendations)}
                              </div>
                            </div>

                            {/* Complexity Score Section */}
                            {(proposalObj.analysis[0].complexity_score !== undefined || proposalObj.analysis[0].complexity_breakdown) && (
                              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:shadow-md hover:bg-purple-100 transition-all duration-200">
                                <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                  <TrendingUp className="mr-2 text-lg w-5 h-5" /> Complexity Score
                                </h4>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-lg font-bold text-purple-900">
                                    {(proposalObj.analysis[0].complexity_score || 0).toFixed(1)}/10
                                  </span>
                                  <button
                                    onClick={() => setShowComplexityBreakdown(!showComplexityBreakdown)}
                                    className="text-purple-600 hover:text-purple-800 transition-colors flex items-center"
                                  >
                                    <span className="text-sm font-medium mr-1">Details</span>
                                    {showComplexityBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                                
                                {showComplexityBreakdown && (
                                  <div className="space-y-3 pt-3 border-t border-purple-200">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-medium text-purple-900">Technical:</span>
                                        <span className="ml-2 text-purple-700">{(proposalObj.analysis[0].complexity_breakdown?.technical_complexity || 0).toFixed(1)}/10</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-900">Financial:</span>
                                        <span className="ml-2 text-purple-700">{(proposalObj.analysis[0].complexity_breakdown?.financial_complexity || 0).toFixed(1)}/10</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-900">Governance:</span>
                                        <span className="ml-2 text-purple-700">{(proposalObj.analysis[0].complexity_breakdown?.governance_complexity || 0).toFixed(1)}/10</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-900">Timeline:</span>
                                        <span className="ml-2 text-purple-700">{(proposalObj.analysis[0].complexity_breakdown?.timeline_complexity || 0).toFixed(1)}/10</span>
                                      </div>
                                    </div>
                                    
                                    {proposalObj.analysis[0].complexity_breakdown?.explanation && (
                                      <div className="pt-2">
                                        <p className="text-sm text-purple-800 font-medium mb-1">Explanation:</p>
                                        <p className="text-sm text-purple-700">{proposalObj.analysis[0].complexity_breakdown.explanation}</p>
                                      </div>
                                    )}
                                    
                                    {proposalObj.analysis[0].complexity_breakdown?.comparison && (
                                      <div className="pt-2">
                                        <p className="text-sm text-purple-800 font-medium mb-1">Comparison:</p>
                                        <p className="text-sm text-purple-700">{proposalObj.analysis[0].complexity_breakdown.comparison}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Estimated Impact Section */}
                            {proposalObj.analysis[0].estimated_impact && (
                              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md hover:bg-indigo-100 transition-all duration-200">
                                <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                                  <Activity className="mr-2 text-lg w-5 h-5" /> Estimated Impact
                                </h4>
                                <div className="text-sm text-indigo-700 leading-relaxed">
                                  {proposalObj.analysis[0].estimated_impact}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else if (!analyzedProposal) {
                      // No analysis result yet, allow user to analyze
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center">
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                              <Brain className="text-blue-600 w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-slate-700 font-medium mb-2">No analysis available</p>
                              <p className="text-sm text-slate-500 mb-4">This proposal hasn't been analyzed yet</p>
                              <button
                                onClick={handleAnalyzeProposal}
                                disabled={submitProposalMutation.isLoading}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm flex items-center space-x-2 mx-auto cursor-pointer"
                              >
                                {submitProposalMutation.isLoading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Analyzing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    <span>Analyze Proposal</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (status === 'Pending' || !status) {
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center">
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                              <Hourglass className="text-slate-600 w-6 h-6" />
                            </div>
                            <p className="text-slate-600 font-medium">Waiting for analysis</p>
                            <p className="text-xs text-slate-500">Analysis will begin automatically</p>
                          </div>
                        </div>
                      );
                    } else {
                      // fallback
                      return (
                        <div className="bg-slate-50 rounded-xl p-12 text-center">
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                              <Hourglass className="text-slate-600 w-6 h-6" />
                            </div>
                            <p className="text-slate-600 font-medium">Waiting for analysis</p>
                            <p className="text-xs text-slate-500">Analysis will begin automatically</p>
                          </div>
                        </div>
                      );
                    }
                  })()
                }
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProposalListPage; 