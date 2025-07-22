import { useEffect } from 'react';
import { useAuthClient } from '../hooks/useAuthClient';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';

export default function AppEntryPage() {
  const { isAuthenticated, login, loading } = useAuthClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="bg-white/90 shadow-xl rounded-2xl p-10 flex flex-col items-center max-w-md w-full border border-slate-200">
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 rounded-full p-4 mb-6">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to GovMind</h2>
        <p className="text-slate-600 mb-6 text-center">Sign in with Internet Identity to access your dashboard, manage DAOs, and explore Web3 governance tools.</p>
        <button
          onClick={login}
          className="w-full bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Rocket className="w-5 h-5" />
          <span>Login with Internet Identity</span>
        </button>
      </div>
    </div>
  );
} 