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

function ProposalsPage() {
  // Form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState(null);

  // React Query hooks
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useProposals();
  const { data: selectedProposal, isLoading: proposalLoading } = useProposal(selectedProposalId);
  const submitProposalMutation = useSubmitProposal();
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

  // Handle form submission
  const handleProposalSubmit = async (event) => {
    event.preventDefault();
    if (!proposalTitle.trim() || !proposalDescription.trim()) return;

    try {
      const proposalId = await submitProposalMutation.mutateAsync({
        title: proposalTitle,
        description: proposalDescription
      });
      
      // Clear form and select the new proposal
      setProposalTitle('');
      setProposalDescription('');
      setSelectedProposalId(proposalId);
      
      console.log('Proposal submitted with ID:', proposalId);
    } catch (error) {
      console.error('Error submitting proposal:', error);
    }
  };

  // Handle proposal selection
  const handleProposalSelect = (proposal) => {
    setSelectedProposalId(proposal.id);
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Proposal Submission */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📝</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Submit New Proposal</h2>
              </div>
              
              <form onSubmit={handleProposalSubmit} className="space-y-4">
                <div>
                  <label htmlFor="proposalTitle" className="block text-sm font-medium text-slate-700 mb-3">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    id="proposalTitle"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="e.g., Marketing Budget Allocation"
                    className="w-full h-10 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all duration-200"
                    disabled={submitProposalMutation.isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="proposalDescription" className="block text-sm font-medium text-slate-700 mb-3">
                    Proposal Description
                  </label>
                  <textarea
                    id="proposalDescription"
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="e.g., We need to allocate 1000 tokens for marketing initiatives. Please provide a detailed breakdown of the budget and its allocation."
                    className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-slate-50 focus:bg-white"
                    disabled={submitProposalMutation.isLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitProposalMutation.isLoading || !proposalTitle.trim() || !proposalDescription.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
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
              </form>

              {submitProposalMutation.isLoading && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-700 font-medium">Analyzing proposal...</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Your proposal is being processed by our AI system.</p>
                </div>
              )}

              {submitProposalMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">Failed to submit proposal. Please try again.</p>
                </div>
              )}
            </div>
          </div>

          {/* Proposals List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">📋</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">All Proposals</h2>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">Loading proposals...</p>
                  </div>
                ) : proposalsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p className="text-sm">Error loading proposals</p>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-sm">No proposals yet</p>
                    <p className="text-xs mt-1">Submit your first proposal to get started</p>
                  </div>
                ) : (
                  proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      onClick={() => handleProposalSelect(proposal)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedProposalId === proposal.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
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
                      <h4 className="text-slate-800 font-medium text-sm mb-1">{proposal.title}</h4>
                      <p className="text-slate-600 text-xs line-clamp-2 mb-2">{proposal.description}</p>
                      <div className="text-xs text-slate-500">
                        {new Date(Number(proposal.submitted_at) / 1000000).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🔍</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Analysis Results</h2>
              </div>
              
              {!selectedProposalId ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-slate-600">🔍</span>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">No proposal selected</p>
                  <p className="text-sm text-slate-500">Choose a proposal from the list to view its analysis</p>
                </div>
              ) : proposalLoading ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Loading proposal...</p>
                </div>
              ) : selectedProposal ? (
                <div className="space-y-6">
                  {/* Proposal Info */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800">#{selectedProposal.id}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusBadgeClass(selectedProposal.status)}`}>
                        {getStatusIcon(selectedProposal.status)} {getStatusString(selectedProposal.status)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">{selectedProposal.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{selectedProposal.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Number(selectedProposal.submitted_at) / 1000000).toLocaleString()}
                    </p>
                  </div>

                  {/* Analysis Results */}
                  {selectedProposal.analysis && selectedProposal.analysis.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <span className="mr-2">📖</span> Summary
                        </h4>
                        <p className="text-sm text-blue-700">{selectedProposal.analysis[0].summary || 'No summary available'}</p>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="font-medium text-amber-800 mb-3 flex items-center">
                          <span className="mr-2">⚠️</span> Risk Assessment
                        </h4>
                        <div className="text-sm text-amber-700">
                          {formatBulletPoints(selectedProposal.analysis[0].risk_assessment)}
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="font-medium text-emerald-800 mb-3 flex items-center">
                          <span className="mr-2">💡</span> Recommendations
                        </h4>
                        <div className="text-sm text-emerald-700">
                          {formatBulletPoints(selectedProposal.analysis[0].recommendations)}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                          <span className="mr-2">📊</span> Complexity Score
                        </h4>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-purple-700">
                            {selectedProposal.analysis[0].complexity_score}/10
                          </span>
                          <div className="flex-1 bg-purple-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(selectedProposal.analysis[0].complexity_score / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                        <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
                          <span className="mr-2">🎯</span> Estimated Impact
                        </h4>
                        <p className="text-sm text-indigo-700">{selectedProposal.analysis[0].estimated_impact}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-8 text-center">
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
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-red-600">❌</span>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">Proposal not found</p>
                  <p className="text-sm text-slate-500">The selected proposal could not be loaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProposalsPage; 