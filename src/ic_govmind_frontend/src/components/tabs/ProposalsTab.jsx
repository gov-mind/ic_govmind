import { useState } from 'react';
import { Brain, Plus, AlertTriangle, X, Check, Users, Sparkles } from 'lucide-react';
import ProposalAnalysisPanel from '../ProposalAnalysisPanel';
import { useActiveCommittees, useGenerateDraftWithCommittee } from '../../hooks/useProposals';

export default function ProposalsTab({
  dao,
  backendDao,
  backendActor,
  proposals = [],
  proposalsLoading,
  proposalsError,
  refetchProposals,
}) {
  // Proposal creation state
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [proposalCreationStatus, setProposalCreationStatus] = useState(null); // 'success', 'error', or null
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  // Proposal Co-pilot state
  const [showProposalCopilot, setShowProposalCopilot] = useState(false);
  const [copilotIdea, setCopilotIdea] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [draftError, setDraftError] = useState(null);
  // Committee suggestion state
  const [useCommitteeSuggestion, setUseCommitteeSuggestion] = useState(true);
  const [generatedCommitteeSuggestion, setGeneratedCommitteeSuggestion] = useState(null);
  // Selected committee assignment for proposal metadata (optional)
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');

  // React Query hooks
  const { data: committees = [], isLoading: committeesLoading } = useActiveCommittees(backendActor, dao?.id);
  const generateDraftWithCommitteeMutation = useGenerateDraftWithCommittee();

  // Handle proposal creation
  const handleCreateProposal = async () => {
    if (!proposalTitle.trim() || !proposalContent.trim() || !dao) return;

    setIsCreatingProposal(true);
    setProposalCreationStatus(null);

    try {
      // Call create_proposal on the DAO canister
      const createProposalResult = await backendActor.create_proposal(
        proposalTitle.trim(),
        proposalContent.trim(),
        selectedCommitteeId ? [parseInt(selectedCommitteeId)] : [],
      );

      if (createProposalResult && createProposalResult.Ok !== undefined) {
        const proposalId = createProposalResult.Ok;
        console.log('Proposal created with ID:', proposalId);

        // Call submit_proposal_and_analyze in the proposal analyzer with automatic AI analysis
        const analyzerProposalId = `${dao.id}-${proposalId}`;
        
        let analyzerResult;
        try {
          // Use the new combined submit and analyze function
          const { submitProposalAndAnalyze } = await import('../../services/aiService');
          
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

  // Handle AI draft generation
  const handleGenerateAIDraft = async () => {
    if (!copilotIdea.trim()) {
      setDraftError('Please enter a proposal idea');
      return;
    }

    setIsGeneratingDraft(true);
    setDraftError(null);
    setGeneratedDraft(null);
    setGeneratedCommitteeSuggestion(null);

    try {
      if (useCommitteeSuggestion && committees.length > 0) {
        console.log(backendActor);
        console.log(dao);
        // Use the enhanced draft generation with committee suggestion
        const result = await generateDraftWithCommitteeMutation.mutateAsync({
          idea: copilotIdea.trim(),
          daoCanisterId: backendActor.canisterId || dao?.id
        });
        
        setGeneratedDraft(result.draft);
        setGeneratedCommitteeSuggestion(result.committee_suggestion);
      } else {
        // Use the original draft generation without committee suggestion
        const result = await generateDraftMutation.mutateAsync(copilotIdea.trim());
        
        if (result && result.Ok) {
          setGeneratedDraft(result.Ok);
        } else {
          setDraftError(result?.Err || 'Failed to generate proposal draft');
        }
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
      
      // Set the suggested committee if available
      if (generatedCommitteeSuggestion?.committee_id) {
        setSelectedCommitteeId(generatedCommitteeSuggestion.committee_id);
      }
      
      // Close co-pilot and show proposal form
      setShowProposalCopilot(false);
      setShowCreateProposal(true);
      
      // Reset co-pilot state
      setCopilotIdea('');
      setGeneratedDraft(null);
      setGeneratedCommitteeSuggestion(null);
      setDraftError(null);
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
   
  return (
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowProposalCopilot(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-sm"
          >
            <Brain className="w-4 h-4" />
            <span>Proposal Co-pilot</span>
          </button>
          <button
            onClick={() => setShowCreateProposal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </button>
        </div>
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
          proposals={proposals.map((proposal) => {
            const voteStats = calculateVoteStats(proposal);
            const status = typeof proposal.status === 'string' ? proposal.status : Object.keys(proposal.status)[0];
            return {
              id: Number(proposal.id),
              title: proposal.title,
              summary: proposal.content,
              proposer: proposal.proposer,
              status: status,
              votesFor: voteStats.yesVotes,
              votesAgainst: voteStats.noVotes,
              compositeId: `${dao?.id || 'unknown'}-${proposal.id}`,
              created_at: Number(proposal.created_at),
              expires_at: Number(proposal.expires_at),
            };
          })}
          canisterName={dao?.name || 'DAO'}
          selectedProposalId={selectedProposalId}
          setSelectedProposalId={setSelectedProposalId}
        />
      )}

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

                {/* Committee Selection (optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Committee (optional)</label>
                  <select
                    value={selectedCommitteeId}
                    onChange={(e) => setSelectedCommitteeId(e.target.value)}
                    disabled={isCreatingProposal}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">No committee</option>
                    {(backendDao?.committees || []).filter((c) => (c.active === undefined ? true : !!c.active)).map((c) => (
                      <option key={Number(c.id)} value={String(Number(c.id))}>
                        {(() => {
                          const ct = c.committee_type;
                          const label = typeof ct === 'string' ? ct : (ct && typeof ct === 'object' ? Object.keys(ct)[0] : 'Unknown');
                          return `${label} #${Number(c.id)}`;
                        })()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">If selected, the proposal will be tagged with the committee.</p>
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
                  if (setGeneratedDraft) setGeneratedDraft(null);
                  if (setDraftError) setDraftError(null);
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

                {/* Committee Suggestion Toggle */}
                {committees.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="text-sm font-medium text-slate-700">Committee Suggestion</h3>
                          <p className="text-xs text-slate-500">Get AI recommendations for the most suitable committee</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCommitteeSuggestion}
                          onChange={(e) => setUseCommitteeSuggestion(e.target.checked)}
                          disabled={isGeneratingDraft}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    {useCommitteeSuggestion && (
                      <div className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span>AI will analyze your proposal and suggest the most relevant committee from {committees.length} available committees.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                    {/* Committee Suggestion Display */}
                    {generatedCommitteeSuggestion && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 mb-1">Recommended Committee</h4>
                            <div className="mb-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {(() => {
                                  const committee = committees.find(c => c.id === generatedCommitteeSuggestion.committee_id);
                                  if (!committee) return `Committee #${generatedCommitteeSuggestion.committee_id}`;
                                  const ct = committee.committee_type;
                                  const label = typeof ct === 'string' ? ct : (ct && typeof ct === 'object' ? Object.keys(ct)[0] : 'Unknown');
                                  return `${label} #${Number(committee.id)}`;
                                })()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{generatedCommitteeSuggestion.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    )}

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