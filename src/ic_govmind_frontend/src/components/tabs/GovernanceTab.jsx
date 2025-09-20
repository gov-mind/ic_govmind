import React from 'react';

export default function GovernanceTab({ dao, backendDao, scaleByDecimals }) {
  const source = backendDao || dao;
  console.log(source);
  const voteType = dao.governance.vote_weight_type ? Object.keys(dao.governance.vote_weight_type)[0].replace(/([A-Z])/g, ' $1').trim() : ''

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Voting Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Voting Weight Type</span>
            <span className="font-medium">{voteType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Quorum</span>
            <span className="font-medium">{Number(source.governance.quorum)} %</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Pass Threshold</span>
            <span className="font-medium">{Number(source.governance.approval_threshold)} %</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Voting Period (hours)</span>
            <span className="font-medium">{Number(source.governance.voting_period_secs) / 86400}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Token Symbol</span>
            <span className="font-medium">{source?.base_token?.symbol || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Decimals</span>
            <span className="font-medium">{source?.base_token?.decimals ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Supply</span>
            <span className="font-medium">{scaleByDecimals(Number(source?.base_token?.total_supply), source?.base_token?.decimals || 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Emission Rate</span>
            <span className="font-medium">{scaleByDecimals(Number(source?.base_token?.distribution_model[0]?.emission_rate), source?.base_token?.decimals || 8)} per period</span>
          </div>
        </div>
      </div>
    </div>
  );
}