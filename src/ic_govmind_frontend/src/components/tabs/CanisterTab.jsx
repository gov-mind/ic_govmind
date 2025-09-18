import React, { useEffect, useState } from 'react';
import { useAuthClient } from '../../hooks/useAuthClient';

import {
  Building2,
  Users,
  Coins,
  Globe,
  Settings,
  ArrowLeft,
  Plus,
  FileText,
  BarChart3,
  X,
  AlertTriangle,
  Wallet,
  Hash,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Calendar,
  Brain
} from 'lucide-react';

export default function CanisterTab({ dao }) {
  const { factoryActor } = useAuthClient();
  const [copied, setCopied] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState(null); // 'success', 'error', or null

  // Handle copy to clipboard with feedback
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle DAO upgrade
  const handleUpgrade = async () => {
    if (!factoryActor) {
      console.error('Factory actor not available');
      return;
    }

    setIsUpgrading(true);
    setUpgradeStatus(null);

    try {
      const result = await factoryActor.upgrade_gov_dao();
      console.log(result);

      if (result && result.Ok !== undefined) {
        setUpgradeStatus('success');
        console.log('DAO upgraded successfully');
        setTimeout(() => setUpgradeStatus(null), 3000); // Reset after 3 seconds
      } else {
        setUpgradeStatus('error');
        console.error('Upgrade failed:', result?.Err || 'Unknown error');
        setTimeout(() => setUpgradeStatus(null), 5000); // Reset after 5 seconds
      }
    } catch (err) {
      setUpgradeStatus('error');
      console.error('Failed to upgrade DAO:', err);
      setTimeout(() => setUpgradeStatus(null), 5000); // Reset after 5 seconds
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Canister Information</h3>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Hash className="w-5 h-5 mr-2" />
          Canister ID
        </h4>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="mb-2 md:mb-0">
              <p className="font-medium text-slate-900">Principal ID</p>
              <p className="text-sm text-slate-600">Unique identifier for this DAO canister</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-blue-600 bg-white px-3 py-1 rounded-md border">
                {dao.id}
              </span>
              <button
                onClick={() => handleCopy(dao.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 ${copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-blue-600 hover:bg-blue-100 border border-transparent'
                  }`}
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200 ${upgradeStatus === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : upgradeStatus === 'error'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : isUpgrading
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                        : 'text-purple-600 hover:bg-purple-100 border border-transparent'
                  }`}
                title={
                  upgradeStatus === 'success'
                    ? "Upgraded successfully!"
                    : upgradeStatus === 'error'
                      ? "Upgrade failed"
                      : isUpgrading
                        ? "Upgrading..."
                        : "Upgrade DAO canister"
                }
              >
                {upgradeStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Upgraded!</span>
                  </>
                ) : upgradeStatus === 'error' ? (
                  <>
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Failed</span>
                  </>
                ) : isUpgrading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Upgrading...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Upgrade</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Network</p>
                <p className="text-sm text-slate-600">Internet Computer</p>
              </div>
              <span className="font-medium text-green-600 mt-2 block">IC Mainnet</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Canister Type</p>
                <p className="text-sm text-slate-600">DAO governance canister</p>
              </div>
              <span className="font-medium text-purple-600 mt-2 block">Governance</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Important</p>
                <p className="text-sm text-amber-700 mt-1">
                  This canister ID is used to identify and interact with your DAO on the Internet Computer network.
                  Keep it safe and use it when connecting external applications or tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}