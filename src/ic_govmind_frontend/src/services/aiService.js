// AI Service for proposal analysis
// This service calls external AI APIs directly from the frontend

const AI_API_CONFIG = {
  // For production: use backend proxy (secure)
  BACKEND_PROXY: {
    deepseekUrl: (import.meta.env.VITE_BACKEND_PROXY_URL || 'http://localhost:3001') + '/api/analyze/deepseek',
    useProxy: import.meta.env.VITE_USE_BACKEND_PROXY === 'true', // Set to 'true' for production
  },
  // For development: direct API calls (insecure but convenient)
  DEEPSEEK: {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, // Set this in .env file
  }
};

/**
 * Generate a detailed analysis prompt for the AI
 */
function createAnalysisPrompt(title, description) {
  return `Please analyze the following DAO proposal and provide a detailed analysis report:

Proposal Title: ${title}
Proposal Description: ${description}

Please analyze from the following perspectives:

1. Summary: Summarize the core content of the proposal in simple and understandable language

2. Risk Assessment: Analyze the potential risks and challenges. Format as a single text string with numbered points (1. First risk, 2. Second risk, etc.)

3. Recommendations: Provide specific improvement suggestions or precautions. Format as a single text string with numbered points (1. First recommendation, 2. Second recommendation, etc.)

4. Complexity Analysis: Provide a comprehensive complexity assessment:
   - Overall Complexity Score (1-10): Average of all complexity dimensions
   - Technical Complexity (1-10): How technically challenging is implementation? Consider:
     * Code changes required, smart contract complexity, integration challenges
     * 1-3: Simple parameter changes, basic operations
     * 4-6: Moderate development work, standard integrations  
     * 7-10: Complex architecture changes, novel technical solutions
   - Financial Complexity (1-10): How complex are the financial/economic aspects? Consider:
     * Budget size, funding mechanisms, tokenomics changes
     * 1-3: Simple budget allocations, standard payments
     * 4-6: Multi-phase funding, moderate economic impact
     * 7-10: Complex tokenomics, major economic restructuring
   - Governance Complexity (1-10): How complex are the governance/legal aspects? Consider:
     * Voting mechanisms, legal implications, regulatory considerations
     * 1-3: Standard proposals within existing framework
     * 4-6: Minor governance changes, moderate legal review needed
     * 7-10: Major governance restructuring, complex legal implications
   - Timeline Complexity (1-10): How complex is coordination and execution timeline? Consider:
     * Dependencies, coordination requirements, milestone complexity
     * 1-3: Single-step execution, minimal coordination
     * 4-6: Multi-phase execution, moderate dependencies
     * 7-10: Complex multi-stakeholder coordination, long-term execution

5. Estimated Impact: Evaluate the potential impact of the proposal on the DAO

Please return the result in JSON format without wrapping it in Markdown formatting:
{
    "summary": "Summary of the proposal",
    "risk_assessment": "1. First risk point 2. Second risk point 3. Third risk point",
    "recommendations": "1. First recommendation 2. Second recommendation 3. Third recommendation",
    "complexity_score": 5.5,
    "complexity_breakdown": {
        "technical_complexity": 6.0,
        "financial_complexity": 4.0,
        "governance_complexity": 7.0,
        "timeline_complexity": 5.0,
        "explanation": "This proposal has high governance complexity due to required policy changes, moderate technical requirements for implementation, manageable financial aspects, and standard timeline coordination needs.",
        "comparison": "More complex than typical budget proposals (3-4/10) but less complex than major protocol upgrades (8-9/10). Similar complexity to governance framework updates."
    },
    "estimated_impact": "Estimated impact on the DAO"
}`;
}

/**
 * Extract JSON content from AI response, handling markdown wrappers
 */
function extractJsonFromResponse(content) {
  // Remove markdown code blocks if present
  let cleanContent = content.trim();
  
  // Remove ```json and ``` markers
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Find JSON object in the content
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  return cleanContent.trim();
}

/**
 * Validate and normalize analysis result
 */
function validateAnalysisResult(analysis) {
  // Convert arrays to strings if needed
  const convertToString = (value) => {
    if (Array.isArray(value)) {
      return value.join(' ');
    }
    return value || '';
  };

  // Ensure all required fields exist with defaults
  const validated = {
    summary: analysis.summary || 'Analysis completed',
    risk_assessment: convertToString(analysis.risk_assessment) || 'Standard proposal risks apply',
    recommendations: convertToString(analysis.recommendations) || 'Follow standard DAO procedures',
    complexity_score: typeof analysis.complexity_score === 'number' ? analysis.complexity_score : 5.0,
    complexity_breakdown: {
      technical_complexity: analysis.complexity_breakdown?.technical_complexity || 5.0,
      financial_complexity: analysis.complexity_breakdown?.financial_complexity || 5.0,
      governance_complexity: analysis.complexity_breakdown?.governance_complexity || 5.0,
      timeline_complexity: analysis.complexity_breakdown?.timeline_complexity || 5.0,
      explanation: analysis.complexity_breakdown?.explanation || 'Standard complexity assessment',
      comparison: analysis.complexity_breakdown?.comparison || 'Typical DAO proposal complexity'
    },
    estimated_impact: analysis.estimated_impact || 'Moderate impact expected'
  };
  
  // Ensure complexity scores are within valid range (1-10)
  ['technical_complexity', 'financial_complexity', 'governance_complexity', 'timeline_complexity'].forEach(key => {
    const value = validated.complexity_breakdown[key];
    if (typeof value !== 'number' || value < 1 || value > 10) {
      validated.complexity_breakdown[key] = 5.0;
    }
  });
  
  // Ensure overall complexity score is within valid range
  if (typeof validated.complexity_score !== 'number' || validated.complexity_score < 1 || validated.complexity_score > 10) {
    validated.complexity_score = (
      validated.complexity_breakdown.technical_complexity +
      validated.complexity_breakdown.financial_complexity +
      validated.complexity_breakdown.governance_complexity +
      validated.complexity_breakdown.timeline_complexity
    ) / 4;
  }
  
  return validated;
}

/**
 * Call backend proxy for proposal analysis (production-safe)
 */
async function callBackendProxy(title, description) {
  const config = AI_API_CONFIG.BACKEND_PROXY;
  const url = config.deepseekUrl;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend proxy error (${response.status}): ${errorText}`);
  }
  
  const analysis = await response.json();
  
  if (analysis.error) {
    throw new Error(analysis.error);
  }
  
  return analysis;
}

/**
 * Call DeepSeek API for proposal analysis
 */
async function callDeepSeekAPI(title, description) {
  const config = AI_API_CONFIG.DEEPSEEK;
  
  if (!config.apiKey) {
    throw new Error('DeepSeek API key not configured. Please set VITE_DEEPSEEK_API_KEY in your .env file.');
  }
  
  const prompt = createAnalysisPrompt(title, description);
  
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional DAO governance analyst who specializes in analyzing proposals and providing valuable recommendations. Always provide consistent, structured responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for more consistent results
      max_tokens: 2000,
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from DeepSeek API');
  }
  
  return data.choices[0].message.content;
}



/**
 * Main function to get AI analysis for a proposal using DeepSeek
 * @param {string} title - Proposal title
 * @param {string} description - Proposal description
 * @returns {Promise<Object>} Structured analysis result
 */
export async function getAIAnalysis(title, description) {
  if (!title || !description) {
    throw new Error('Title and description are required for analysis');
  }
  
  try {
    let analysis;
    
    // Choose between backend proxy (production) or direct API calls (development)
    if (AI_API_CONFIG.BACKEND_PROXY.useProxy) {
      // Use secure backend proxy
      console.log('Using backend proxy for DeepSeek analysis');
      analysis = await callBackendProxy(title, description);
    } else {
      // Use direct API calls (development only)
      console.log('Using direct DeepSeek API calls');
      const aiResponse = await callDeepSeekAPI(title, description);
      
      // Extract and parse JSON from AI response
      const jsonContent = extractJsonFromResponse(aiResponse);
      try {
        analysis = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', jsonContent);
        throw new Error('AI returned invalid JSON response');
      }
    }
    
    // Validate and normalize the result
    const validatedAnalysis = validateAnalysisResult(analysis);
    
    // Ensure the object structure exactly matches the Rust struct
    const finalAnalysis = {
      summary: validatedAnalysis.summary,
      risk_assessment: validatedAnalysis.risk_assessment,
      recommendations: validatedAnalysis.recommendations,
      complexity_score: validatedAnalysis.complexity_score,
      complexity_breakdown: {
        technical_complexity: validatedAnalysis.complexity_breakdown.technical_complexity,
        financial_complexity: validatedAnalysis.complexity_breakdown.financial_complexity,
        governance_complexity: validatedAnalysis.complexity_breakdown.governance_complexity,
        timeline_complexity: validatedAnalysis.complexity_breakdown.timeline_complexity,
        explanation: validatedAnalysis.complexity_breakdown.explanation,
        comparison: validatedAnalysis.complexity_breakdown.comparison
      },
      estimated_impact: validatedAnalysis.estimated_impact
    };
    
    console.log('AI Analysis completed:', finalAnalysis);
    console.log('Analysis structure check:', {
      hasSummary: !!finalAnalysis.summary,
      hasRiskAssessment: !!finalAnalysis.risk_assessment,
      hasRecommendations: !!finalAnalysis.recommendations,
      hasComplexityScore: typeof finalAnalysis.complexity_score === 'number',
      hasComplexityBreakdown: !!finalAnalysis.complexity_breakdown,
      hasEstimatedImpact: !!finalAnalysis.estimated_impact
    });
    
    return finalAnalysis;
    
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw error;
  }
}

/**
 * Get a simple mock analysis (for testing when API keys are not available)
 */
export function getMockAnalysis(title, description) {
  const wordCount = description.split(' ').length;
  const hasFinancial = description.toLowerCase().includes('budget') || description.toLowerCase().includes('funding');
  const hasTechnical = description.toLowerCase().includes('technical') || description.toLowerCase().includes('development');
  
  // Ensure the object structure exactly matches the Rust struct
  return {
    summary: `Mock analysis for "${title}". This proposal contains ${wordCount} words and appears to be ${hasFinancial ? 'financially' : hasTechnical ? 'technically' : 'generally'} focused.`,
    risk_assessment: "1. This is a mock analysis for testing purposes 2. Real analysis requires API configuration 3. Consider implementing proper risk assessment",
    recommendations: "1. Configure AI API keys for real analysis 2. Review proposal content carefully 3. Engage community in discussion",
    complexity_score: Math.min(10, Math.max(1, wordCount / 20)),
    complexity_breakdown: {
      technical_complexity: hasTechnical ? 7.0 : 3.0,
      financial_complexity: hasFinancial ? 8.0 : 2.0,
      governance_complexity: 5.0,
      timeline_complexity: 4.0,
      explanation: "Mock complexity assessment based on keyword analysis",
      comparison: "This is a simulated complexity score for testing purposes"
    },
    estimated_impact: hasFinancial ? "High impact due to financial implications" : hasTechnical ? "Medium-high impact due to technical changes" : "Medium impact proposal"
  };
} 