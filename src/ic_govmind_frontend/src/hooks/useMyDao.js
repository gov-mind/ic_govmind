import { useQuery } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';

export const useMyDao = (principal, factoryActor) => {
  // Debug: Log the principal and factoryActor used for fetching DAO
  if (!factoryActor) {
    console.log('useMyDao: factoryActor is missing');
  }
  return useQuery({
    queryKey: ['my-dao', principal],
    queryFn: async () => {
      if (!principal || !factoryActor) return null;
      const principalObj = Principal.fromText(principal);
      const result = await factoryActor.get_dao_info(principalObj);
      
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!principal && !!factoryActor,
    staleTime: 30000,
  });
}; 