import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useQueryClient } from '@tanstack/react-query';

// Default responsibilities per committee type
const DEFAULT_RESPONSIBILITIES = {
  Technical: [
    'Reviews technical proposals and smart contracts.',
    'Oversees protocol upgrades, integrations, and audits.',
    'Handles urgent fixes (e.g., security vulnerabilities).',
  ],
  Democracy: [
    'Manages voting systems, rules, and procedures.',
    'Screens proposals (to avoid spam or low-effort submissions).',
    'Works on fairness and voter participation strategies.',
  ],
  Treasury: [
    'Manages DAO funds and budgeting.',
    'Reviews grant proposals and spending requests.',
    'Ensures financial transparency and reporting.',
  ],
  Grants: [
    'Allocates funds to builders, researchers, and community projects.',
    'Runs grant programs, bounties, or hackathons.',
    'Monitors grantee progress and accountability.',
  ],
  Community: [
    'Onboards new members, manages roles and permissions.',
    'Builds engagement and runs educational initiatives.',
    'Handles disputes or moderation in community spaces.',
  ],
  Marketing: [
    'Manages branding, social media, and PR.',
    'Ensures the DAO’s story and values are clear.',
    'Coordinates outreach campaigns, partnerships, and events.',
  ],
  Legal: [
    'Keeps track of regulations and DAO’s legal risks.',
    'Interfaces with legal entities (foundations, service providers).',
    'Drafts policies around KYC, jurisdiction, and liability.',
  ],
  Strategy: [
    'Sets long-term priorities and KPIs.',
    'Aligns proposals with DAO’s vision.',
    'Acts as a steering body for overall direction.',
  ],
  Dispute: [
    'Handles conflicts between members.',
    'Decides on enforcement of rules and penalties.',
    'Acts like a “DAO court” for proposal challenges when needed.',
  ],
  Research: [
    'Explores new ideas, experiments, and partnerships.',
    'Runs pilot projects and evaluates cutting-edge tech.',
    'Provides research to inform governance proposals.',
  ],
  Security: [
    'Monitors smart contract risks, audits, and bug bounties.',
    'Oversees treasury risk management (diversification, custody).',
    'Creates contingency plans for exploits or governance attacks.',
  ],
  Operations: [
    'Coordinates day-to-day logistics.',
    'Handles DAO tooling, treasury ops, documentation.',
    'Keeps workflows and decision-making efficient.',
  ],
};

function getDefaultResponsibilities(type) {
  const list = DEFAULT_RESPONSIBILITIES[type] || [];
  return list.join('\n');
}

export default function CommitteesTab({
  dao,
  backendDao,
  backendDaoLoading,
  backendActor,
}) {
  const queryClient = useQueryClient();

  // Committees state
  const [newCommitteeType, setNewCommitteeType] = useState('Technical');
  const [newCommitteeTermDays, setNewCommitteeTermDays] = useState('90');
  const [newCommitteeMembers, setNewCommitteeMembers] = useState('');
  const [newCommitteeActive, setNewCommitteeActive] = useState(true);
  const [newCommitteeResponsibilities, setNewCommitteeResponsibilities] = useState(getDefaultResponsibilities('Technical'));
  const [updatingCommitteeId, setUpdatingCommitteeId] = useState(null);
  const [updateCommitteeTermDays, setUpdateCommitteeTermDays] = useState('90');
  const [updateCommitteeMembers, setUpdateCommitteeMembers] = useState('');
  const [updateCommitteeActive, setUpdateCommitteeActive] = useState(true);
  const [updateCommitteeResponsibilities, setUpdateCommitteeResponsibilities] = useState('');
  const [isSubmittingCommittee, setIsSubmittingCommittee] = useState(false);

  const parseMembers = (text) => {
    return text
      .split(/\n|,/) // split by newline or comma
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        try { return Principal.fromText(s); } catch { return null; }
      })
      .filter(Boolean);
  };

  const committeeTypeToVariant = (t) => {
    switch (t) {
      case 'Technical': return { Technical: null };
      case 'Democracy': return { Democracy: null };
      case 'Treasury': return { Treasury: null };
      case 'Grants': return { Grants: null };
      case 'Community': return { Community: null };
      case 'Marketing': return { Marketing: null };
      case 'Legal': return { Legal: null };
      case 'Strategy': return { Strategy: null };
      case 'Dispute': return { Dispute: null };
      case 'Research': return { Research: null };
      case 'Security': return { Security: null };
      case 'Operations': return { Operations: null };
      default: return { Technical: null };
    }
  };

  const handleAddCommittee = async () => {
    if (!backendActor) return;

    setIsSubmittingCommittee(true);

    try {
      const term = BigInt(Math.max(1, parseInt(newCommitteeTermDays || '0', 10)) * 24 * 3600);
      const arg = {
        committee_type: committeeTypeToVariant(newCommitteeType),
        members: parseMembers(newCommitteeMembers),
        term_duration_secs: term,
        elected_at: [],
        next_election_at: [],
        active: [newCommitteeActive],
        responsibilities: [newCommitteeResponsibilities],
      };
      const res = await backendActor.add_committee(arg);
      if (res && res.Ok !== undefined) {
        await queryClient.invalidateQueries({ queryKey: ['backend-dao-info', dao.id] });
        setNewCommitteeMembers('');
        setNewCommitteeTermDays('90');
        setNewCommitteeActive(true);
        setNewCommitteeResponsibilities(getDefaultResponsibilities(newCommitteeType));
      } else {
        console.error('Failed to add committee:', res?.Err || res);
      }
    } catch (e) {
      console.error('Error adding committee', e);
    } finally {
      setIsSubmittingCommittee(false);
    }
  };

  const handleStartUpdateCommittee = (committee) => {
    setUpdatingCommitteeId(committee.id);
    const days = Math.max(1, Math.floor(Number(committee.term_duration_secs || 0) / 86400));
    setUpdateCommitteeTermDays(String(days));
    setUpdateCommitteeMembers((committee.members || []).map((p) => {
      try { return typeof p === 'object' && p.toText ? p.toText() : String(p); } catch { return String(p); }
    }).join('\n'));
    setUpdateCommitteeActive(committee.active === undefined ? true : Boolean(committee.active));
    if (Array.isArray(committee.responsibilities)) {
      setUpdateCommitteeResponsibilities(committee.responsibilities.join('\n'));
    } else if (typeof committee.responsibilities === 'string') {
      setUpdateCommitteeResponsibilities(committee.responsibilities);
    } else {
      setUpdateCommitteeResponsibilities('');
    }
  };

  const handleCancelUpdateCommittee = () => {
    setUpdatingCommitteeId(null);
    setUpdateCommitteeTermDays('90');
    setUpdateCommitteeMembers('');
    setUpdateCommitteeActive(true);
    setUpdateCommitteeResponsibilities('');
  };

  const handleUpdateCommittee = async () => {
    if (!backendActor || updatingCommitteeId == null) return;
    setIsSubmittingCommittee(true);
    try {
      const term = BigInt(Math.max(1, parseInt(updateCommitteeTermDays || '0', 10)) * 24 * 3600);
      const arg = {
        committee_type: { Technical: null },
        members: parseMembers(updateCommitteeMembers),
        term_duration_secs: term,
        elected_at: [],
        next_election_at: [],
        active: [updateCommitteeActive],
        responsibilities: [updateCommitteeResponsibilities],
      };
      const res = await backendActor.update_committee_update(updatingCommitteeId, arg);
      if (res && res.Ok !== undefined) {
        await queryClient.invalidateQueries({ queryKey: ['backend-dao-info', dao.id] });
        handleCancelUpdateCommittee();
      } else {
        console.error('Failed to update committee:', res?.Err || res);
      }
    } catch (e) {
      console.error('Error updating committee', e);
    } finally {
      setIsSubmittingCommittee(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Committees</h3>

      {/* Create Committee */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h4 className="text-md font-semibold text-slate-900 mb-4">Create New Committee</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              value={newCommitteeType}
              onChange={(e) => {
                const val = e.target.value;
                setNewCommitteeType(val);
                setNewCommitteeResponsibilities(getDefaultResponsibilities(val));
              }}
              disabled={isSubmittingCommittee}
            >
              <option value="Technical">Technical</option>
              <option value="Democracy">Democracy</option>
              <option value="Treasury">Treasury</option>
              <option value="Grants">Grants</option>
              <option value="Community">Community</option>
              <option value="Marketing">Marketing</option>
              <option value="Legal">Legal</option>
              <option value="Strategy">Strategy</option>
              <option value="Dispute">Dispute Resolution</option>
              <option value="Research">Research & Innovation</option>
              <option value="Security">Security & Risk</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Term (days)</label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              value={newCommitteeTermDays}
              onChange={(e) => setNewCommitteeTermDays(e.target.value)}
              disabled={isSubmittingCommittee}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Members (Principals, one per line)</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg h-24"
              placeholder="aaaa-bbbb-cccc-dddd-eeee-ffff-gggg-hhhh-iiii-jjjj-kkk"
              value={newCommitteeMembers}
              onChange={(e) => setNewCommitteeMembers(e.target.value)}
              disabled={isSubmittingCommittee}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="new-committee-active"
              type="checkbox"
              className="w-4 h-4"
              checked={newCommitteeActive}
              onChange={(e) => setNewCommitteeActive(e.target.checked)}
              disabled={isSubmittingCommittee}
            />
            <label htmlFor="new-committee-active" className="text-sm font-medium text-slate-700">Active</label>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsibilities (one per line)</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg h-28"
              value={newCommitteeResponsibilities}
              onChange={(e) => setNewCommitteeResponsibilities(e.target.value)}
              disabled={isSubmittingCommittee}
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAddCommittee}
            disabled={isSubmittingCommittee}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmittingCommittee ? 'Creating...' : 'Create Committee'}
          </button>
        </div>
      </div>

      {/* Existing Committees */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h4 className="text-md font-semibold text-slate-900 mb-4">Existing Committees</h4>
        {backendDaoLoading ? (
          <div className="text-slate-500 text-sm">Loading committees...</div>
        ) : (backendDao?.committees && backendDao.committees.length > 0) ? (
          <div className="space-y-4">
            {backendDao.committees.map((c) => (
              <div key={c.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{Object.keys(c.committee_type)[0]} Committee #{c.id}</div>
                    <div className="text-sm text-slate-600">Term: {Number(c.term_duration_secs) / 86400} days • Members: {c.members?.length || 0} • Status: {c.active === false ? 'Inactive' : 'Active'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/dao/${dao.id}/committees/${c.id}`} className="px-3 py-2 rounded-md border text-slate-700 hover:bg-slate-50">View</Link>
                    {updatingCommitteeId === c.id ? (
                      <button onClick={handleCancelUpdateCommittee} className="px-3 py-2 rounded-md border text-slate-700 hover:bg-slate-50">Cancel</button>
                    ) : (
                      <button onClick={() => handleStartUpdateCommittee(c)} className="px-3 py-2 rounded-md border text-slate-700 hover:bg-slate-50">Manage</button>
                    )}
                  </div>
                </div>
                {updatingCommitteeId === c.id && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Term (days)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        value={updateCommitteeTermDays}
                        onChange={(e) => setUpdateCommitteeTermDays(e.target.value)}
                        disabled={isSubmittingCommittee}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Members (Principals, one per line)</label>
                      <textarea
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg h-24"
                        value={updateCommitteeMembers}
                        onChange={(e) => setUpdateCommitteeMembers(e.target.value)}
                        disabled={isSubmittingCommittee}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`update-committee-active-${c.id}`}
                        type="checkbox"
                        className="w-4 h-4"
                        checked={updateCommitteeActive}
                        onChange={(e) => setUpdateCommitteeActive(e.target.checked)}
                        disabled={isSubmittingCommittee}
                      />
                      <label htmlFor={`update-committee-active-${c.id}`} className="text-sm font-medium text-slate-700">Active</label>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Responsibilities (one per line)</label>
                      <textarea
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg h-28"
                        value={updateCommitteeResponsibilities}
                        onChange={(e) => setUpdateCommitteeResponsibilities(e.target.value)}
                        disabled={isSubmittingCommittee}
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2">
                      <button
                        onClick={handleUpdateCommittee}
                        disabled={isSubmittingCommittee}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSubmittingCommittee ? 'Saving...' : 'Save Changes'}
                      </button>
                      <span className="text-xs text-slate-500">Elections timestamps are managed automatically by backend.</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm">No committees yet. Create one above.</div>
        )}
      </div>
    </div>
  );
}