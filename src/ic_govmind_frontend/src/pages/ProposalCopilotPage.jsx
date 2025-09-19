import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Users, Sparkles, X, AlertTriangle, Check, ArrowLeft } from 'lucide-react';
import { useDaoInfo, useBackendDaoInfo } from '../hooks/daoHooks';
import { useActiveCommittees, useGenerateDraftWithCommittee, useGenerateDraft } from '../hooks/useProposals';

export default function ProposalCopilotPage() {
  const { daoId } = useParams();
  const navigate = useNavigate();

  // Load DAO and backend actor
  const { data: dao } = useDaoInfo();
  const { data: backendInfo } = useBackendDaoInfo(dao);
  const backendActor = backendInfo?.backendActor;
  const backendDao = backendInfo?.backendDao;

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
  // 3-step flow: 1) Idea -> 2) Review -> 3) Finalize
  const [currentStep, setCurrentStep] = useState(1);

  // Stepper definition for header
  const steps = [
    { id: 1, name: 'Idea' },
    { id: 2, name: 'Review' },
    { id: 3, name: 'Finalize' },
  ];

  // Data hooks
  const { data: committees = [] } = useActiveCommittees(backendActor);
  const generateDraftWithCommitteeMutation = useGenerateDraftWithCommittee();
  const generateDraftMutation = useGenerateDraft();

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
        setGeneratedDraft(result.draft);
        setGeneratedCommitteeSuggestion(result.committee_suggestion[0]);
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
      // 1) Create proposal on DAO canister
      const createProposalResult = await backendActor.create_proposal(
        proposalTitle.trim(),
        proposalContent.trim(),
        selectedCommitteeId ? [parseInt(selectedCommitteeId)] : [],
      );

      if (!(createProposalResult && createProposalResult.Ok !== undefined)) {
        throw new Error(createProposalResult?.Err || 'Failed to create proposal');
      }

      const proposalId = createProposalResult.Ok;
      const analyzerProposalId = `${dao.id}-${proposalId}`; // composite id used by analyzer

      // 2) Submit to analyzer (combined submit + analyze)
      try {
        const { submitProposalAndAnalyze } = await import('../services/aiService');
        const result = await submitProposalAndAnalyze(
          proposalTitle.trim(),
          proposalContent.trim(),
          analyzerProposalId
        );
        if (!result.success) {
          throw new Error(result.error || 'Analyzer submission failed');
        }
      } catch (analyzerError) {
        console.error('Analysis submission failed:', analyzerError);
        throw analyzerError;
      }

      // 3) Redirect to DAO page with proposals tab active
      navigate(`/dao/${daoId}?tab=proposals`);
    } catch (err) {
      console.error('Error creating proposal from Copilot page:', err);
      setSubmitError(err?.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                     value={proposalContent}
                     onChange={(e) => setProposalContent(e.target.value)}
                     maxLength={5000}
                     rows={8}
                     disabled={isSubmitting}
                     className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 resize-none"
                   />
                   <p className="text-xs text-slate-500 mt-1">{proposalContent.length}/5000 characters</p>
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
                     {(backendDao?.committees || []).filter((c) => (c.active === undefined ? true : !!c.active)).map((c) => (
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
                         <span>Creating & Analyzing...</span>
                       </div>
                     ) : (
                       'Create & Analyze Proposal'
                     )}
                   </button>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}