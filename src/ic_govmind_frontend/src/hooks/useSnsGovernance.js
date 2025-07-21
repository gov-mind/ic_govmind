import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ic_govmind_sns } from 'declarations/ic_govmind_sns';

// Query Keys
export const QUERY_KEYS = {
  snsCanisters: ['sns-canisters'],
  snsProposals: (canisterId) => ['sns-proposals', canisterId],
  snsStatistics: ['sns-statistics'],
};

// Custom hook for fetching SNS governance canisters
export const useSnsCanisters = () => {
  return useQuery({
    queryKey: QUERY_KEYS.snsCanisters,
    queryFn: async () => {
      const canisters = await ic_govmind_sns.get_sns_canisters();
      return canisters.map(canister => ({
        id: canister.id,
        name: canister.name,
        canisterId: canister.canister_id,
        description: canister.description,
        totalProposals: canister.total_proposals,
        activeProposals: canister.active_proposals,
        lastActivity: Number(canister.last_activity) / 1000000, // Convert from nanoseconds to milliseconds
      }));
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

// Custom hook for fetching SNS proposals
export const useSnsProposals = (canisterId) => {
  return useQuery({
    queryKey: QUERY_KEYS.snsProposals(canisterId),
    queryFn: async () => {
      if (!canisterId) return [];
      
      const result = await ic_govmind_sns.get_sns_proposals(canisterId);
      if ('Err' in result) {
        throw new Error(`Failed to fetch proposals: ${result.Err}`);
      }
      
      const proposals = result.Ok;
      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        summary: proposal.summary,
        status: proposal.status,
        executed: proposal.executed,
        executedAt: proposal.executed_at ? Number(proposal.executed_at) / 1000000 : null, // Convert from nanoseconds to milliseconds
        proposer: proposal.proposer,
        votesFor: proposal.votes_for,
        votesAgainst: proposal.votes_against,
        totalVotes: proposal.total_votes,
      }));
    },
    enabled: !!canisterId, // Only run if canisterId exists
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

// Helper function to get status badge classes for SNS proposals
export const getSnsProposalStatusClass = (status) => {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Executed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to format vote counts
export const formatVoteCount = (votes) => {
  if (votes >= 1000000) {
    return `${(votes / 1000000).toFixed(1)}M`;
  } else if (votes >= 1000) {
    return `${(votes / 1000).toFixed(1)}K`;
  }
  return votes.toString();
};

// Helper function to calculate vote percentage
export const calculateVotePercentage = (votesFor, totalVotes) => {
  if (totalVotes === 0) return 0;
  return Math.round((votesFor / totalVotes) * 100);
};



// Custom hook for fetching SNS statistics
export const useSnsStatistics = () => {
  return useQuery({
    queryKey: QUERY_KEYS.snsStatistics,
    queryFn: async () => {
      const [totalCanisters, totalProposals, activeProposals] = await ic_govmind_sns.get_sns_statistics();
      return {
        totalCanisters,
        totalProposals,
        activeProposals,
      };
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}; 