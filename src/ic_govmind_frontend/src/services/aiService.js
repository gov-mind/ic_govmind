// AI Service for proposal analysis
// This service calls the IC canister for AI analysis

import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';
import { Principal } from "@dfinity/principal";

// Get AI analysis for a proposal using proposal ID
export const getAIAnalysis = async (proposalId) => {
  try {
    // Call the simplified canister method with only proposal ID
    const result = await ic_govmind_proposal_analyzer.analyze_proposal(proposalId);
    
    // Handle Result type from Rust
    if ('Ok' in result) {
      return {
        success: true,
        data: result.Ok
      };
    } else {
      return {
        success: false,
        error: result.Err || 'Analysis failed'
      };
    }
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI analysis'
    };
  }
};

// Submit proposal and automatically run analysis
export const submitProposalAndAnalyze = async (title, description, proposalId = null) => {
  try {
    const result = await ic_govmind_proposal_analyzer.submit_proposal_and_analyze(
      proposalId ? [proposalId] : [], // Optional proposal ID
      title,
      description
    );
    
    // Handle Result type from Rust
    if ('Ok' in result) {
      return {
        success: true,
        proposalId: result.Ok
      };
    } else {
      return {
        success: false,
        error: result.Err || 'Submission failed'
      };
    }
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit proposal'
    };
  }
};

// Generate proposal draft with committee suggestion
export const generateDraftWithCommittee = async (idea, daoCanisterId) => {
  try {
    // Use the enhanced draft_proposal_with_committees method from the proposal analyzer
    const result = await ic_govmind_proposal_analyzer.draft_proposal_with_committees(idea, Principal.fromText(daoCanisterId));
    
    if (result && result.Ok) {
      console.log(result.Ok);

      return {
        success: true,
        data: result.Ok
      };
    } else {
      return {
        success: false,
        error: result?.Err || 'Failed to generate draft with committee suggestion'
      };
    }
  } catch (error) {
    console.error('Error generating draft with committee:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate draft with committee suggestion'
    };
  }
};

export const generateDraft = async (idea) => {
  try {
    const result = await ic_govmind_proposal_analyzer.draft_proposal(idea);
    
    if (result && result.Ok) {
      return {
        success: true,
        data: result.Ok
      };
    } else {
      return {
        success: false,
        error: result?.Err || 'Failed to generate draft'
      };
    }
  } catch (error) {
    console.error('Error generating draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate draft'
    };
  }
}

// Fetch active committees from backend
export const getActiveCommittees = async (backendActor) => {
  try {
    const result = await backendActor.get_active_committees();
    
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result
      };
    } else {
      return {
        success: false,
        error: 'Invalid response format'
      };
    }
  } catch (error) {
    console.error('Error fetching active committees:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch active committees'
    };
  }
};