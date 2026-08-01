import { MASTER_PROMPT } from './masterPrompt';
import { selectRelevantExamples } from './exampleSelector';

export const PORTAL_OVERRIDES = {
  arena: {
    name: 'Arena',
    prefix: `You are AuraAI Arena — the gamified learning companion for Indian students. You help with exam prep (ADRE, APSC, JEE, NEET), AI lessons, and document generation. Use energetic, motivational language.`,
    capabilities: ['chat', 'documents', 'quizzes', 'leaderboards', 'youtube', 'pdf', 'image', 'xlsx'],
  },

  code: {
    name: 'Code',
    prefix: `You are AuraAI Code — a professional coding assistant. You specialize in full-stack development, debugging, code generation, and architecture decisions. Write clean, production-ready code.`,
    capabilities: ['chat', 'code_generation', 'debugging', 'architecture'],
  },

  educators: {
    name: 'Educators',
    prefix: `You are AuraAI Educators — a teaching assistant for Indian educators. You help create lesson plans, worksheets, quizzes, and presentations for CBSE/ICSE curriculum, Class 5-12.`,
    capabilities: ['chat', 'lesson_plans', 'worksheets', 'presentations', 'youtube', 'pdf', 'image'],
  },

  api: {
    name: 'API',
    prefix: `You are AuraAI API — a technical documentation and integration assistant. You help developers understand API endpoints, authentication, and integration patterns.`,
    capabilities: ['chat', 'documentation', 'code_examples'],
  },
};

function formatExample(ex, index) {
  const outputStr = typeof ex.output === 'string' ? ex.output : JSON.stringify(ex.output ?? '');
  return `Example ${index + 1}:
User: ${ex.input}
AuraAI: ${outputStr.substring(0, 200)}${outputStr.length > 200 ? '...' : ''}`;
}

// Full prompt — used for complex queries (document generation, code gen)
export function buildSystemPrompt(portal, extraContext = '') {
  const override = PORTAL_OVERRIDES[portal];
  const prefix = override ? override.prefix : '';
  const examples = selectRelevantExamples(extraContext || '', 4);
  const examplesStr = examples.map((ex, i) => formatExample(ex, i)).join('\n\n');

  return `${prefix}\n\n${MASTER_PROMPT}\n\nEXAMPLES:\n${examplesStr}\n\nIMPORTANT: Always follow the "RESPONSE FORMAT" section. Use plain text for chat, JSON for document generation.${extraContext}`;
}

// Compact prompt — used for simple chat queries (saves ~70% tokens)
export function buildCompactPrompt(portal, userMessage = '', extraContext = '') {
  const override = PORTAL_OVERRIDES[portal];
  const prefix = override ? override.prefix : '';
  const examples = selectRelevantExamples(userMessage, 2);
  const examplesStr = examples.map((ex, i) => formatExample(ex, i)).join('\n\n');

  return `${prefix}\n\n${MASTER_PROMPT}${examplesStr ? `\n\nEXAMPLES:\n${examplesStr}` : ''}${extraContext}`;
}
