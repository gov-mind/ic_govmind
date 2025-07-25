import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Users,
  Settings,
  Shield,
  Activity,
  Edit3,
  Hourglass
} from 'lucide-react';

import {
  useProposals,
  useProposal,
  useSubmitProposal,
  useProposalAnalysis,
  getStatusString,
  getStatusBadgeClass,
  getStatusIcon
} from '../hooks/useProposals';

// Modal Component for Proposal Submission
function ProposalSubmissionModal({ isOpen, onClose, onProposalSubmitted }) {
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAIAnalysis, setUseAIAnalysis] = useState(true);
  const [aiProvider, setAiProvider] = useState('deepseek');
  const submitProposalMutation = useSubmitProposal();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!proposalTitle.trim() || !proposalDescription.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const proposalId = await submitProposalMutation.mutateAsync({
        title: proposalTitle,
        description: proposalDescription,
        useAI: useAIAnalysis,
        aiProvider: aiProvider
      });

      // Clear form and state, then close modal
      setProposalTitle('');
      setProposalDescription('');
      setIsSubmitting(false);
      onClose();

      // Auto-select the newly submitted proposal
      if (onProposalSubmitted && proposalId) {
        onProposalSubmitted(proposalId);
      }

    } catch (error) {
      console.error('Error submitting proposal:', error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !submitProposalMutation.isLoading) {
      setIsSubmitting(false);
      onClose();
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
                <Edit3 className="text-blue-600 font-semibold w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Submit New Proposal</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              disabled={submitProposalMutation.isLoading || isSubmitting}
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
                disabled={submitProposalMutation.isLoading || isSubmitting}
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
                disabled={submitProposalMutation.isLoading || isSubmitting}
              />
            </div>

            {/* AI Analysis Configuration */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <label htmlFor="useAIAnalysis" className="text-sm font-semibold text-blue-800">
                    AI Analysis
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="useAIAnalysis"
                    checked={useAIAnalysis}
                    onChange={(e) => setUseAIAnalysis(e.target.checked)}
                    disabled={submitProposalMutation.isLoading || isSubmitting}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    useAIAnalysis ? 'bg-blue-600' : 'bg-slate-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      useAIAnalysis ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>
              
              {useAIAnalysis && (
                <div>
                  <label htmlFor="aiProvider" className="block text-xs font-medium text-blue-700 mb-2">
                    AI Provider
                  </label>
                  <select
                    id="aiProvider"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    disabled={submitProposalMutation.isLoading || isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="deepseek">DeepSeek (Recommended)</option>
                    <option value="openai">OpenAI GPT-4</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    {useAIAnalysis ? 'Your proposal will be analyzed by AI for risks, recommendations, and complexity.' : 'AI analysis will be skipped.'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitProposalMutation.isLoading || isSubmitting}
                className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitProposalMutation.isLoading || isSubmitting || !proposalTitle.trim() || !proposalDescription.trim()}
                className="flex-1 bg-gradient-to-r from-blue-700 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-blue-800 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm"
              >
                {(submitProposalMutation.isLoading || isSubmitting) ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{useAIAnalysis ? 'Analyzing...' : 'Submitting...'}</span>
                  </div>
                ) : (
                  useAIAnalysis ? 'Submit & Analyze with AI' : 'Submit Proposal'
                )}
              </button>
            </div>

            {/* Loading Status */}
            {(submitProposalMutation.isLoading || isSubmitting) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    {useAIAnalysis ? 'AI analyzing proposal...' : 'Submitting proposal...'}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {useAIAnalysis ? 'Your proposal is being analyzed by AI for risks, recommendations, and complexity.' : 'Your proposal is being submitted to the canister.'}
                </p>
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
  const [showComplexityBreakdown, setShowComplexityBreakdown] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true); // New state for controlling analysis panel visibility

  // React Query hooks
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useProposals();
  const { data: selectedProposal, isLoading: proposalLoading } = useProposal(selectedProposalId);
  const proposalAnalysisMutation = useProposalAnalysis();

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
    setShowAnalysisPanel(true); // Show analysis panel when a proposal is selected
  };

  // Handle retry analysis
  const handleRetryAnalysis = async (proposalId) => {
    try {
      // Find the proposal data to get title and description
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        console.error('Proposal not found for retry:', proposalId);
        return;
      }
      
      await proposalAnalysisMutation.mutateAsync({
        proposalId: proposalId,
        title: proposal.title,
        description: proposal.description,
        isRetry: true
      });
    } catch (error) {
      console.error('Error retrying analysis:', error);
    }
  };

  // Check if a proposal is being retried
  const isRetrying = (proposalId) => {
    return proposalAnalysisMutation.isLoading && 
           proposalAnalysisMutation.variables?.proposalId === proposalId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
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
              <Link to="/sns-governance" className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors font-medium">
                SNS Governance
              </Link>
            </nav>

            {/* New Proposal Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-800 hover:to-cyan-700 transition-all duration-200 font-medium shadow-sm flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Proposal</span>
            </button>
          </div>
        </div>

        {/* Main Content - Dynamic Layout */}
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
                  <p className="text-sm mb-4">Submit your first proposal to get started</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-800 hover:to-cyan-700 transition-all duration-200 text-sm font-medium flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Proposal</span>
                  </button>
                </div>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    data-proposal-id={proposal.id}
                    onClick={() => handleProposalSelect(proposal)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md relative ${selectedProposalId === proposal.id
                      ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg ring-2 ring-blue-300 ring-opacity-50'
                      : 'border-slate-200 hover:border-cyan-400 hover:shadow-sm'
                      }`}
                  >
                    {/* Connection indicator for selected proposal */}
                    {selectedProposalId === proposal.id && (
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
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
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
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

          {/* Analysis Results - Right Column - Only show when proposal is selected AND panel is visible */}
          {selectedProposalId && showAnalysisPanel && (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-400 shadow-lg shadow-blue-100 ring-1 ring-blue-200 p-6 flex flex-col min-h-0 transition-all duration-500">
              <div className="flex-shrink-0 mb-4">
                <div className="flex items-center space-x-3 mb-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 -m-4 mb-2 rounded-xl">
                  <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800">Analysis Results</h2>
                    <p className="text-xs text-slate-500 truncate">#{selectedProposal?.id} • {selectedProposal?.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Close Analysis Panel Button */}
                    <button
                      onClick={() => {
                        setShowAnalysisPanel(false);
                        setSelectedProposalId(null); // Clear selected proposal when closing analysis
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
                {showDescription && selectedProposal && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="text-slate-600 text-xs font-semibold w-4 h-4" />
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

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
                {proposalLoading ? (
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
                            <FileText className="mr-2 text-lg w-5 h-5" /> Summary
                          </h4>
                          <p className="text-sm text-blue-700 leading-relaxed">{selectedProposal.analysis[0].summary || 'No summary available'}</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md hover:bg-amber-100 transition-all duration-200">
                          <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                            <AlertTriangle className="mr-2 text-lg w-5 h-5" /> Risk Assessment
                          </h4>
                          <div className="text-sm text-amber-700">
                            {formatBulletPoints(selectedProposal.analysis[0].risk_assessment)}
                          </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:shadow-md hover:bg-emerald-100 transition-all duration-200">
                          <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                            <Lightbulb className="mr-2 text-lg w-5 h-5" /> Recommendations
                          </h4>
                          <div className="text-sm text-emerald-700">
                            {formatBulletPoints(selectedProposal.analysis[0].recommendations)}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
                          {/* Header with Toggle */}
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-blue-800 flex items-center">
                              <BarChart3 className="mr-2 text-lg w-5 h-5" /> Complexity Analysis
                            </h4>
                            <button
                              onClick={() => setShowComplexityBreakdown(!showComplexityBreakdown)}
                              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <span>{showComplexityBreakdown ? 'Hide Details' : 'Show Details'}</span>
                              {showComplexityBreakdown ? (
                                <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                              ) : (
                                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                              )}
                            </button>
                          </div>

                          {/* Overall Complexity Score - Always Visible */}
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-blue-700">
                                  {selectedProposal.analysis[0].complexity_score}
                                </span>
                                <span className="text-xs text-blue-500 font-medium">out of 10</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-blue-700">Overall Complexity</span>
                                  <span className="text-sm text-blue-600">
                                    {selectedProposal.analysis[0].complexity_score >= 8 ? 'Very Complex' :
                                      selectedProposal.analysis[0].complexity_score >= 6 ? 'Complex' :
                                        selectedProposal.analysis[0].complexity_score >= 4 ? 'Moderate' : 'Simple'}
                                  </span>
                                </div>
                                <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                                    style={{ width: `${(selectedProposal.analysis[0].complexity_score / 10) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Breakdown - Collapsible */}
                          {showComplexityBreakdown && selectedProposal.analysis[0].complexity_breakdown && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">

                              {/* Complexity Dimensions Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Technical Complexity */}
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Settings className="text-blue-600 w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-700">Technical</span>
                                    <span className="text-sm font-bold text-blue-600 ml-auto">
                                      {selectedProposal.analysis[0].complexity_breakdown.technical_complexity}/10
                                    </span>
                                  </div>
                                  <div className="bg-blue-100 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                      style={{ width: `${(selectedProposal.analysis[0].complexity_breakdown.technical_complexity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Financial Complexity */}
                                <div className="bg-white rounded-lg p-3 border border-green-100">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <TrendingUp className="text-green-600 w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-700">Financial</span>
                                    <span className="text-sm font-bold text-green-600 ml-auto">
                                      {selectedProposal.analysis[0].complexity_breakdown.financial_complexity}/10
                                    </span>
                                  </div>
                                  <div className="bg-green-100 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                      style={{ width: `${(selectedProposal.analysis[0].complexity_breakdown.financial_complexity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Governance Complexity */}
                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Users className="text-orange-600 w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-700">Governance</span>
                                    <span className="text-sm font-bold text-orange-600 ml-auto">
                                      {selectedProposal.analysis[0].complexity_breakdown.governance_complexity}/10
                                    </span>
                                  </div>
                                  <div className="bg-orange-100 rounded-full h-2">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                                      style={{ width: `${(selectedProposal.analysis[0].complexity_breakdown.governance_complexity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Timeline Complexity */}
                                <div className="bg-white rounded-lg p-3 border border-red-100">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Clock className="text-red-600 w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-700">Timeline</span>
                                    <span className="text-sm font-bold text-red-600 ml-auto">
                                      {selectedProposal.analysis[0].complexity_breakdown.timeline_complexity}/10
                                    </span>
                                  </div>
                                  <div className="bg-red-100 rounded-full h-2">
                                    <div
                                      className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                                      style={{ width: `${(selectedProposal.analysis[0].complexity_breakdown.timeline_complexity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Explanations */}
                              <div className="space-y-3">
                                {/* Complexity Explanation */}
                                {selectedProposal.analysis[0].complexity_breakdown.explanation && (
                                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Lightbulb className="text-blue-600 text-xs w-4 h-4" />
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="text-sm font-semibold text-blue-800 mb-2">Why this complexity?</h5>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                          {selectedProposal.analysis[0].complexity_breakdown.explanation}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Complexity Comparison */}
                                {selectedProposal.analysis[0].complexity_breakdown.comparison && (
                                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <BarChart3 className="text-blue-600 text-xs w-4 h-4" />
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="text-sm font-semibold text-blue-800 mb-2">Compared to other proposals</h5>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                          {selectedProposal.analysis[0].complexity_breakdown.comparison}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md hover:bg-indigo-100 transition-all duration-200">
                          <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                            <Activity className="mr-2 text-lg w-5 h-5" /> Estimated Impact
                          </h4>
                          <p className="text-sm text-indigo-700 leading-relaxed">{selectedProposal.analysis[0].estimated_impact}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-12 text-center">
                        {getStatusString(selectedProposal.status) === 'Analyzing' ? (
                          <div className="space-y-3">
                            <RefreshCw className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto text-blue-500" />
                            <p className="text-slate-600 font-medium">Analyzing proposal...</p>
                            <p className="text-xs text-slate-500">This may take a few moments</p>
                          </div>
                        ) : getStatusString(selectedProposal.status) === 'Failed' ? (
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                              <X className="text-red-600 text-xl w-6 h-6" />
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
                              <Hourglass className="text-slate-600 w-6 h-6" />
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
                        <X className="text-red-600 w-8 h-8" />
                      </div>
                      <p className="text-slate-600 font-medium mb-2">Proposal not found</p>
                      <p className="text-sm text-slate-500">The selected proposal could not be loaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Proposal Submission Modal */}
      <ProposalSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProposalSubmitted={(proposalId) => {
          setSelectedProposalId(proposalId);
          setShowDescription(false); // Reset description visibility for new proposal
          setShowAnalysisPanel(true); // Show analysis panel for new proposal
        }}
      />

      {/* Floating Action Button (Alternative to header button) */}
      {proposals.length > 0 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-700 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-blue-800 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center z-40"
          title="New Proposal"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}
    </div>
  );
}

export default ProposalsPage; 