import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import HomePage from './pages/HomePage';
import ProposalsPage from './pages/ProposalsPage';
import ProposalListPage from './pages/ProposalListPage';
import CreateDaoPage from './pages/CreateDaoPage';
import DaoInfoPage from './pages/DaoInfoPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AppEntryPage from './pages/AppEntryPage';
import './App.css';
import { AuthProvider, useAuthClient } from './hooks/useAuthClient';
import { LogOut } from 'lucide-react';
import AppHeader from './components/AppHeader';
import CommitteeDashboardPage from './pages/CommitteeDashboardPage';
import ProposalCopilotPage from './pages/ProposalCopilotPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuthClient();
  const location = useLocation();
  if (isLoading) return null;
  if (!isAuthenticated && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<AppEntryPage />} />
            <Route path="/dashboard" element={<RequireAuth><AppLayout><UserDashboardPage /></AppLayout></RequireAuth>} />
            <Route path="/proposals" element={<RequireAuth><AppLayout><ProposalsPage /></AppLayout></RequireAuth>} />
            <Route path="/create-dao" element={<RequireAuth><AppLayout><CreateDaoPage /></AppLayout></RequireAuth>} />
            <Route path="/dao/:daoId" element={<RequireAuth><AppLayout><DaoInfoPage /></AppLayout></RequireAuth>} />
            <Route path="/dao/:daoId/copilot" element={<RequireAuth><AppLayout><ProposalCopilotPage /></AppLayout></RequireAuth>} />
            <Route path="/dao/:daoId/committees/:committeeId" element={<RequireAuth><AppLayout><CommitteeDashboardPage /></AppLayout></RequireAuth>} />
            <Route path="/sns/:canisterId" element={<RequireAuth><AppLayout><ProposalListPage /></AppLayout></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
