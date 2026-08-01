import { EXAMPLES } from './examples';

// Score an example against the user message
function scoreExample(example, userMessage) {
  const lower = userMessage.toLowerCase();
  const exLower = example.input.toLowerCase();
  let score = 0;

  // Exact word overlap
  const exWords = exLower.split(/\s+/);
  const msgWords = lower.split(/\s+/);
  exWords.forEach(w => {
    if (w.length > 2 && msgWords.includes(w)) score += 2;
    if (w.length > 2 && lower.includes(w)) score += 1;
  });

  // Intent matching
  if (lower.match(/create|generate|write|make|build/) && example.isGenExample) score += 3;
  if (lower.match(/youtube|video|summarize/) && example.input.includes('youtube')) score += 4;
  if (lower.match(/pdf|upload/) && example.input.includes('pdf')) score += 4;
  if (lower.match(/ppt|presentation/) && example.input.includes('ppt')) score += 4;
  if (lower.match(/excel|spreadsheet|xlsx/) && example.input.includes('Panchayat')) score += 4;
  if (lower.match(/code|function|script/) && example.input.includes('function')) score += 3;

  return score;
}

// Select most relevant examples for the user's query
export function selectRelevantExamples(userMessage, count = 3) {
  const scored = EXAMPLES.map(ex => ({
    ...ex,
    score: scoreExample(ex, userMessage),
  }));

  // Always include one gen example if user might want file generation
  const isGenRequest = /create|generate|write|make|build|code|function|script/i.test(userMessage);
  const genExamples = scored.filter(ex => ex.isGenExample);
  const sorted = scored.sort((a, b) => b.score - a.score);

  if (isGenRequest && genExamples.length > 0) {
    // Ensure at least one gen example is included
    const topGen = genExamples.sort((a, b) => b.score - a.score)[0];
    const result = [topGen];
    const rest = sorted.filter(ex => ex.input !== topGen.input).slice(0, count - 1);
    return [...result, ...rest];
  }

  return sorted.slice(0, count);
}
