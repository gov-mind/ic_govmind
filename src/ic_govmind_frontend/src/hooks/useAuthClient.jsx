import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { createActor as createFactoryActor } from "declarations/ic_govmind_factory";

// Debug environment variables
console.log('Process.env variables:', {
  CANISTER_ID_INTERNET_IDENTITY: process.env.CANISTER_ID_INTERNET_IDENTITY,
  CANISTER_ID_IC_GOVMIND_FACTORY: process.env.CANISTER_ID_IC_GOVMIND_FACTORY,
  DFX_NETWORK: process.env.DFX_NETWORK
});
console.log('Import.meta.env variables:', {
  CANISTER_ID_INTERNET_IDENTITY: import.meta.env.CANISTER_ID_INTERNET_IDENTITY,
  CANISTER_ID_IC_GOVMIND_FACTORY: import.meta.env.CANISTER_ID_IC_GOVMIND_FACTORY,
  DFX_NETWORK: import.meta.env.DFX_NETWORK
});
console.log('All import.meta.env:', import.meta.env);

const II_LOCAL_URL = `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;
const II_URL = process.env.DFX_NETWORK == 'local' ? II_LOCAL_URL: (process.env.DFX_NETWORK == 'ic' ? 'https://identity.ic0.app' : II_LOCAL_URL);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [factoryActor, setFactoryActor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
        const agent = new HttpAgent({ identity });
        setAgent(agent);
        
        setFactoryActor(createFactoryActor(process.env.CANISTER_ID_IC_GOVMIND_FACTORY, { agent }));
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(() => {
    if (!authClient) return;

    authClient.login({
      identityProvider: II_URL,
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
        setIsAuthenticated(true);
        const agent = new HttpAgent({ identity });
        setAgent(agent);
        
        setFactoryActor(createFactoryActor(process.env.CANISTER_ID_IC_GOVMIND_FACTORY, { agent }));
      },
    });
  }, [authClient]);

  const logout = useCallback(async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
    setFactoryActor(null);
    setAgent(null);
  }, [authClient]);

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, principal, loading });
  }, [isAuthenticated, principal, loading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, principal, login, logout, factoryActor, loading, agent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthClient() {
  return useContext(AuthContext);
}