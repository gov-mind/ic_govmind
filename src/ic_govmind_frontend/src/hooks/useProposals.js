import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';
import { getAIAnalysis, submitProposalAndAnalyze } from '../services/aiService';

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

// Custom hook for submitting proposals with AI analysis
export const useSubmitProposal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ proposalId, title, description }) => {
      console.log('🔍 DEBUG: useSubmitProposal mutationFn called with:', { proposalId, title, description });
      // Use the new combined submit and analyze function
      const result = await submitProposalAndAnalyze(title, description, proposalId);
      console.log('🔍 DEBUG: submitProposalAndAnalyze result:', result);
      if (result.success) {
        return result.proposalId;
      } else {
        throw new Error(result.error);
      }
    },
    onMutate: (variables) => {
      console.log('🔍 DEBUG: useSubmitProposal onMutate called with:', variables);
    },
    onSuccess: (proposalId) => {
      console.log('🔍 DEBUG: useSubmitProposal onSuccess called with proposalId:', proposalId);
      // Invalidate and refetch proposals list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proposals });
      
      // Invalidate proposalExists queries so they refetch when switching proposals
      queryClient.invalidateQueries({ queryKey: ['proposalExists'] });
      
      // Pre-fetch the new proposal
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.proposal(proposalId),
        queryFn: () => ic_govmind_proposal_analyzer.get_proposal(proposalId),
      });
      
      return proposalId;
    },
    onError: (error) => {
      console.error('🔍 DEBUG: useSubmitProposal onError called with:', error);
    },
    onSettled: (data, error, variables, context) => {
      console.log('🔍 DEBUG: useSubmitProposal onSettled called with:', { data, error, variables, context });
    }
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
    staleTime: 5000, // 5 seconds - allow refetching when proposals are submitted
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

// Unified hook for proposal analysis (both initial and retry)
export const useProposalAnalysis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ proposalId, isRetry = false }) => {
      try {
        // Use the simplified analyze_proposal function that only needs proposal_id
        const result = await getAIAnalysis(proposalId);
        
        if (result.success) {
          console.log(`${isRetry ? 'Retry' : 'Initial'} AI analysis completed:`, result.data);
          return result.data;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`${isRetry ? 'Retry' : 'Initial'} analysis failed:`, error.message);
        throw error; // Re-throw original error
      }
    },
    onSuccess: () => {
      // Invalidate and refetch proposals
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proposals });
      // Invalidate proposalExists queries so they refetch when switching proposals
      queryClient.invalidateQueries({ queryKey: ['proposalExists'] });
    },
    onError: (error) => {
      console.error('Error in proposal analysis:', error);
    },
  });
};