import React from 'react';
import { Brain, Plus, AlertTriangle } from 'lucide-react';
import ProposalAnalysisPanel from '../ProposalAnalysisPanel';

export default function ProposalsTab({
  dao,
  proposals = [],
  proposalsLoading,
  proposalsError,
  refetchProposals,
  selectedProposalId,
  setSelectedProposalId,
  setShowProposalCopilot,
  setShowCreateProposal,
  calculateVoteStats,
}) {
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
    </div>
  );
}