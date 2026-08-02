import { buildSystemPrompt, buildUserPrompt } from './prompts.js';
import { buildOutlineJsonSchema } from './schema.js';
import { MAX_NUMBER_OF_SLIDES } from './constants.js';

export { buildSystemPrompt, buildUserPrompt, buildOutlineJsonSchema, MAX_NUMBER_OF_SLIDES };

export function buildMessages({
  content,
  nSlides,
  language,
  additionalContext,
  tone,
  verbosity,
  instructions,
  includeTitleSlide = true,
  includeTableOfContents = false,
}) {
  return [
    { role: 'system', content: buildSystemPrompt({ verbosity, includeTitleSlide, includeTableOfContents }) },
    { role: 'user', content: buildUserPrompt({ content, nSlides, language, additionalContext, tone, instructions, includeTitleSlide, includeTableOfContents }) },
  ];
}

export function buildOllamaRequest({
  content,
  nSlides,
  language,
  additionalContext,
  tone,
  verbosity,
  instructions,
  includeTitleSlide = true,
  includeTableOfContents = false,
  model = 'llama3.2',
}) {
  const messages = buildMessages({
    content, nSlides, language, additionalContext,
    tone, verbosity, instructions,
    includeTitleSlide, includeTableOfContents,
  });

  return {
    model,
    messages,
    stream: false,
    format: buildOutlineJsonSchema(nSlides),
    options: {
      temperature: 0.7,
      num_predict: 4096,
    },
  };
}

export async function generateOutlineFromOllama(params, ollamaUrl = 'http://localhost:11434') {
  const requestBody = buildOllamaRequest(params);

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  try {
    return JSON.parse(result.response);
  } catch {
    return { title: '', slides: [], raw: result.response };
  }
}
