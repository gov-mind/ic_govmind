// AI Service for proposal analysis
// This service calls the IC canister for AI analysis

import { ic_govmind_proposal_analyzer } from 'declarations/ic_govmind_proposal_analyzer';

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