import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ic_govmind_sns } from 'declarations/ic_govmind_sns';

// Query Keys
export const QUERY_KEYS = {
  snsCanisters: ['sns-canisters'],
  snsProposals: (canisterId) => ['sns-proposals', canisterId],
  snsStatistics: ['sns-statistics'],
};

// Custom hook for fetching SNS governance canisters
export const useSnsCanisters = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: [QUERY_KEYS.snsCanisters, page, pageSize],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const result = await ic_govmind_sns.get_sns_canisters([offset], [pageSize]);
      if (!Array.isArray(result) || result.length < 2) {
        throw new Error('Invalid response from get_sns_canisters');
      }
      const canisters = result[0];
      const paginationInfo = result[1];
      return {
        canisters: canisters.map(canister => ({
          id: canister.id,
          name: canister.name,
          canisterId: canister.canister_id,
          description: canister.description,
          logo: canister.logo?.length ? canister.logo[0] : undefined,
          totalProposals: canister.total_proposals,
          activeProposals: canister.active_proposals,
          lastActivity: Number(canister.last_activity) / 1000000, // Convert from nanoseconds to milliseconds
        })),
        paginationInfo,
      };
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

// Custom hook for fetching a single SNS canister by ID
export const useSnsCanister = (canisterId) => {
  return useQuery({
    queryKey: ['sns-canister', canisterId],
    queryFn: async () => {
      if (!canisterId) return null;
      
      const result = await ic_govmind_sns.get_sns_canister(canisterId);
      
      if ('Err' in result) {
        throw new Error(`Failed to fetch canister: ${result.Err}`);
      }
      
      const canister = result.Ok;
      return {
        id: canister.id,
        name: canister.name,
        canisterId: canister.canister_id,
        description: canister.description,
        logo: canister.logo?.length ? canister.logo[0] : undefined,
        totalProposals: canister.total_proposals,
        activeProposals: canister.active_proposals,
        lastActivity: Number(canister.last_activity) / 1000000, // Convert from nanoseconds to milliseconds
      };
    },
    enabled: !!canisterId,
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
      console.log(result);

      if ('Err' in result) {
        throw new Error(`Failed to fetch proposals: ${result.Err}`);
      }
      
      const proposals = result.Ok;
      return proposals.map(proposal => ({
        id: Number(proposal.id),
        compositeId: canisterId + '-' + Number(proposal.id),
        title: proposal.title,
        summary: proposal.summary,
        status: proposal.status,
        executed: proposal.executed,
        executedAt: proposal.executed_at ? Number(proposal.executed_at) / 1000000 : null, // Convert from nanoseconds to milliseconds
        proposer: proposal.proposer,
        votesFor: Number(proposal.votes_for),
        votesAgainst: Number(proposal.votes_against),
        totalVotes: Number(proposal.total_votes),
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
  if (votes === undefined || votes === null || isNaN(votes)) {
    return '0';
  }
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
        totalCanisters: Number(totalCanisters),
        totalProposals: Number(totalProposals),
        activeProposals: Number(activeProposals),
      };
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}; 