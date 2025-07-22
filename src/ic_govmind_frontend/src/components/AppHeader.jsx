import { Link, useNavigate } from 'react-router-dom';
import { useAuthClient } from '../hooks/useAuthClient';
import { LogOut } from 'lucide-react';

export default function AppHeader() {
  const { isAuthenticated, principal, logout } = useAuthClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Simple blockie: colored circle with principal short
  const color = `hsl(${parseInt(principal?.slice(2, 6) || '0', 36) % 360},70%,60%)`;
  const short = principal ? principal.slice(0, 4) + '...' + principal.slice(-4) : '';

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/dashboard" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="GovMind Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">GovMind</h1>
              <p className="text-sm text-slate-600">AI Mind for DAO</p>
            </div>
          </Link>

          {/* User Section */}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                  style={{ background: color }} 
                  title={principal}
                >
                  {short}
                </div>
                <span className="hidden sm:inline text-sm text-slate-600">{short}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-lg shadow-sm hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 