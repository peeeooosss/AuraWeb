import knowledgeData from './knowledge.json';

// Patterns that don't need knowledge base context
const SKIP_PATTERNS = [
  /^(hi|hello|hey|thanks|ok|yes|no|bye|sure|cool|great|nice|good|bad)$/i,
  /^what is \d+\s*[+\-*/^%]\s*\d+$/i,
  /^(how are you|what's up|how's it going)/i,
  /(write|create|generate|make|build|code|function|script|program|debug|fix|refactor)/i,
  /(pdf|ppt|excel|doc|document|report|presentation|spreadsheet|slides)/i,
  /(youtube|video|watch|summarize|transcript)/i,
];

// Check if query is about Indian education topics
const EDUCATION_KEYWORDS = [
  'jee', 'neet', 'adre', 'apsc', 'cbse', 'icse', 'ncert', 'upsc',
  'exam', 'syllabus', 'class', 'chapter', 'study', 'prep', ' preparation',
  'india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata',
  'guwahati', 'assam', 'bihar', 'maharashtra', 'tamil nadu', 'kerala',
  'engineering', 'medical', 'iit', 'nit', 'aiims',
];

export function searchKnowledge(query, topK = 3) {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 2);

  const scored = knowledgeData.map(item => {
    let score = 0;

    item.keywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        score += 2;
      }
    });

    words.forEach(word => {
      item.keywords.forEach(keyword => {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 1;
        }
      });
      if (item.question.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    return { ...item, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function injectContext(query) {
  const lower = query.toLowerCase();

  // Skip injection for simple/non-education queries
  if (SKIP_PATTERNS.some(p => p.test(lower))) {
    return '';
  }

  // Only inject for education-related queries
  const isEducationQuery = EDUCATION_KEYWORDS.some(kw => lower.includes(kw));
  if (!isEducationQuery) {
    return '';
  }

  const relevant = searchKnowledge(query, 2);

  // Only inject if relevance score is high enough
  if (relevant.length === 0 || relevant[0].score < 3) {
    return '';
  }

  // Compress context — single line format to save tokens
  const contextStr = relevant
    .map(r => `${r.question}: ${r.answer}`)
    .join(' | ');

  return `\n\nCONTEXT: ${contextStr}`;
}

export function getAllKnowledge() {
  return knowledgeData;
}

export function getKnowledgeById(id) {
  return knowledgeData.find(item => item.id === id);
}
