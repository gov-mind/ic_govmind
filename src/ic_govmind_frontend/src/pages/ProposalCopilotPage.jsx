import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, FileText, Send, Check, AlertTriangle, Users, Shield, X, Loader2, Brain, Sparkles, CheckCircle, RefreshCw, DollarSign, User, ChevronLeft, ChevronRight, Target, Globe, Scale, Lock, Activity, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDaoInfo, useBackendDaoInfo } from '../hooks/daoHooks';
import { useGenerateDraftWithCommittee, useGenerateDraft, useDebateSimulation, useSubmitProposal } from '../hooks/useProposals';
import { useActiveCommittees, useCreateProposal } from '../hooks/backendHooks';

// Icon name -> component mapping for debate personas
const iconMap = {
  dollarsign: DollarSign,
  shield: Shield,
  users: Users,
  lightbulb: Lightbulb,
  alerttriangle: AlertTriangle,
  brain: Brain,
  target: Target,
  globe: Globe,
  scale: Scale,
  activity: Activity,
  settings: Settings,
  lock: Lock,
  filetext: FileText,
};
const getIconComponent = (name) => {
  if (!name || typeof name !== 'string') return User;
  const key = name.toLowerCase().replace(/\s+/g, '');
  return iconMap[key] || User;
};

export default function ProposalCopilotPage() {
  const { daoId } = useParams();
  const navigate = useNavigate();

  // Load DAO and backend actor
  const { data: dao } = useDaoInfo();
  const { data: backendInfo } = useBackendDaoInfo(dao);
  const backendActor = backendInfo?.backendActor;

  // Co-pilot state
  const [copilotIdea, setCopilotIdea] = useState('');
  const [useCommitteeSuggestion, setUseCommitteeSuggestion] = useState(true);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [generatedCommitteeSuggestion, setGeneratedCommitteeSuggestion] = useState(null);
  const [draftError, setDraftError] = useState(null);

  // Submission state (independent from ProposalsTab)
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Debate Simulation State
  const [isDebateSimulationOpen, setIsDebateSimulationOpen] = useState(false);
  const [debateResults, setDebateResults] = useState(null);
  const [isRunningDebate, setIsRunningDebate] = useState(false);
  const [isDebateLoading, setIsDebateLoading] = useState(false);
  const [debateError, setDebateError] = useState('');
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState(0);
  // 3-step flow: 1) Idea -> 2) Review -> 3) Finalize
  const [currentStep, setCurrentStep] = useState(1);

  const descriptionRef = useRef(null);
  const autoResizeDescription = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [proposalContent]);

  // Stepper definition for header
  const steps = [
    { id: 1, name: 'Idea' },
    { id: 2, name: 'Review' },
    { id: 3, name: 'Finalize' },
  ];

  // Committees from backend via hook
  const { data: committeesData = [] } = useActiveCommittees(backendActor);
  const committees = committeesData;

  // Use hooks instead of direct service imports
  const generateDraftWithCommitteeMutation = useGenerateDraftWithCommittee();
  const generateDraftMutation = useGenerateDraft();
  const debateSimulationMutation = useDebateSimulation();
  const submitProposalMutation = useSubmitProposal();
  const createProposalMutation = useCreateProposal(backendActor);

  const handleGenerateAIDraft = async () => {
    if (!copilotIdea.trim()) {
      setDraftError('Please enter a proposal idea');
      return;
    }

    setIsGeneratingDraft(true);
    setDraftError(null);
    setGeneratedDraft(null);
    setGeneratedCommitteeSuggestion(null);

    try {
      if (useCommitteeSuggestion && committees.length > 0) {
        const result = await generateDraftWithCommitteeMutation.mutateAsync({
          idea: copilotIdea.trim(),
          daoCanisterId: backendActor?.canisterId || dao?.id
        });
        const csOpt = result?.committee_suggestion;
        setGeneratedDraft(result?.draft);
        setGeneratedCommitteeSuggestion(Array.isArray(csOpt) ? csOpt[0] : (csOpt || null));
        setCurrentStep(2);
       } else {
        const result = await generateDraftMutation.mutateAsync(copilotIdea.trim());
        setGeneratedDraft(result);
        setCurrentStep(2);
       }
    } catch (err) {
      console.error('Error generating AI draft:', err);
      setDraftError('Failed to generate proposal draft. Please try again.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Prefill fields and show submission form (do not navigate or use sessionStorage)
  const handleUseDraft = () => {
    if (!generatedDraft) return;

    const nextTitle = generatedDraft.title;
    const nextContent = `${generatedDraft.summary}\n\n**Rationale:**\n${generatedDraft.rationale}\n\n**Specifications:**\n${generatedDraft.specifications}`;

    const cidOpt = generatedCommitteeSuggestion?.committee_id;
    const cidValue = Array.isArray(cidOpt) ? cidOpt[0] : cidOpt;
    const nextCommitteeId = (cidValue !== undefined && cidValue !== null && cidValue !== '') ? String(cidValue) : '';

    setProposalTitle(nextTitle || '');
    setProposalContent(nextContent || '');
    setSelectedCommitteeId(nextCommitteeId);
    setCurrentStep(3);
  };

  const handleSubmitProposal = async () => {
    if (!proposalTitle.trim() || !proposalContent.trim() || !backendActor || !dao) {
      setSubmitError('Missing required fields or DAO context.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1) Create proposal on DAO canister via hook
      const proposalId = await createProposalMutation.mutateAsync({
        title: proposalTitle.trim(),
        description: proposalContent.trim(),
        committeeId: selectedCommitteeId,
      });

      // const analyzerProposalId = `${dao.id}-${proposalId}`; // composite id used by analyzer

      // // 2) Submit to analyzer (combined submit + analyze) using hook
      // await submitProposalMutation.mutateAsync({
      //   proposalId: analyzerProposalId,
      //   title: proposalTitle.trim(),
      //   description: proposalContent.trim()
      // });

      // 3) Redirect to DAO page with proposals tab active
      navigate(`/dao/${daoId}?tab=proposals`);
    } catch (err) {
      console.error('Error creating proposal from Copilot page:', err);
      setSubmitError(err?.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunDebateSimulation = async () => {
    if (!proposalTitle.trim() || !proposalContent.trim()) {
      setDebateError('Please fill in both title and content before running the debate simulation');
      return;
    }

    setIsRunningDebate(true);
    setIsDebateLoading(true);
    setDebateError('');
    setDebateResults(null);
    setSelectedPersonaIndex(0);

    try {
      const result = await debateSimulationMutation.mutateAsync({ title: proposalTitle.trim(), content: proposalContent.trim() });
      setDebateResults(result);
      setIsDebateSimulationOpen(true);
      setSelectedPersonaIndex(0);
    } catch (error) {
      console.error('Error running debate simulation:', error);
      setDebateError(error?.message || 'An unexpected error occurred during simulation');
    } finally {
      setIsRunningDebate(false);
      setIsDebateLoading(false);
    }
  };

  const handleCloseDebateSimulation = () => {
    setIsDebateSimulationOpen(false);
    setDebateError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className={`transition-all duration-300 ${isDebateSimulationOpen ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/dao/${daoId}?tab=proposals`)}
              className="inline-flex items-center text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to DAO
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Proposal Co-pilot</h1>
              <p className="text-sm text-slate-600">AI-powered proposal drafting assistant</p>
            </div>
          </div>
        </div>
        <div className={`grid transition-all duration-300 ${isDebateSimulationOpen ? 'grid-cols-1 lg:grid-cols-3 gap-6' : 'grid-cols-1'}`}>
          

          <div className={`${isDebateSimulationOpen ? 'lg:col-span-2' : ''}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              {/* Step Header */}
              <div className="mb-2">
                <div className="flex items-center">
                  {steps.map((s, idx) => {
                    const isCompleted = s.id < currentStep;
                    const isCurrent = s.id === currentStep;
                    const canNavigate = s.id < currentStep; // allow navigating back only
                    return (
                      <div key={s.id} className="flex items-center flex-1">
                        <button
                          type="button"
                          onClick={() => canNavigate && setCurrentStep(s.id)}
                          className={[
                            'relative z-10 inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors',
                            isCompleted
                              ? 'bg-green-600 border-green-600 text-white'
                              : isCurrent
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-slate-300 text-slate-600',
                            canNavigate ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                          ].join(' ')}
                          aria-current={isCurrent ? 'step' : undefined}
                          aria-label={`Step ${s.id}: ${s.name}`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-semibold">{s.id}</span>
                          )}
                        </button>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-slate-600">{s.name}</div>
                          {isCurrent && (
                            <div className="text-[10px] text-slate-500">Current</div>
                          )}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={[
                              'mx-4 h-0.5 flex-1 rounded-full',
                              currentStep - 1 > idx ? 'bg-green-500' : 'bg-slate-200'
                            ].join(' ')}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">Step {currentStep} of {steps.length}</p>
              </div>

              {/* Step 1: Idea Input */}
              {currentStep === 1 && (
              <div>
                <label htmlFor="copilot-idea" className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your proposal idea
                </label>
                <textarea
                  id="copilot-idea"
                  value={copilotIdea}
                  onChange={(e) => setCopilotIdea(e.target.value)}
                  placeholder="Describe your proposal idea in one sentence. For example: 'Implement a bug bounty program to incentivize security researchers' or 'Create a community fund for supporting open source projects'"
                  disabled={isGeneratingDraft}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">{copilotIdea.length}/500 characters</p>
              </div>
              )}

              {/* Committee Suggestion Toggle (Step 1 only) */}
              {currentStep === 1 && committees.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-slate-600" />
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Committee Suggestion</h3>
                        <p className="text-xs text-slate-500">Get AI recommendations for the most suitable committee</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCommitteeSuggestion}
                        onChange={(e) => setUseCommitteeSuggestion(e.target.checked)}
                        disabled={isGeneratingDraft}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {useCommitteeSuggestion && (
                    <div className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>AI will analyze your proposal and suggest the most relevant committee from {committees.length} available committees.</span>
                      </div>
                    </div>
                  )}
                      </div>
                    )}

              {/* Generate Button (Step 1 only) */}
              {currentStep === 1 && (
              <div className="flex justify-center">
                <button
                  onClick={handleGenerateAIDraft}
                  disabled={isGeneratingDraft || !copilotIdea.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm flex items-center space-x-2"
                >
                  {isGeneratingDraft ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating AI Draft...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Generate AI Draft</span>
                    </>
                  )}
                </button>
              </div>
              )}

              {/* Error Display (Step 1 only) */}
              {currentStep === 1 && draftError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700 font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{draftError}</p>
                </div>
              )}

              {/* Step 2: Generated Draft Review */}
              {currentStep === 2 && generatedDraft && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Generated Proposal Draft</h3>
                    <button
                      onClick={handleUseDraft}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Use This Draft</span>
                    </button>
                  </div>

                  {/* Committee Suggestion Display */}
                  {generatedCommitteeSuggestion && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">Recommended Committee</h4>
                          <div className="mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {(() => {
                                const cidOpt = generatedCommitteeSuggestion?.committee_id;
                                const cid = Array.isArray(cidOpt) ? cidOpt[0] : cidOpt;
                                const committee = committees.find(c => Number(c.id) === Number(cid));
                                if (!committee) return cid != null ? `Committee #${cid}` : 'Committee: Unspecified';
                                const ct = committee.committee_type;
                                const label = typeof ct === 'string' ? ct : (ct && typeof ct === 'object' ? Object.keys(ct)[0] : 'Unknown');
                                return `${label} #${Number(committee.id)}`;
                              })()}
                            </span>
                          </div>
                          {(() => {
                            const reasoningOpt = generatedCommitteeSuggestion?.reasoning;
                            const reasoning = Array.isArray(reasoningOpt) ? reasoningOpt[0] : reasoningOpt;
                            return (
                              <p className="text-sm text-slate-700 leading-relaxed">{reasoning || 'No reasoning provided.'}</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Title</h4>
                      <p className="text-slate-900 font-medium">{generatedDraft.title}</p>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{generatedDraft.summary}</p>
                    </div>

                    {/* Rationale */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Rationale</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{generatedDraft.rationale}</p>
                    </div>

                    {/* Specifications */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Specifications</h4>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{generatedDraft.specifications}</p>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleUseDraft}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-sm flex items-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>Use This Draft</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Finalize & Submit */}
              {currentStep === 3 && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Finalize & Submit Proposal</h3>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="proposal-title" className="block text-sm font-medium text-slate-700 mb-2">Proposal Title</label>
                      <input
                        id="proposal-title"
                        type="text"
                        value={proposalTitle}
                        onChange={(e) => setProposalTitle(e.target.value)}
                        maxLength={200}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">{proposalTitle.length}/200 characters</p>
                    </div>

                    <div>
                      <label htmlFor="proposal-content" className="block text-sm font-medium text-slate-700 mb-2">Proposal Description</label>
                      <textarea
                        id="proposal-content"
                        ref={descriptionRef}
                        value={proposalContent}
                        onChange={(e) => { setProposalContent(e.target.value); autoResizeDescription(e.target); }}
                        maxLength={5000}
                        disabled={isSubmitting}
                        placeholder="Describe the proposal in detail, including goals, rationale, specifications, milestones, and budget where applicable."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 resize-y overflow-hidden text-base leading-relaxed min-h-[520px]"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-right">{proposalContent.length}/5000 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Committee (optional)</label>
                      <select
                        value={selectedCommitteeId}
                        onChange={(e) => setSelectedCommitteeId(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                      >
                        <option value="">No committee</option>
                        {committees.map((c) => (
                          <option key={Number(c.id)} value={String(Number(c.id))}>
                            {(() => {
                              const ct = c.committee_type;
                              const label = typeof ct === 'string' ? ct : (ct && typeof ct === 'object' ? Object.keys(ct)[0] : 'Unknown');
                              return `${label} #${Number(c.id)}`;
                            })()}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">If selected, the proposal will be tagged with the committee.</p>
                    </div>

                    {/* Debate Simulation Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">Stress-Test Your Proposal</h4>
                          <p className="text-sm text-slate-700 mb-3">Get feedback from AI personas representing different DAO member perspectives before submitting.</p>
                          <button
                            onClick={handleRunDebateSimulation}
                            disabled={isRunningDebate || isSubmitting || !proposalTitle.trim() || !proposalContent.trim()}
                            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
                          >
                            {isRunningDebate ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Running Simulation...</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                <span>Stress-Test My Proposal</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {debateError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Debate Simulation Error</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">{debateError}</p>
                      </div>
                    )}

                    {submitError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Failed to submit proposal</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">{submitError}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitProposal}
                        disabled={isSubmitting || !proposalTitle.trim() || !proposalContent.trim()}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold shadow-sm"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating ...</span>
                          </div>
                        ) : (
                          'Create Proposal'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Debate Simulation Sidebar - now as right column */}
          {isDebateSimulationOpen && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    AI Debate Simulation
                  </h3>
                  <button
                    onClick={handleCloseDebateSimulation}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {!debateResults && !isDebateLoading && (
                  <div className="text-sm text-slate-600">Run the simulation to see AI personas discuss your proposal.</div>
                )}

                {isDebateLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-slate-600 text-sm">Preparing personas...</span>
                  </div>
                )}

                {debateResults && (
                  <div>
                    {/* Persona Switcher */}
                    <div className="flex items-center gap-2 flex-wrap pb-3">
                      {debateResults.personas.map((p, idx) => {
                        const IconComp = getIconComponent(p.icon);
                        const isActive = idx === selectedPersonaIndex;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedPersonaIndex(idx)}
                            className={`shrink-0 px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                            title={p.name}
                          >
                            <IconComp className="h-4 w-4" />
                            <span className="truncate max-w-[8rem]">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center my-2">
                      <button
                        onClick={() => setSelectedPersonaIndex((i) => Math.max(0, i - 1))}
                        disabled={selectedPersonaIndex === 0}
                        className="px-2 py-1 rounded-md border border-slate-200 text-slate-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </button>
                      <span className="text-xs text-slate-500">{selectedPersonaIndex + 1} / {debateResults.personas.length}</span>
                      <button
                        onClick={() => setSelectedPersonaIndex((i) => Math.min(debateResults.personas.length - 1, i + 1))}
                        disabled={selectedPersonaIndex === debateResults.personas.length - 1}
                        className="px-2 py-1 rounded-md border border-slate-200 text-slate-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Persona Card */}
                    {(() => {
                      const persona = debateResults.personas[selectedPersonaIndex];
                      const IconComp = getIconComponent(persona.icon);
                      return (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                              <IconComp className="h-5 w-5" />
                            </div>
                            <h4 className="font-semibold text-slate-900">{persona.name}</h4>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Core Argument:</p>
                            <p className="text-sm text-slate-600">{persona.coreArgument}</p>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-2">Potential Objections:</p>
                            <ul className="space-y-1">
                              {persona.objections.map((objection, objIndex) => (
                                <li key={objIndex} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  <span>{objection}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                            <p className="text-sm font-medium text-emerald-800 mb-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Actionable Suggestion:
                            </p>
                            <p className="text-sm text-emerald-700">{persona.actionableSuggestion}</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={handleRunDebateSimulation}
                        disabled={isDebateLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {isDebateLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Re-analyzing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Re-run Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Removed old below-form Debate Simulation Sidebar rendering */}
    </div>
  );
}
