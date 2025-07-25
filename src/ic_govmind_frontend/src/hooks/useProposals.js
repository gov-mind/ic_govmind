import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';
import { getAIAnalysis, getMockAnalysis } from '../services/aiService';

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
    mutationFn: async ({ proposalId, title, description, useAI = true, aiProvider = 'deepseek' }) => {
      let analysis = null;
      let status = { Pending: null }; // Default status
      
      if (useAI) {
        try {
          // First, set status to Analyzing
          const analyzingResult = await ic_govmind_proposal_analyzer.update_analysis(
            proposalId,
            [], // No analysis yet
            { Analyzing: null },
            [] // No signature yet - will be added when implementing backend signing
          );
          
          if (analyzingResult.Err) {
            throw new Error(analyzingResult.Err);
          }

          // Try to get AI analysis
          analysis = await getAIAnalysis(title, description);
          console.log('AI analysis completed:', analysis);
          status = { Analyzed: null };
        } catch (error) {
          console.warn('AI analysis failed:', error.message);
          // Submit with failed status - no analysis
          status = { Failed: null };
          analysis = null;
        }
      } else {
        // If useAI is false, submit with pending status and no analysis
        analysis = null;
        status = { Pending: null };
      }
      
      // Submit proposal with optional analysis and status
      // TODO: Add signature from API proxy when implementing backend signing
      return ic_govmind_proposal_analyzer.submit_proposal_with_analysis(
        proposalId ? [proposalId] : [],
        title,
        description,
        analysis ? [analysis] : [], // Convert to Option type for Candid
        status,
        [] // No signature yet - will be added when implementing backend signing
      );
    },
    onSuccess: (proposalId) => {
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
      console.error('Error submitting proposal:', error);
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
    mutationFn: async ({ proposalId, title, description, isRetry = false }) => {
      try {
        // First, set status to Analyzing
        const analyzingResult = await ic_govmind_proposal_analyzer.update_analysis(
          proposalId,
          [], // No analysis yet
          { Analyzing: null },
          [] // No signature yet - will be added when implementing backend signing
        );
        
        if (analyzingResult.Err) {
          throw new Error(analyzingResult.Err);
        }
        
        // Try to get AI analysis
        const analysis = await getAIAnalysis(title, description);
        console.log(`${isRetry ? 'Retry' : 'Initial'} AI analysis completed:`, analysis);
        
        // Update the proposal with new analysis
        // TODO: Add signature from API proxy when implementing backend signing
        const result = await ic_govmind_proposal_analyzer.update_analysis(
          proposalId,
          analysis ? [analysis] : [], // Convert to Option type for Candid
          { Analyzed: null },
          [] // No signature yet - will be added when implementing backend signing
        );
        
        if (result.Err) {
          throw new Error(result.Err);
        }
        
        return result.Ok;
      } catch (error) {
        console.error(`${isRetry ? 'Retry' : 'Initial'} analysis failed:`, error.message);
        
        // Update status to failed with no analysis
        const failResult = await ic_govmind_proposal_analyzer.update_analysis(
          proposalId,
          [], // No analysis - empty Option
          { Failed: null },
          [] // No signature yet - will be added when implementing backend signing
        );
        
        if (failResult.Err) {
          throw new Error(failResult.Err);
        }
        
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