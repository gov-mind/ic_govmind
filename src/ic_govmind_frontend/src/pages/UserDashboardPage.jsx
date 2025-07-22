import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Users,
  FileText,
  Globe,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSnsCanisters } from '../hooks/useSnsGovernance';
import { useMyDao } from '../hooks/useMyDao';
import { useAuthClient } from '../hooks/useAuthClient';

function UserDashboardPage() {
  const navigate = useNavigate();
  const { principal, factoryActor } = useAuthClient();
  // Mock user principal
  const [myDaos, setMyDaos] = useState([]); // Still mock for now

  // SNS DAOs pagination state
  const [snsPage, setSnsPage] = useState(1);
  const snsPageSize = 10;
  const {
    data: snsData = { canisters: [], paginationInfo: {} },
    isLoading: snsLoading,
    error: snsError
  } = useSnsCanisters(snsPage, snsPageSize);
  const snsDaos = snsData.canisters || [];
  const paginationInfo = snsData.paginationInfo || {};
  const currentPage = paginationInfo.current_page || snsPage;
  const totalPages = paginationInfo.total_pages || 1;
  const hasPrevPage = !!paginationInfo.has_prev_page;
  const hasNextPage = !!paginationInfo.has_next_page;

  // Debug: Log the principal used in the dashboard
  console.log('Dashboard principal:', principal);
  const { data: myDao, isLoading: myDaoLoading, error: myDaoError } = useMyDao(principal, factoryActor);

  // For demo, keep myDaos as mock
  useEffect(() => {
    setTimeout(() => {
      setMyDaos([
        {
          id: 'dao-1',
          name: 'AI Governance DAO',
          icon_url: '',
          members: 12,
          proposals: 5,
          description: 'A DAO for AI-powered governance.'
        }
      ]);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-blue-500" /> Welcome!
            </h2>
            <p className="text-slate-600 text-lg">Your personal dashboard for DAOs and SNS governance.</p>
          </div>
        </div>

        {/* My DAOs Section (now uses real data) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> My DAO
            </h3>
            {!myDao && (
              <Link to="/create-dao" className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                <Plus className="w-4 h-4" /> <span>Create DAO</span>
              </Link>
            )}
          </div>
          {myDaoLoading ? (
            <div className="flex items-center space-x-2 text-slate-500 py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading your DAO...</span>
            </div>
          ) : !myDao ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-2">You have not created a DAO yet.</p>
              <Link to="/create-dao" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium inline-flex items-center space-x-2">
                <Plus className="w-4 h-4" /> <span>Create your DAO</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {myDao.icon_url && ((Array.isArray(myDao.icon_url) ? myDao.icon_url[0] : myDao.icon_url)) ? (
                      <img src={Array.isArray(myDao.icon_url) ? myDao.icon_url[0] : myDao.icon_url} alt={myDao.name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="text-blue-600 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{myDao.name}</h4>
                    <p className="text-xs text-slate-500">{myDao.members?.length || 0} members • {myDao.proposals?.length || 0} proposals</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{myDao.description}</p>
                <Link to={`/dao/${myDao.id}`} className="mt-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4" /> <span>Enter DAO</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* SNS DAOs Explorer - now uses real data and pagination */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-600" /> SNS DAOs Explorer
            </h3>
          </div>
          {snsLoading ? (
            <div className="flex items-center space-x-2 text-slate-500 py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading SNS DAOs...</span>
            </div>
          ) : snsError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-700 mb-2">Failed to load SNS DAOs.</p>
              <p className="text-slate-600 text-sm">{snsError.message}</p>
            </div>
          ) : snsDaos.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-2">No SNS DAOs found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {snsDaos.map(dao => (
                  <div key={dao.canisterId} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-cyan-100 flex-shrink-0">
                        {dao.logo ? (
                          <img
                            src={dao.logo}
                            alt={dao.name}
                            className="w-full h-full object-contain block"
                            style={{ background: '#f0f4f8' }}
                          />
                        ) : (
                          <Globe className="text-cyan-600 w-6 h-6" />
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 truncate">{dao.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{dao.description}</p>
                    <div className="flex items-center text-xs text-slate-500 mb-2 gap-2">
                      <Users className="w-4 h-4" />
                      <span>{dao.totalProposals} proposals</span>
                      <span>•</span>
                      <Activity className="w-4 h-4" />
                      <span>{dao.activeProposals} active</span>
                    </div>
                    <Link to={`/sns/${dao.canisterId}`} className="mt-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 font-medium flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4" /> <span>Enter DAO</span>
                    </Link>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setSnsPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevPage || snsLoading}
                  className={`flex items-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setSnsPage((p) => p + 1)}
                  disabled={!hasNextPage || snsLoading}
                  className={`flex items-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity (optional, placeholder) */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Recent Activity
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Coming soon: Your recent proposals, votes, and DAO events will appear here.
          </div>
        </div>
      </section>
    </div>
  );
}

export default UserDashboardPage; 