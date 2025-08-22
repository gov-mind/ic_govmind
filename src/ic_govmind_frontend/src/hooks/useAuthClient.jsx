import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { createActor as createFactoryActor } from "declarations/ic_govmind_factory";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [agent, setAgent] = useState(null);
  const [factoryActor, setFactoryActor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        setIdentity(identity);
        setPrincipal(principal.toText());

        const agent = new HttpAgent({ identity });
        setAgent(agent);

        const factory = createFactoryActor(process.env.CANISTER_ID_IC_GOVMIND_FACTORY, {
          agent,
        });
        setFactoryActor(factory);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === "local" 
          ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
          : "https://id.ai",
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();
          setIdentity(identity);
          setPrincipal(principal.toText());
          setIsAuthenticated(true);

          const agent = new HttpAgent({ identity });
          setAgent(agent);

          const factory = createFactoryActor(process.env.CANISTER_ID_IC_GOVMIND_FACTORY, {
            agent,
          });
          setFactoryActor(factory);
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  const logout = useCallback(async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      await authClient.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
      setIdentity(null);
      setAgent(null);
      setFactoryActor(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  return (
    <AuthContext.Provider value={{
      authClient,
      isAuthenticated,
      principal,
      identity,
      agent,
      factoryActor,
      isLoading,
      initAuth,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthClient = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthClient must be used within an AuthProvider");
  }
  return context;
};