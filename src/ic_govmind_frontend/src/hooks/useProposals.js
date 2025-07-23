import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';

// Query Keys
export const QUERY_KEYS = {
  proposals: ['proposals'],
  proposal: (id) => ['proposal', id],
};

// Custom hook for fetching all proposals
export const useProposals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.proposals,
    queryFn: () => ic_govmind_proposal_analyzer.get_all_proposals(),
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });
};

// Custom hook for fetching a single proposal
export const useProposal = (proposalId) => {
  return useQuery({
    queryKey: QUERY_KEYS.proposal(proposalId),
    queryFn: async () => {
      if (!proposalId) return null;
      
      try {
        const result = await ic_govmind_proposal_analyzer.get_proposal(proposalId);
        console.log('useProposal result:', { proposalId, result });
        
        // get_proposal returns (opt Proposal) which is either a Proposal object or null/undefined
        return result || null;
      } catch (error) {
        console.error('Error fetching proposal:', error);
        return null;
      }
    },
    enabled: !!proposalId, // Only run if proposalId exists
    refetchInterval: 3000,
    staleTime: 1000,
  });
};

// Custom hook for submitting proposals
export const useSubmitProposal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ proposalId, title, description }) => 
      ic_govmind_proposal_analyzer.submit_proposal(
        proposalId ? [proposalId] : [], // Pass Some(proposalId) or None
        title, 
        description
      ),
    onSuccess: (proposalId) => {
      // Invalidate and refetch proposals list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proposals });
      
      // Pre-fetch the new proposal
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.proposal(proposalId),
        queryFn: () => ic_govmind_proposal_analyzer.get_proposal(proposalId),
      });
      
      return proposalId;
    },
    onError: (error) => {
      console.error('Error submitting proposal:', error);
    },
  });
};

// Custom hook for retrying proposal analysis
export const useRetryAnalysis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (proposalId) => 
      ic_govmind_proposal_analyzer.retry_proposal_analysis(proposalId),
    onSuccess: (_, proposalId) => {
      // Invalidate both the proposals list and specific proposal
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proposals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proposal(proposalId) });
    },
    onError: (error) => {
      console.error('Error retrying analysis:', error);
    },
  });
};

// Custom hook for checking if a proposal exists in the analyzer
export const useProposalExists = (compositeId) => {
  return useQuery({
    queryKey: ['proposalExists', compositeId],
    queryFn: async () => {
      if (!compositeId) return null;
      
      try {
        console.log('Checking if proposal exists:', compositeId);
        const result = await ic_govmind_proposal_analyzer.get_proposal(compositeId);
        console.log('useProposalExists result:', { compositeId, result });
        
        // get_proposal returns (opt Proposal) which is either a Proposal object or null/undefined
        return result || null;
      } catch (error) {
        console.error('Error checking proposal existence:', error);
        return null;
      }
    },
    enabled: !!compositeId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - proposals are never deleted
  });
};

// Helper function to get status string from enum
export const getStatusString = (status) => {
  if (typeof status === 'object' && status !== null) {
    return Object.keys(status)[0];
  }
  return status;
};

// Helper function to get status badge classes
export const getStatusBadgeClass = (status) => {
  const statusStr = getStatusString(status);
  switch (statusStr) {
    case 'Pending':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'Analyzing':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Analyzed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Failed':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to get status icons
export const getStatusIcon = (status) => {
  const statusStr = getStatusString(status);
  switch (statusStr) {
    case 'Pending':
      return '⏳';
    case 'Analyzing':
      return '🔄';
    case 'Analyzed':
      return '✅';
    case 'Failed':
      return '❌';
    default:
      return '❓';
  }
}; 