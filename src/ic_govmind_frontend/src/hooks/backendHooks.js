import { useQuery, useMutation } from '@tanstack/react-query';

// Backend actor specific hooks (DAO canister interactions)

// Fetch active committees from the backend DAO canister
export const useActiveCommittees = (backendActor) => {
  return useQuery({
    queryKey: ['backend', 'committees', backendActor?.canisterId || 'unknown'],
    queryFn: async () => {
      if (!backendActor) return [];
      try {
        const result = await backendActor.get_active_committees();
        if (Array.isArray(result)) {
          return result;
        }
        console.error('Invalid committees response from backend');
        return [];
      } catch (error) {
        console.error('Error fetching active committees:', error);
        return [];
      }
    },
    enabled: !!backendActor,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

// Create a proposal on the backend DAO canister
export const useCreateProposal = (backendActor) => {
  return useMutation({
    mutationFn: async ({ title, description, committeeId, committeeIds }) => {
      if (!backendActor) throw new Error('Backend actor is not available');
      const ids = Array.isArray(committeeIds)
        ? committeeIds
        : (committeeId ? [parseInt(committeeId, 10)] : []);

      const res = await backendActor.create_proposal(
        title,
        description,
        ids,
      );

      if (res && res.Ok !== undefined) {
        return res.Ok; // proposalId
      }
      throw new Error(res?.Err || 'Failed to create proposal');
    },
    onError: (error) => {
      console.error('Error creating proposal:', error);
    },
  });
};