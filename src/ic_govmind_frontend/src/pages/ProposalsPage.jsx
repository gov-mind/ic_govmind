import { useState } from 'react';
import { Link } from 'react-router-dom';


import { 
  useProposals, 
  useProposal, 
  useSubmitProposal, 
  useRetryAnalysis,
  getStatusString,
  getStatusBadgeClass,
  getStatusIcon
} from '../hooks/useProposals';

// Modal Component for Proposal Submission
function ProposalSubmissionModal({ isOpen, onClose }) {
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const submitProposalMutation = useSubmitProposal();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!proposalTitle.trim() || !proposalDescription.trim()) return;

    try {
      await submitProposalMutation.mutateAsync({
        title: proposalTitle,
        description: proposalDescription
      });
      
      // Clear form and close modal
      setProposalTitle('');
      setProposalDescription('');
      onClose();
      
    } catch (error) {
      console.error('Error submitting proposal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Submit New Proposal</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              disabled={submitProposalMutation.isLoading}
            >
              <span className="text-slate-600 text-lg">×</span>
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="proposalTitle" className="block text-sm font-semibold text-slate-700 mb-3">
                Proposal Title
              </label>
              <input
                type="text"
                id="proposalTitle"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="e.g., Marketing Budget Allocation for Q1 2024"
                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200 text-sm"
                disabled={submitProposalMutation.isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="proposalDescription" className="block text-sm font-semibold text-slate-700 mb-3">
                Proposal Description
              </label>
              <textarea
                id="proposalDescription"
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                placeholder="Provide a detailed description of your proposal, including objectives, budget breakdown, timeline, and expected outcomes..."
                rows={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-slate-50 focus:bg-white text-sm"
                disabled={submitProposalMutation.isLoading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitProposalMutation.isLoading}
                className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitProposalMutation.isLoading || !proposalTitle.trim() || !proposalDescription.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm"
              >
                {submitProposalMutation.isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit & Analyze Proposal'
                )}
              </button>
            </div>

            {/* Loading Status */}
            {submitProposalMutation.isLoading && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700 font-medium">Analyzing proposal...</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Your proposal is being processed by our AI system.</p>
              </div>
            )}

            {/* Error State */}
            {submitProposalMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-medium">Failed to submit proposal. Please try again.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function ProposalsPage() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  // React Query hooks
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useProposals();
  const { data: selectedProposal, isLoading: proposalLoading } = useProposal(selectedProposalId);
  const retryAnalysisMutation = useRetryAnalysis();

  // Utility function to format numbered text into bullet points
  const formatBulletPoints = (text) => {
    if (!text) return text;
    
    // Try to match numbered patterns and extract both number and content
    const numberedPattern = /(\d+)\.\s*([^0-9]*?)(?=\d+\.|$)/g;
    const matches = [...text.matchAll(numberedPattern)];
    
    // If we found numbered items, format them as bullet points
    if (matches.length > 1) {
      return (
        <ul className="space-y-2 list-none">
          {matches.map((match, index) => {
            const content = match[2].trim();
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
      .filter(sentence => sentence.trim().length > 5) // Filter out short fragments
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
    
    // If no pattern found, return original text
    return <div className="leading-relaxed">{text}</div>;
  };

  // Handle proposal selection
  const handleProposalSelect = (proposal) => {
    // Add a brief animation class for feedback
    const element = document.querySelector(`[data-proposal-id="${proposal.id}"]`);
    if (element) {
      element.classList.add('animate-pulse');
      setTimeout(() => {
        element.classList.remove('animate-pulse');
      }, 200);
    }
    
    setSelectedProposalId(proposal.id);
    setShowDescription(false); // Reset description visibility when switching proposals
  };

  // Handle retry analysis
  const handleRetryAnalysis = async (proposalId) => {
    try {
      await retryAnalysisMutation.mutateAsync(proposalId);
    } catch (error) {
      console.error('Error retrying analysis:', error);
    }
  };

  // Check if a proposal is being retried
  const isRetrying = (proposalId) => {
    return retryAnalysisMutation.isLoading && retryAnalysisMutation.variables === proposalId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GovMind AI</h1>
                <p className="text-sm text-slate-600">DAO Proposal Analysis Platform</p>
              </div>
            </Link>
            
            {/* New Proposal Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm flex items-center space-x-2"
            >
              <span className="text-lg">+</span>
              <span>New Proposal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 2 Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid grid-cols-1 gap-6 h-[calc(100vh-12rem)] transition-all duration-500 ${
          selectedProposalId ? 'lg:grid-cols-[35%_65%]' : 'lg:grid-cols-2'
        }`}>
          {/* Proposals List - Left Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">📋</span>
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
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="text-sm font-medium">Error loading proposals</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <p className="text-base font-medium mb-2">No proposals yet</p>
                  <p className="text-sm mb-4">Submit your first proposal to get started</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Create First Proposal
                  </button>
                </div>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    data-proposal-id={proposal.id}
                    onClick={() => handleProposalSelect(proposal)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md relative ${
                      selectedProposalId === proposal.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 ring-opacity-50'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Connection indicator for selected proposal */}
                    {selectedProposalId === proposal.id && (
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        #{proposal.id}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusBadgeClass(proposal.status)}`}>
                          {getStatusIcon(proposal.status)} {getStatusString(proposal.status)}
                        </span>
                        {getStatusString(proposal.status) === 'Failed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryAnalysis(proposal.id);
                            }}
                            disabled={isRetrying(proposal.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retry analysis"
                          >
                            {isRetrying(proposal.id) ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '🔄'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-slate-800 font-medium text-sm mb-2 line-clamp-2">{proposal.title}</h4>
                    <p className="text-slate-600 text-xs line-clamp-2 mb-3">{proposal.description}</p>
                    <div className="text-xs text-slate-500">
                      {new Date(Number(proposal.submitted_at) / 1000000).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analysis Results - Right Column */}
          <div className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col min-h-0 transition-all duration-500 ${
            selectedProposalId 
              ? 'border-blue-300 shadow-lg shadow-blue-100 ring-1 ring-blue-100' 
              : 'border-slate-200'
          }`}>
            {selectedProposalId && (
              <div className="flex-shrink-0 mb-4">
                <div className="flex items-center space-x-3 mb-3 bg-gradient-to-r from-blue-50 to-transparent p-4 -m-4 mb-2 rounded-xl">
                  <div className="w-1 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800">Analysis Results</h2>
                    <p className="text-xs text-slate-500 truncate">#{selectedProposal?.id} • {selectedProposal?.title}</p>
                  </div>
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-blue-100 transition-colors text-slate-500 hover:text-slate-700"
                    title={showDescription ? "Hide description" : "Show description"}
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showDescription ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Expandable Description */}
                {showDescription && selectedProposal && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-slate-600 text-xs font-semibold">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Proposal Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedProposal.description}</p>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500">
                            Submitted on {new Date(Number(selectedProposal.submitted_at) / 1000000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!selectedProposalId && (
              <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🔍</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Analysis Results</h2>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
              {!selectedProposalId ? (
                <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-slate-600">🔍</span>
                    </div>
                    <p className="text-slate-600 font-medium mb-2">No proposal selected</p>
                    <p className="text-sm text-slate-500">Choose a proposal from the list to view its analysis</p>
                  </div>
                </div>
              ) : proposalLoading ? (
                <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading proposal...</p>
                  </div>
                </div>
              ) : selectedProposal ? (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                  {/* Analysis Results */}
                  {selectedProposal.analysis && selectedProposal.analysis.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md hover:bg-blue-100 transition-all duration-200">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <span className="mr-2 text-lg">📖</span> Summary
                        </h4>
                        <p className="text-sm text-blue-700 leading-relaxed">{selectedProposal.analysis[0].summary || 'No summary available'}</p>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md hover:bg-amber-100 transition-all duration-200">
                        <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">⚠️</span> Risk Assessment
                        </h4>
                        <div className="text-sm text-amber-700">
                          {formatBulletPoints(selectedProposal.analysis[0].risk_assessment)}
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:shadow-md hover:bg-emerald-100 transition-all duration-200">
                        <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">💡</span> Recommendations
                        </h4>
                        <div className="text-sm text-emerald-700">
                          {formatBulletPoints(selectedProposal.analysis[0].recommendations)}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:shadow-md hover:bg-purple-100 transition-all duration-200">
                        <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">📊</span> Complexity Score
                        </h4>
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl font-bold text-purple-700">
                            {selectedProposal.analysis[0].complexity_score}/10
                          </span>
                          <div className="flex-1 bg-purple-200 rounded-full h-3">
                            <div 
                              className="bg-purple-600 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${(selectedProposal.analysis[0].complexity_score / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md hover:bg-indigo-100 transition-all duration-200">
                        <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                          <span className="mr-2 text-lg">🎯</span> Estimated Impact
                        </h4>
                        <p className="text-sm text-indigo-700 leading-relaxed">{selectedProposal.analysis[0].estimated_impact}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-12 text-center">
                      {getStatusString(selectedProposal.status) === 'Analyzing' ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-slate-600 font-medium">Analyzing proposal...</p>
                          <p className="text-xs text-slate-500">This may take a few moments</p>
                        </div>
                      ) : getStatusString(selectedProposal.status) === 'Failed' ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-red-600 text-xl">❌</span>
                          </div>
                          <p className="text-slate-600 font-medium">Analysis failed</p>
                          <p className="text-xs text-slate-500 mb-3">There was an error analyzing this proposal</p>
                          <button
                            onClick={() => handleRetryAnalysis(selectedProposal.id)}
                            disabled={isRetrying(selectedProposal.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {isRetrying(selectedProposal.id) ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Retrying...</span>
                              </div>
                            ) : (
                              'Retry Analysis'
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-slate-600 text-xl">⏳</span>
                          </div>
                          <p className="text-slate-600 font-medium">Waiting for analysis</p>
                          <p className="text-xs text-slate-500">Analysis will begin automatically</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-red-600">❌</span>
                    </div>
                    <p className="text-slate-600 font-medium mb-2">Proposal not found</p>
                    <p className="text-sm text-slate-500">The selected proposal could not be loaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Proposal Submission Modal */}
      <ProposalSubmissionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Floating Action Button (Alternative to header button) */}
      {proposals.length > 0 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center z-40"
          title="New Proposal"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}
    </div>
  );
}

export default ProposalsPage; 