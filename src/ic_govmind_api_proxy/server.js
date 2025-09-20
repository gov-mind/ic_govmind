// IC GovMind API Proxy Service
// Secure backend service for handling AI API calls with proper key management
// Supports DeepSeek and OpenAI APIs with rate limiting and error handling

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://app.govmind.info', // Our Domain
    'https://2dp5b-iiaaa-aaaaj-qnrua-cai.icp0.io', // IC mainnet
    'https://*.localhost:4943' // Local IC replica
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API keys from environment (secure)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    services: {
      deepseek: !!DEEPSEEK_API_KEY
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'IC GovMind API Proxy',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/health',
      'POST /api/proposals/analyze',
      'POST /api/proposals/draft'
    ]
  });
});

// DeepSeek API proxy
app.post('/api/proposals/analyze', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({
        error: 'Title and description are required',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DeepSeek API key not configured',
        code: 'API_KEY_MISSING'
      });
    }

    const prompt = createAnalysisPrompt(title, description);
    
    console.log(`[DeepSeek] Analyzing proposal: "${title.substring(0, 50)}..."`);
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'User-Agent': 'IC-GovMind-Proxy/1.0'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional DAO governance analyst. Always provide consistent, structured responses in valid JSON format without markdown wrappers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek] API error ${response.status}:`, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    const aiResponse = data.choices[0].message.content;
    const analysis = parseAIResponse(aiResponse);
    
    console.log(`[DeepSeek] Analysis completed successfully`);
    res.json({
      ...analysis,
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DeepSeek] Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message,
      code: 'ANALYSIS_FAILED',
      provider: 'deepseek'
    });
  }
});

// Debate simulation endpoint
app.post('/api/proposals/debate-simulation', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DeepSeek API key not configured',
        code: 'API_KEY_MISSING'
      });
    }

    const prompt = createDebateSimulationPrompt(title, content);
    
    console.log(`[DeepSeek] Running debate simulation for proposal: "${title.substring(0, 50)}..."`); 
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'User-Agent': 'IC-GovMind-Proxy/1.0'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional DAO governance expert who facilitates constructive debate by representing multiple stakeholder perspectives. Always provide consistent, structured responses in valid JSON format without markdown wrappers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek] API error ${response.status}:`, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    const aiResponse = data.choices[0].message.content;

    console.log(`[DeepSeek] Raw response: ${aiResponse.substring(0, 200)}...`);
    const debateResult = parseDebateSimulationResponse(aiResponse);
    
    console.log(`[DeepSeek] Debate simulation completed successfully`);
    res.json({
      success: true,
      personas: debateResult.personas,
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DeepSeek] Debate simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Debate simulation failed',
      details: error.message,
      code: 'DEBATE_SIMULATION_FAILED',
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Enhanced proposal draft generation with committee suggestion endpoint
app.post('/api/proposals/draft-with-committee', async (req, res) => {
  try {
    const { idea, committees } = req.body;
    
    // Validation
    if (!idea) {
      return res.status(400).json({
        success: false,
        error: 'Idea parameter is required',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!committees || !Array.isArray(committees)) {
      return res.status(400).json({
        success: false,
        error: 'Committees parameter is required and must be an array',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'DeepSeek API key not configured',
        code: 'API_KEY_MISSING'
      });
    }

    const prompt = createCommitteeSuggestionPrompt(idea, committees);
    
    console.log(`[DeepSeek] Generating proposal draft with committee suggestion for idea: "${idea.substring(0, 50)}..."`);
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'User-Agent': 'IC-GovMind-Proxy/1.0'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert assistant for a Decentralized Autonomous Organization (DAO). You help transform raw ideas into formal, well-structured proposal drafts and suggest the most appropriate committee for review. Always respond with valid JSON format without markdown wrappers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek] API Error: ${response.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from DeepSeek API');
    }

    console.log(`[DeepSeek] Raw response: ${content.substring(0, 200)}...`);
    
    // Parse the enhanced response with committee suggestion
    const result = parseCommitteeSuggestionResponse(content, committees);
    
    res.json({
      success: true,
      ...result,
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[DeepSeek] Draft with committee generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate proposal draft with committee suggestion',
      details: error.message,
      code: 'DRAFT_GENERATION_FAILED',
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Proposal draft generation endpoint
app.post('/api/proposals/draft', async (req, res) => {
  try {
    const { idea } = req.body;
    
    // Validation
    if (!idea) {
      return res.status(400).json({
        error: 'Idea parameter is required',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DeepSeek API key not configured',
        code: 'API_KEY_MISSING'
      });
    }

    const prompt = createDraftPrompt(idea);
    
    console.log(`[DeepSeek] Generating proposal draft for idea: "${idea.substring(0, 50)}..."`);
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'User-Agent': 'IC-GovMind-Proxy/1.0'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert assistant for a Decentralized Autonomous Organization (DAO). You help transform raw ideas into formal, well-structured proposal drafts. Always respond with valid JSON format without markdown wrappers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek] API error ${response.status}:`, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    const aiResponse = data.choices[0].message.content;
    const draft = parseDraftResponse(aiResponse);
    
    console.log(`[DeepSeek] Proposal draft generated successfully`);
    res.json({
      success: true,
      draft: draft,
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DeepSeek] Draft generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Draft generation failed',
      details: error.message,
      code: 'DRAFT_GENERATION_FAILED',
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString()
      }
    });
  }
});



// Helper functions
function createAnalysisPrompt(title, description) {
  return `Please analyze the following DAO proposal and provide a detailed analysis report:

Proposal Title: ${title}
Proposal Description: ${description}

Please analyze from the following perspectives:

1. Summary: Summarize the core content of the proposal in simple and understandable language
2. Risk Assessment: Analyze the potential risks and challenges. Format as a single text string with numbered points (1. First risk, 2. Second risk, etc.)
3. Recommendations: Provide specific improvement suggestions or precautions. Format as a single text string with numbered points (1. First recommendation, 2. Second recommendation, etc.)
4. Complexity Analysis: Provide a comprehensive complexity assessment
5. Estimated Impact: Evaluate the potential impact of the proposal on the DAO

Return the result in JSON format without any markdown wrappers:
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
        "explanation": "Complexity explanation with reasoning for each score",
        "comparison": "How this compares to typical DAO proposals"
    },
    "estimated_impact": "Estimated impact on the DAO with specific details"
}`;
}

function parseAIResponse(content) {
  // Extract JSON from markdown if wrapped
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Find JSON boundaries
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    const analysis = JSON.parse(cleanContent);
    
    // Convert arrays to strings if needed
    const convertToString = (value) => {
      if (Array.isArray(value)) {
        return value.join(' ');
      }
      return value || '';
    };
    
    // Validate and normalize the response
    return {
      summary: analysis.summary || 'Analysis completed',
      risk_assessment: convertToString(analysis.risk_assessment) || 'Standard proposal risks apply',
      recommendations: convertToString(analysis.recommendations) || 'Follow standard DAO procedures',
      complexity_score: typeof analysis.complexity_score === 'number' 
        ? Math.max(1, Math.min(10, analysis.complexity_score)) 
        : 5.0,
      complexity_breakdown: {
        technical_complexity: Math.max(1, Math.min(10, analysis.complexity_breakdown?.technical_complexity || 5.0)),
        financial_complexity: Math.max(1, Math.min(10, analysis.complexity_breakdown?.financial_complexity || 5.0)),
        governance_complexity: Math.max(1, Math.min(10, analysis.complexity_breakdown?.governance_complexity || 5.0)),
        timeline_complexity: Math.max(1, Math.min(10, analysis.complexity_breakdown?.timeline_complexity || 5.0)),
        explanation: analysis.complexity_breakdown?.explanation || 'Standard complexity assessment',
        comparison: analysis.complexity_breakdown?.comparison || 'Typical DAO proposal complexity'
      },
      estimated_impact: analysis.estimated_impact || 'Moderate impact expected'
    };
  } catch (error) {
    console.error('Failed to parse AI response:', cleanContent);
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
}

function createDraftPrompt(idea) {
  return `You are an expert assistant for a Decentralized Autonomous Organization (DAO). Your task is to take a user's raw idea and transform it into a formal, well-structured proposal draft.

The DAO uses a standard proposal format with four sections:
1. **Title:** A concise and clear title.
2. **Summary:** A one-paragraph executive summary explaining the proposal.
3. **Rationale:** A detailed explanation of why this proposal is necessary and beneficial for the DAO.
4. **Specifications:** The concrete actions to be taken if the proposal passes (e.g., specific amounts, wallet addresses, canister calls).

Here is the user's raw idea:
"${idea}"

Based on this idea, please generate the proposal. If some details are missing (like a specific wallet address), use a clear placeholder like "[INSERT WALLET ADDRESS HERE]" and mention in the rationale that this needs to be provided.

Your response MUST be a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting. The JSON object must have the following keys: "title", "summary", "rationale", "specifications".`;
}

function createDebateSimulationPrompt(title, content) {
  return `You are facilitating a DAO governance debate simulation. Generate 4 distinct AI personas who will critically evaluate this proposal from different perspectives.

Proposal Title: ${title}
Proposal Content: ${content}

Generate exactly 4 personas with these specific roles:
1. **Financial Steward** - Focus on budget, ROI, financial sustainability
2. **Mission Guardian** - Focus on strategic alignment with DAO mission and values
3. **Technical Realist** - Focus on implementation feasibility and technical challenges
4. **Community Advocate** - Focus on transparency, community impact, and member interests

For each persona, provide:
- name: A professional name for the persona
- icon: One of these exact values: "DollarSign", "Target", "Code", "Users"
- coreArgument: Their main perspective on the proposal (2-3 sentences)
- objections: Array of 2-3 specific concerns or risks they identify
- actionableSuggestion: One concrete, specific improvement they recommend

Return the result in JSON format without any markdown wrappers:
{
  "personas": [
    {
      "name": "Persona Name",
      "icon": "IconName",
      "coreArgument": "Main argument text",
      "objections": ["First objection", "Second objection"],
      "actionableSuggestion": "Specific suggestion text"
    }
  ]
}`;
}

function parseDebateSimulationResponse(content) {
  // Extract JSON from markdown if wrapped
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Find JSON boundaries
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    const result = JSON.parse(cleanContent);
    
    // Validate and normalize the response
    const personas = (result.personas || []).map(persona => ({
      name: persona.name || 'Anonymous Reviewer',
      icon: persona.icon || 'Users',
      core_argument: persona.coreArgument || 'No argument provided',
      objections: Array.isArray(persona.objections) ? persona.objections : ['No objections provided'],
      actionable_suggestion: persona.actionableSuggestion || 'No suggestion provided'
    }));
    
    // Ensure we have exactly 4 personas
    while (personas.length < 4) {
      personas.push({
        name: `Reviewer ${personas.length + 1}`,
        icon: 'Users',
        core_argument: 'Additional review needed',
        objections: ['Insufficient analysis'],
        actionable_suggestion: 'Provide more detailed proposal information'
      });
    }
    
    return { personas: personas.slice(0, 4) };
  } catch (error) {
    console.error('Failed to parse debate simulation response:', cleanContent);
    throw new Error(`Failed to parse debate simulation response as JSON: ${error.message}`);
  }
}

function createCommitteeSuggestionPrompt(idea, committees) {
  const committeeList = committees.map(committee => {
    const type = committee.committee_type || 'Unknown';
    const responsibilities = committee.responsibilities || 'No responsibilities defined';
    return `- ${type} (ID: ${committee.id}): ${responsibilities}`;
  }).join('\n');

  return `You are an expert assistant for a Decentralized Autonomous Organization (DAO). Your task is to:
1. Transform a user's raw idea into a formal, well-structured proposal draft
2. Suggest the most appropriate committee to review this proposal

The DAO uses a standard proposal format with four sections:
1. **Title:** A concise and clear title.
2. **Summary:** A one-paragraph executive summary explaining the proposal.
3. **Rationale:** A detailed explanation of why this proposal is necessary and beneficial for the DAO.
4. **Specifications:** The concrete actions to be taken if the proposal passes (e.g., specific amounts, wallet addresses, canister calls).

Available committees and their responsibilities:
${committeeList}

Here is the user's raw idea:
"${idea}"

Based on this idea, please:
1. Generate a formal proposal draft following the standard format
2. Analyze which committee would be most suitable to review this proposal
3. Provide reasoning for your committee recommendation
4. If no suitable committee is found, set "suggested_committee_id" to null

Your response MUST be a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting. The JSON object must have the following keys:
- "title": string
- "summary": string  
- "rationale": string
- "specifications": string
- "suggested_committee_id": string (the ID of the recommended committee)
- "committee_reasoning": string (explanation for why this committee is most suitable)`;
}

function parseDraftResponse(content) {
  // Extract JSON from markdown if wrapped
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Find JSON boundaries
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    const draft = JSON.parse(cleanContent);
    
    // Validate and normalize the response
    return {
      title: draft.title || 'Untitled Proposal',
      summary: draft.summary || 'No summary provided',
      rationale: draft.rationale || 'No rationale provided',
      specifications: draft.specifications || 'No specifications provided'
    };
  } catch (error) {
    console.error('Failed to parse draft response:', cleanContent);
    throw new Error(`Failed to parse draft response as JSON: ${error.message}`);
  }
}

function parseCommitteeSuggestionResponse(content, committees) {
  // Extract JSON from markdown if wrapped
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Find JSON boundaries
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    const response = JSON.parse(cleanContent);
    
    // Find the suggested committee details
    const suggestedCommittee = committees.find(c => c.id === response.suggested_committee_id);
    
    // Validate and normalize the response
    return {
      draft: {
        title: response.title || 'Untitled Proposal',
        summary: response.summary || 'No summary provided',
        rationale: response.rationale || 'No rationale provided',
        specifications: response.specifications || 'No specifications provided'
      },
      committee_suggestion: {
        committee_id: response.suggested_committee_id || null,
        committee: suggestedCommittee || null,
        reasoning: response.committee_reasoning || 'No reasoning provided'
      }
    };
  } catch (error) {
    console.error('Failed to parse committee suggestion response:', cleanContent);
    throw new Error(`Failed to parse committee suggestion response as JSON: ${error.message}`);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 IC GovMind API Proxy Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔑 DeepSeek API: ${DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;