import React from 'react';
import { Users, FileText, Coins, Wallet, Settings, Hash, BarChart3, Shield } from 'lucide-react';

export default function DaoTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'distribution', label: 'Distribution', icon: Coins },
    { id: 'treasury', label: 'Treasury', icon: Wallet },
    { id: 'governance', label: 'Governance', icon: Settings },
    { id: 'committees', label: 'Committees', icon: Shield },
    { id: 'canister', label: 'Canister', icon: Hash },
  ];

  return (
    <nav className="flex space-x-8 px-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}