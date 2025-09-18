import React from 'react';

export default function CanisterTab({ dao, networkInfo }) {
  const principal = dao?.canister_id || networkInfo?.principal_id || '—';
  const subnet = networkInfo?.subnet || '—';
  const network = networkInfo?.network || '—';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Canister Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Canister Principal</span>
            <span className="font-mono">{principal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Network</span>
            <span className="font-medium">{network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Subnet</span>
            <span className="font-medium">{subnet}</span>
          </div>
        </div>
      </div>
    </div>
  );
}