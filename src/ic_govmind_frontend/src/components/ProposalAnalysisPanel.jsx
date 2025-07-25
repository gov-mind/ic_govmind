import { useState } from 'react';
import {
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
  AlertTriangle,
  Brain,
  Play,
  X,
  FileText,
  ScrollText,
  Hourglass
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useProposalExists, useSubmitProposal, useProposal, useProposalAnalysis, getStatusString, getStatusBadgeClass, getStatusIcon } from '../hooks/useProposals';

function ProposalAnalysisPanel({ proposals = [], canisterName = 'DAO', selectedProposalId: externalSelectedProposalId, setSelectedProposalId: externalSetSelectedProposalId }) {
  const [internalSelectedProposalId, internalSetSelectedProposalId] = useState(null);
  const selectedProposalId = externalSelectedProposalId !== undefined ? externalSelectedProposalId : internalSelectedProposalId;
  const setSelectedProposalId = externalSetSelectedProposalId !== undefined ? externalSetSelectedProposalId : internalSetSelectedProposalId;
  const [showDescription, setShowDescription] = useState(false);
  const [showComplexityBreakdown, setShowComplexityBreakdown] = useState(false);
  const [analyzedProposalId, setAnalyzedProposalId] = useState(null);

  // Get the selected proposal details
  const selectedProposal = proposals.find(p => String(p.id) === String(selectedProposalId));
  
  // Check if the selected proposal exists in the analyzer
  const { data: existingProposal, isLoading: existingProposalLoading } = useProposalExists(selectedProposal?.compositeId);
  
  // Get the analyzed proposal if it exists
  const { data: analyzedProposal, isLoading: analyzedProposalLoading } = useProposal(existingProposal?.[0]?.id || analyzedProposalId);
  
  // Submit proposal mutation
  const submitProposalMutation = useSubmitProposal();
  
  // Unified proposal analysis mutation
  const proposalAnalysisMutation = useProposalAnalysis();

  // Determine if we should show loading state
  const isAnalyzing = submitProposalMutation.isLoading || 
                     proposalAnalysisMutation.isLoading ||
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
        <ul className="space-y-2 list-disc list-inside">
          {sentences.map((sentence, index) => (
            <li key={index} className="leading-relaxed">{sentence}</li>
          ))}
        </ul>
      );
    }
    
    return <p className="leading-relaxed">{text}</p>;
  };

  // Handle analyzing a proposal
  const handleAnalyzeProposal = async () => {
    if (!selectedProposal) return;
    
    try {
      // Reset the analyzed proposal ID to trigger loading state
      setAnalyzedProposalId(null);
      
      // First, submit the proposal with pending status and no analysis
      const proposalId = await submitProposalMutation.mutateAsync({
        proposalId: selectedProposal.compositeId, // Use the composite ID
        title: selectedProposal.title,
        description: selectedProposal.summary || selectedProposal.title, // Use summary if available, otherwise title
        useAI: false // Don't use AI in initial submission
      });
      
      setAnalyzedProposalId(proposalId);
      
      // Now perform AI analysis and update the proposal
      await proposalAnalysisMutation.mutateAsync({
        proposalId: proposalId,
        title: selectedProposal.title,
        description: selectedProposal.summary || selectedProposal.title,
        isRetry: false
      });
      
    } catch (error) {
      console.error('Error submitting proposal for analysis:', error);
    }
  };

  // Handle retrying failed analysis
  const handleRetryAnalysis = async () => {
    if (!selectedProposal || !analyzedProposal) return;
    
    try {
      await proposalAnalysisMutation.mutateAsync({
        proposalId: Array.isArray(analyzedProposal) ? analyzedProposal[0].id : analyzedProposal.id,
        title: selectedProposal.title,
        description: selectedProposal.summary || selectedProposal.title,
        isRetry: true
      });
    } catch (error) {
      console.error('Error retrying analysis:', error);
    }
  };

  return (
    <div className={`grid gap-4 flex-1 min-h-0 pb-4 transition-all duration-500 ${
      selectedProposal 
        ? 'grid-cols-1 lg:grid-cols-[40%_60%]' 
        : 'grid-cols-1'
    }`}>
      {/* Proposals List */}
      <div className="flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 min-h-0">
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-600 w-10 h-10" />
              </div>
              <p className="text-base font-medium mb-2">No proposals yet</p>
              <p className="text-sm mb-4">No proposals for this {canisterName}.</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <div
                key={proposal.id}
                onClick={() => {
                    console.log("proposal.id", proposal.id);
                    setSelectedProposalId(proposal.id);
                }}
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
                  <span>Proposer: {proposal.proposer && proposal.proposer.length > 20 
                    ? `${proposal.proposer.substring(0, 8)}...${proposal.proposer.substring(proposal.proposer.length - 8)}`
                    : proposal.proposer
                  }</span>
                </div>
                {proposal.summary && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{proposal.summary}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analysis Panel - Show when proposal is selected */}
      {selectedProposal && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-400 shadow-lg shadow-blue-100 ring-1 ring-blue-200 p-6 flex flex-col min-h-0 transition-all duration-500">
          <div className="flex-shrink-0 mb-4">
            <div className="flex items-center space-x-3 mb-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 -m-4 mb-2 rounded-xl">
              <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-800">Proposal Details</h2>
                <p className="text-xs text-slate-500 truncate">#{selectedProposalId}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {(() => {
              const proposalObj = Array.isArray(analyzedProposal) ? analyzedProposal[0] : analyzedProposal;
              const status = getStatusString(
                proposalObj?.status ||
                (Array.isArray(existingProposal) ? existingProposal?.[0]?.status : existingProposal?.status)
              );
              if (isAnalyzing || status === 'Analyzing') {
                return (
                  <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
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
                        onClick={handleRetryAnalysis}
                        disabled={proposalAnalysisMutation.isLoading}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
                      >
                        {proposalAnalysisMutation.isLoading ? 'Retrying...' : 'Retry Analysis'}
                      </button>
                    </div>
                  </div>
                );
              } else if (status === 'Analyzed' && proposalObj && proposalObj.analysis && proposalObj.analysis.length > 0) {
                // Show analysis results (existing code)
                return (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
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
                );
              } else if (!analyzedProposal) {
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
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProposalAnalysisPanel; 