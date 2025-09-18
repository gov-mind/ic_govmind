import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Users, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { useDaoInfo, useBackendDaoInfo } from '../hooks/daoHooks';

export default function CommitteeDashboardPage() {
  const { daoId, committeeId } = useParams();

  // Reuse project hooks to fetch DAO and backend data
  const { data: dao, isLoading: daoLoading, error: daoError } = useDaoInfo();
  const { data: backendDao, isLoading: backendDaoLoading, error: backendDaoError } = useBackendDaoInfo(dao);

  const committee = useMemo(() => {
    if (!backendDao || !backendDao.committees) return null;
    try {
      const idNum = Number(committeeId);
      return backendDao.committees.find((c) => Number(c.id) === idNum) || null;
    } catch {
      return null;
    }
  }, [backendDao, committeeId]);

  const isLoading = daoLoading || backendDaoLoading;
  const hasError = daoError || backendDaoError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading committee...</p>
        </div>
      </div>
    );
  }

  if (hasError || !dao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Committee</h2>
          <p className="text-slate-600 mb-4">Failed to fetch committee information.</p>
          <Link to={`/dao/${daoId}`} className="text-blue-600 hover:text-blue-800 transition-colors">
            Back to DAO
          </Link>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Committee Not Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find the committee with ID {committeeId}.</p>
          <Link to={`/dao/${daoId}`} className="text-blue-600 hover:text-blue-800 transition-colors">
            Back to DAO
          </Link>
        </div>
      </div>
    );
  }

  const committeeType = Object.keys(committee.committee_type || { Technical: null })[0];
  const termDays = Math.max(1, Math.floor(Number(committee.term_duration_secs || 0) / 86400));
  const electedAt = (committee.elected_at && committee.elected_at.length > 0) ? Number(committee.elected_at[0]) : null;
  const nextElectionAt = (committee.next_election_at && committee.next_election_at.length > 0) ? Number(committee.next_election_at[0]) : null;

  const formatDate = (msOrNs) => {
    if (!msOrNs) return 'N/A';
    // backend appears to use milliseconds for dao.created_at, but be defensive
    const ms = msOrNs > 1e15 ? Math.floor(Number(msOrNs) / 1e6) : Number(msOrNs);
    return new Date(ms).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/dao/${daoId}`} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to DAO</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{committeeType} Committee #{String(committee.id)}</h1>
                <p className="text-xs text-slate-400">In DAO {dao?.name} (Canister {dao?.id})</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 mb-1"><Clock className="w-4 h-4" /><span className="text-sm">Term Duration</span></div>
              <div className="text-lg font-semibold text-slate-900">{termDays} days</div>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 mb-1"><Calendar className="w-4 h-4" /><span className="text-sm">Elected At</span></div>
              <div className="text-lg font-semibold text-slate-900">{electedAt ? formatDate(electedAt) : 'N/A'}</div>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 mb-1"><Calendar className="w-4 h-4" /><span className="text-sm">Next Election</span></div>
              <div className="text-lg font-semibold text-slate-900">{nextElectionAt ? formatDate(nextElectionAt) : 'N/A'}</div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5" /> Members</h2>
            {(!committee.members || committee.members.length === 0) ? (
              <div className="text-slate-500 text-sm mt-2">No members yet.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {committee.members.map((m, idx) => (
                  <li key={idx} className="p-3 border border-slate-200 rounded-md bg-slate-50 font-mono text-sm text-slate-700">
                    {typeof m === 'object' && m.toText ? m.toText() : String(m)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}