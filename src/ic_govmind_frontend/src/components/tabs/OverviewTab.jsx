import React from 'react';
import { Building2, Users, FileText, Coins, Globe, Settings } from 'lucide-react';

const OverviewTab = ({ 
  dao, 
  proposals, 
  proposalsLoading, 
  scaleByDecimals,
  formatDate 
}) => {
  if (!dao) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Members</p>
              <p className="text-2xl font-bold text-blue-900">{dao.members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Active Proposals</p>
              <p className="text-2xl font-bold text-green-900">
                {proposalsLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : (
                  proposals.filter(p => {
                    const status = typeof p.status === 'string' ? p.status : Object.keys(p.status)[0];
                    return status === 'Active';
                  }).length
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Coins className="text-purple-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Token Information</p>
              <p className="text-2xl font-bold text-purple-900">
                {scaleByDecimals(dao.base_token.total_supply, dao?.base_token?.decimals || 8).toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-1">Total Supply</p>
              {dao.base_token.distribution_model && dao.base_token.distribution_model.length > 0 && dao.base_token.distribution_model[0].emission_rate && dao.base_token.distribution_model[0].emission_rate.length > 0 && (
                <p className="text-sm text-purple-700 mt-2">
                  Emission Rate: {scaleByDecimals(dao.base_token.distribution_model[0].emission_rate[0], dao?.base_token?.decimals || 8).toLocaleString()} per period
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Supported Chains
          </h3>
          <div className="flex flex-wrap gap-2">
            {dao.chains.map((chain, index) => (
              <span key={`${Object.keys(chain)[0]}-${index}`} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm">
                {Object.keys(chain)[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Governance Rules
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Vote Weight:</span>
              <span className="font-medium">{dao.governance.vote_weight_type ? Object.keys(dao.governance.vote_weight_type)[0].replace(/([A-Z])/g, ' $1').trim() : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Approval Threshold:</span>
              <span className="font-medium">{Number(dao.governance.approval_threshold)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Voting Period:</span>
              <span className="font-medium">{Number(dao.governance.voting_period_secs) / 86400} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Quorum:</span>
              <span className="font-medium">{Number(dao.governance.quorum)}%</span>
            </div>
          </div>
        </div>
      </div>

      {dao.description && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
          <p className="text-slate-700 leading-relaxed">{dao.description}</p>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;