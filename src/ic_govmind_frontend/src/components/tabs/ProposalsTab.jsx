import { useState } from 'react';
import { Brain, Plus, AlertTriangle, X, Check } from 'lucide-react';
import ProposalAnalysisPanel from '../ProposalAnalysisPanel';
import { useActiveCommittees, useGenerateDraftWithCommittee, useGenerateDraft } from '../../hooks/useProposals';
import { useNavigate } from 'react-router-dom';

export default function ProposalsTab({
  dao,
  backendDao,
  backendActor,
  proposals = [],
  proposalsLoading,
  proposalsError,
  refetchProposals,
}) {
  const navigate = useNavigate();
  // Proposal creation state
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [proposalCreationStatus, setProposalCreationStatus] = useState(null); // 'success', 'error', or null
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  // Selected committee assignment for proposal metadata (optional)
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');

  // React Query hooks
  const { data: committees = [], isLoading: committeesLoading } = useActiveCommittees(backendActor, dao?.id);
  const generateDraftWithCommitteeMutation = useGenerateDraftWithCommittee();
  const generateDraftMutation = useGenerateDraft();

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
            onClick={() => navigate(`/dao/${dao?.id}/copilot`)}
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

      {/* Proposal Creation Modal remains unchanged */}
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
    </div>
  );
}