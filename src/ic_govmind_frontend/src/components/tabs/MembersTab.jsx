import React from 'react';
import { Wallet, Clock, Calendar } from 'lucide-react';

const MembersTab = ({
  dao,
  memberBalances,
  balancesLoading,
  scaleByDecimals,
  getMemberUnlockSchedule,
  getTotalLockedTokens,
  getAvailableTokens,
  formatDate
}) => {
  if (!dao) return null;

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Founder': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Council': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contributor': return 'bg-green-100 text-green-800 border-green-200';
      case 'Voter': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Observer': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatUnlockDate = (timestamp) => {
    try {
      if (!timestamp) return 'N/A';
      const millis = typeof timestamp === 'bigint' ? Number(timestamp) / 1_000_000 : Number(timestamp);
      const date = new Date(millis);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Safeguards for variant-like fields possibly being null/undefined
  const getRoleLabel = (roleField) => {
    if (!roleField) return 'Unknown';
    if (typeof roleField === 'string') return roleField;
    const keys = Object.keys(roleField || {});
    return keys.length ? keys[0] : 'Unknown';
  };

  const daoMembers = Array.isArray(dao.members) ? dao.members : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">DAO Members</h3>
        <span className="text-sm text-slate-500">{daoMembers.length} members</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daoMembers.map((member) => {
          const unlockSchedule = getMemberUnlockSchedule(dao, member) || [];
          const totalLocked = getTotalLockedTokens(unlockSchedule);
          const availableTokens = getAvailableTokens(unlockSchedule);
          const pendingTokens = totalLocked - availableTokens;
          const roleLabel = getRoleLabel(member?.role);
          
          return (
            <div key={member?.user_id ?? Math.random()} className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{member?.user_id ?? 'Unknown Member'}</h4>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeClass(roleLabel)}`}>{roleLabel}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        {balancesLoading ? (
                          <span className="text-xs text-slate-500">Loading...</span>
                        ) : (
                          `${memberBalances && memberBalances[member?.user_id] ? scaleByDecimals(memberBalances[member.user_id], dao?.base_token?.decimals || 8).toLocaleString() : '0'} ${dao?.base_token?.symbol || ''}`
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Current Balance</p>
                  </div>
                </div>
                
                {/* Token Vesting Information */}
                {unlockSchedule.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-slate-900 flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-blue-600" />
                        Token Vesting
                      </h5>
                      <span className="text-xs text-slate-500">{unlockSchedule.length} schedules</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 rounded p-2">
                        <p className="text-xs text-slate-500">Total Locked</p>
                        <p className="text-sm font-medium text-slate-900">{scaleByDecimals(totalLocked, dao?.base_token?.decimals || 8).toLocaleString()} {dao?.base_token?.symbol || ''}</p>
                      </div>
                      <div className="bg-slate-50 rounded p-2">
                        <p className="text-xs text-slate-500">Available</p>
                        <p className="text-sm font-medium text-green-600">{scaleByDecimals(availableTokens, dao?.base_token?.decimals || 8).toLocaleString()} {dao?.base_token?.symbol || ''}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {unlockSchedule.map((schedule, idx) => {
                        const amountScaled = scaleByDecimals(schedule.amount, dao?.base_token?.decimals || 8);
                        
                        return (
                          <div key={idx} className="border border-slate-200 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{amountScaled.toLocaleString()} {dao?.base_token?.symbol || ''}</span>
                              <span className="text-xs text-slate-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                At ${formatUnlockDate(schedule.timestamp)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembersTab;