import React from 'react';
import { AlertTriangle, Coins } from 'lucide-react';

export default function DistributionTab({
  dao,
  distributionRecords = [],
  distributionRecordsLoading,
  distributionRecordsError,
  scaleByDecimals,
  formatDate,
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Token Distribution Records</h3>

      {distributionRecordsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading distribution records...</p>
          </div>
        </div>
      ) : distributionRecordsError ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Distribution Records</h3>
          <p className="text-slate-600">Failed to load token distribution history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {distributionRecords && distributionRecords.length > 0 ? (
            distributionRecords.map((record_with_index) => {
              const [index, record] = record_with_index;

              const distributionType = typeof record.distribution_type === 'string'
                ? record.distribution_type
                : Object.keys(record.distribution_type)[0];

              return (
                <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        distributionType === 'Initial' ? 'bg-blue-100' :
                        distributionType === 'Emission' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <Coins className={`w-5 h-5 ${
                          distributionType === 'Initial' ? 'text-blue-600' :
                          distributionType === 'Emission' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{distributionType} Distribution</h4>
                        <p className="text-sm text-slate-500">{formatDate(record.timestamp)}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      distributionType === 'Initial' ? 'bg-blue-100 text-blue-800' :
                      distributionType === 'Emission' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {distributionType}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Recipient:</span>
                        <span className="font-mono text-sm truncate max-w-32">
                          {record.recipient.slice(0, 8)}...{record.recipient.slice(-8)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount:</span>
                        <span className="font-medium text-green-600">
                          {scaleByDecimals(record.amount, dao?.base_token?.decimals || 8).toLocaleString()} {dao.base_token.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`font-medium ${
                          record.tx_result.startsWith('Success') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.tx_result.startsWith('Success') ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Distribution Records</h3>
              <p className="text-slate-600">No token distribution history found for this DAO.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}