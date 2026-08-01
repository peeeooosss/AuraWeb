export const CATEGORIES = [
  { id: 'all', label: 'All', color: 'cyan' },
  { id: 'ai-basics', label: 'AI Basics', color: 'violet' },
  { id: 'prompting', label: 'Prompting', color: 'amber' },
  { id: 'coding', label: 'Coding', color: 'green' },
  { id: 'career', label: 'Career', color: 'rose' },
  { id: 'exam-prep', label: 'Exam Prep', color: 'cyan' },
];

export const LESSONS = [
  // ── AI Basics (6) ──
  {
    id: 'ai-01',
    title: 'What is Artificial Intelligence?',
    category: 'ai-basics',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'Understand the fundamentals of AI — what it is, how it works, and why it matters.',
    content: `
# What is Artificial Intelligence?

Artificial Intelligence (AI) is the simulation of human intelligence by machines. It encompasses everything from voice assistants like Alexa to self-driving cars.

## Types of AI

**Narrow AI** — Systems designed for a specific task (e.g., chess engines, recommendation algorithms). This is what we have today.

**General AI** — Machines that can perform any intellectual task a human can. This doesn't exist yet.

**Super AI** — Hypothetical AI that surpasses human intelligence. Still theoretical.

## How AI Learns

AI systems learn through **training data**. They find patterns in large datasets and use those patterns to make decisions.

\`\`\`
Input Data → Algorithm → Pattern Recognition → Output
\`\`\`

For example, to teach an AI to recognize cats:
1. Show it millions of cat photos
2. It learns patterns (ears, whiskers, eyes)
3. New photo → It predicts "cat" or "not cat"

## Why AI Matters for You

- **Job Market**: AI skills are in high demand across every industry
- **Productivity**: AI tools can 10x your output
- **Problem Solving**: Understanding AI helps you think systematically
    `,
    quiz: [
      {
        question: 'What is Narrow AI?',
        options: ['AI that is very smart', 'AI designed for a specific task', 'AI that can do everything', 'AI that has been narrowed down'],
        correct: 1,
        explanation: 'Narrow AI is designed for a specific task — like playing chess or recognizing faces. It cannot do general tasks.',
      },
      {
        question: 'How does AI learn?',
        options: ['By reading books', 'Through training data and pattern recognition', 'By asking humans', 'It is born knowing everything'],
        correct: 1,
        explanation: 'AI learns by analyzing large datasets and finding patterns in the data.',
      },
    ],
  },
  {
    id: 'ai-02',
    title: 'Machine Learning vs Deep Learning',
    category: 'ai-basics',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Learn the difference between ML and DL, and when each is used.',
    content: `
# Machine Learning vs Deep Learning

## Machine Learning (ML)

ML is a subset of AI where systems learn from data without being explicitly programmed.

**How it works:**
- You feed data into an algorithm
- The algorithm finds patterns
- It makes predictions on new data

**Examples:**
- Spam filters (learns what spam looks like)
- Netflix recommendations (learns your preferences)
- Credit scoring (learns risk patterns)

## Deep Learning (DL)

DL is a subset of ML that uses **neural networks** with multiple layers (hence "deep").

**How it works:**
- Data passes through multiple layers of neurons
- Each layer learns increasingly complex features
- Final layer makes the prediction

**Examples:**
- ChatGPT (understands and generates language)
- Face recognition (identifies faces in photos)
- Self-driving cars (understands road scenes)

## Key Differences

| Feature | Machine Learning | Deep Learning |
|---------|-----------------|---------------|
| Data needed | Less | Much more |
| Hardware | CPU is fine | Needs GPUs |
| Interpretability | Easier to understand | Black box |
| Performance | Good for structured data | Best for unstructured (images, text) |

## When to Use What

- **ML**: Small datasets, structured data, need explainability
- **DL**: Large datasets, images/text/audio, maximum accuracy needed
    `,
    quiz: [
      {
        question: 'Deep Learning uses what structure?',
        options: ['Decision trees', 'Neural networks with multiple layers', 'Simple linear regression', 'Random forests'],
        correct: 1,
        explanation: 'Deep Learning uses neural networks with multiple layers (hence "deep") to learn complex patterns.',
      },
      {
        question: 'Which needs more data — ML or DL?',
        options: ['Machine Learning', 'Deep Learning', 'Both need the same', 'Neither needs data'],
        correct: 1,
        explanation: 'Deep Learning requires significantly more data than traditional Machine Learning to train effectively.',
      },
    ],
  },
  {
    id: 'ai-03',
    title: 'How Large Language Models Work',
    category: 'ai-basics',
    duration: '6 min',
    xp: 30,
    difficulty: 'intermediate',
    summary: 'Understand how GPT, Claude, and other LLMs process and generate text.',
    content: `
# How Large Language Models Work

## What is an LLM?

A Large Language Model (LLM) is an AI trained on massive amounts of text data to understand and generate human language. Examples: GPT-4, Claude, Gemini, Llama.

## The Training Process

### Step 1: Pre-training
- Read billions of pages of text
- Learn grammar, facts, reasoning patterns
- Predict the next word in a sentence billions of times

### Step 2: Fine-tuning
- Learn to follow instructions
- Learn to be helpful and safe
- Practice with human feedback (RLHF)

### Step 3: Inference
- You type a prompt
- The model predicts the most likely next token (word piece)
- Repeats until it generates a complete response

## Token Prediction Example

\`\`\`
Input: "The capital of Assam is"
Model thinks: "Guwati" (99.2%), "Dispur" (0.5%), "Shillong" (0.2%)
Output: "Guwahati"
\`\`\`

## Context Window

LLMs have a "context window" — the maximum amount of text they can consider at once.

- GPT-4: 128K tokens (~96,000 words)
- Claude 3: 200K tokens (~150,000 words)
- Llama 3: 8K tokens (~6,000 words)

## Limitations

- **Hallucination**: Can generate false information confidently
- **Knowledge cutoff**: Doesn't know recent events
- **No true understanding**: Pattern matching, not comprehension
- **Bias**: Reflects biases in training data
    `,
    quiz: [
      {
        question: 'What does an LLM do during inference?',
        options: ['It trains on new data', 'It predicts the next token in a sequence', 'It downloads information from the internet', 'It asks a human for help'],
        correct: 1,
        explanation: 'During inference, an LLM predicts the most likely next token (piece of a word) to generate text.',
      },
      {
        question: 'What is a limitation of LLMs?',
        options: ['They are always accurate', 'They can hallucinate information', 'They have unlimited context', 'They never make mistakes'],
        correct: 1,
        explanation: 'LLMs can hallucinate — generate false information confidently — because they are predicting patterns, not retrieving facts.',
      },
    ],
  },
  {
    id: 'ai-04',
    title: 'AI Tools You Should Know',
    category: 'ai-basics',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'A practical guide to the most useful AI tools for students and professionals.',
    content: `
# AI Tools You Should Know

## Text & Writing

| Tool | What It Does | Free? |
|------|-------------|-------|
| ChatGPT | General AI assistant, writing, coding | Yes (GPT-3.5) |
| Claude | Long-form writing, analysis, coding | Yes |
| Grammarly | Grammar checking, tone adjustment | Yes (basic) |

## Image Generation

| Tool | What It Does | Free? |
|------|-------------|-------|
| FLUX | High-quality image generation | Yes |
| DALL-E | OpenAI's image generator | With ChatGPT Plus |
| Midjourney | Artistic image generation | No ($10/mo) |

## Coding

| Tool | What It Does | Free? |
|------|-------------|-------|
| GitHub Copilot | Code completion in your editor | Yes (students) |
| Cursor | AI-first code editor | Yes (basic) |
| Replit AI | Code generation in browser | Yes (limited) |

## Productivity

| Tool | What It Does | Free? |
|------|-------------|-------|
| Notion AI | Smart notes and summaries | With Notion |
| Perplexity | AI search engine with sources | Yes (basic) |
| Otter.ai | Meeting transcription | Yes (limited) |

## How to Choose

1. **Start with free tiers** — Most tools offer generous free plans
2. **Learn one tool deeply** — Master ChatGPT before exploring others
3. **Combine tools** — Use ChatGPT for writing + FLUX for images
4. **Stay updated** — New tools launch every week
    `,
    quiz: [
      {
        question: 'Which tool is best for AI image generation?',
        options: ['ChatGPT', 'FLUX', 'Grammarly', 'Notion AI'],
        correct: 1,
        explanation: 'FLUX is a dedicated AI image generation tool. ChatGPT is for text, Grammarly for grammar, Notion for notes.',
      },
      {
        question: 'What should you do first when exploring AI tools?',
        options: ['Pay for the most expensive plan', 'Start with free tiers', 'Use all tools at once', 'Avoid free tools'],
        correct: 1,
        explanation: 'Start with free tiers to learn what each tool does before committing to paid plans.',
      },
    ],
  },
  {
    id: 'ai-05',
    title: 'Ethics of AI',
    category: 'ai-basics',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Explore the ethical questions surrounding AI — bias, privacy, jobs, and responsibility.',
    content: `
# Ethics of AI

## Why AI Ethics Matters

AI is increasingly making decisions that affect lives — loan approvals, hiring, criminal justice. If these systems are biased or unfair, real people suffer.

## Key Ethical Issues

### 1. Bias & Fairness
AI learns from historical data. If that data contains bias, the AI perpetuates it.

**Real example**: An AI hiring tool trained on 10 years of data from a male-dominated company learned to penalize resumes with the word "women's" (like "women's chess club").

### 2. Privacy
AI needs data to function. But how much data is too much?

**Questions to ask:**
- Who owns my data?
- How is it being used?
- Can I opt out?

### 3. Job Displacement
AI will automate many jobs. But it will also create new ones.

**Jobs at risk:** Data entry, basic customer service, simple coding
**Jobs being created:** AI trainers, prompt engineers, AI ethics officers

### 4. Misinformation
AI can generate fake photos, videos (deepfakes), and text at scale.

### 5. Accountability
When AI makes a mistake, who is responsible? The developer? The company? The user?

## Responsible AI Use

- **Verify** AI outputs before using them
- **Credit** AI when it helps with your work
- **Protect** your personal data
- **Question** AI decisions that affect you
- **Stay informed** about AI capabilities and limitations
    `,
    quiz: [
      {
        question: 'Why can AI systems be biased?',
        options: ['AI is inherently racist', 'They learn from biased historical data', 'Computers have opinions', 'Bias is randomly generated'],
        correct: 1,
        explanation: 'AI systems learn from historical data. If that data contains biases (racial, gender, etc.), the AI perpetuates those biases.',
      },
      {
        question: 'What should you do with AI outputs?',
        options: ['Use them without checking', 'Verify before using them', 'Ignore them completely', 'Share them immediately'],
        correct: 1,
        explanation: 'Always verify AI outputs before using them. AI can hallucinate, be biased, or produce incorrect information.',
      },
    ],
  },
  {
    id: 'ai-06',
    title: 'AI in India — Current Landscape',
    category: 'ai-basics',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'How AI is being used in India — from agriculture to governance.',
    content: `
# AI in India — Current Landscape

## Government Initiatives

### IndiaAI Mission
- ₹10,000 crore investment in AI infrastructure
- Building compute capacity for Indian AI startups
- Focus on Indian language processing

### Digital India + AI
- AI-powered land records in Karnataka
- Crop disease detection apps for farmers
- Traffic management in Hyderabad using AI

## AI in Indian Industries

### Agriculture
- **CropIn**: AI-powered farm management
- **Microsoft AI Sowing**: Predicts best sowing time
- Crop disease detection via smartphone cameras

### Healthcare
- **Qure.ai**: AI for medical imaging (X-rays, CT scans)
- **Niramai**: Breast cancer screening using AI
- Telemedicine platforms with AI triage

### Education
- **BYJU'S**: Personalized learning with AI
- **Vedantu**: AI-powered test preparation
- **AuraAI**: Gamified AI learning (that's us!)

### Finance
- **PhonePe/Google Pay**: Fraud detection with AI
- **ZestAI**: Credit scoring for underserved populations
- Chatbots for customer service in 10+ Indian languages

## Opportunities for You

- **AI jobs in India** grew 74% in 2024
- **Average AI salary**: ₹15-25 LPA (entry level)
- **High-demand roles**: ML Engineer, Data Scientist, AI Product Manager
- **Start here**: Learn Python → ML basics → Build projects → Apply
    `,
    quiz: [
      {
        question: 'How much has the Indian government invested in AI through the IndiaAI Mission?',
        options: ['₹1,000 crore', '₹5,000 crore', '₹10,000 crore', '₹50,000 crore'],
        correct: 2,
        explanation: 'The IndiaAI Mission has allocated ₹10,000 crore for building AI infrastructure in India.',
      },
      {
        question: 'Which sector uses AI for crop disease detection?',
        options: ['Finance', 'Healthcare', 'Agriculture', 'Education'],
        correct: 2,
        explanation: 'Agriculture uses AI-powered smartphone apps for detecting crop diseases, helping farmers identify problems early.',
      },
    ],
  },

  // ── Prompting (6) ──
  {
    id: 'prompt-01',
    title: 'Prompt Engineering Fundamentals',
    category: 'prompting',
    duration: '5 min',
    xp: 30,
    difficulty: 'beginner',
    summary: 'The foundation of getting great results from AI — how to write effective prompts.',
    content: `
# Prompt Engineering Fundamentals

## What is a Prompt?

A prompt is the instruction you give to an AI. The quality of your prompt directly determines the quality of the output.

**Bad prompt:** "Write about dogs"
**Good prompt:** "Write a 200-word guide for first-time dog owners in India, covering feeding, exercise, and common health issues"

## The CLEAR Framework

**C** — Context: Give background information
**L** — Length: Specify how long you want
**E** — Examples: Show what you want
**A** — Action: State what to do
**R** — Role: Tell the AI who to be

## Example

\`\`\`
Role: You are a senior UPSC examiner
Context: I am preparing for the Prelims exam
Action: Create 5 MCQs on Indian Polity (Fundamental Rights)
Length: Each question should have 4 options with one correct answer
Examples: 
Q: Which Article guarantees Right to Equality?
A) Art 12  B) Art 14  C) Art 19  D) Art 21
Answer: B) Art 14
\`\`\`

## Common Mistakes

1. **Too vague**: "Help me study" → "Create a 7-day study plan for JEE Physics"
2. **Too long**: AI gets confused by contradictory instructions
3. **No format**: Always specify output format (list, table, essay, etc.)
4. **No examples**: Show one example of what you want
    `,
    quiz: [
      {
        question: 'What does the "R" in the CLEAR framework stand for?',
        options: ['Result', 'Role', 'Research', 'Review'],
        correct: 1,
        explanation: 'R stands for Role — telling the AI who to be (e.g., "You are a senior UPSC examiner").',
      },
      {
        question: 'Which is a better prompt?',
        options: ['"Help me study"', '"Create a 7-day JEE Physics study plan"', '"Tell me about physics"', '"Study tips"'],
        correct: 1,
        explanation: 'A good prompt is specific: it mentions the subject (JEE Physics), format (7-day plan), and action (create).',
      },
    ],
  },
  {
    id: 'prompt-02',
    title: 'Chain-of-Thought Prompting',
    category: 'prompting',
    duration: '5 min',
    xp: 30,
    difficulty: 'intermediate',
    summary: 'Teach AI to think step-by-step for better reasoning and complex problem-solving.',
    content: `
# Chain-of-Thought Prompting

## What is Chain-of-Thought (CoT)?

CoT is a prompting technique that makes AI show its reasoning process before giving a final answer. It dramatically improves accuracy on complex problems.

## How It Works

**Without CoT:**
\`\`\`
Q: If a train travels 120 km in 2 hours, what's its speed?
A: 60 km/h ✓
\`\`\`

**With CoT (for harder problems):**
\`\`\`
Q: A train leaves Delhi at 9 AM traveling at 80 km/h. Another train leaves Mumbai at 10 AM traveling at 100 km/h toward Delhi. The distance is 1,400 km. When do they meet?

Let me think step by step:
1. By 10 AM, the Delhi train has traveled: 80 × 1 = 80 km
2. Remaining distance: 1,400 - 80 = 1,320 km
3. Combined speed: 80 + 100 = 180 km/h
4. Time to meet: 1,320 / 180 = 7.33 hours after 10 AM
5. They meet at approximately 5:20 PM
\`\`\`

## When to Use CoT

- Math and logic problems
- Multi-step reasoning
- Complex analysis
- When accuracy matters more than speed

## How to Trigger CoT

Add these to your prompt:
- "Think step by step"
- "Show your reasoning"
- "Break this down into steps"
- "Let's work through this systematically"
    `,
    quiz: [
      {
        question: 'What does Chain-of-Thought prompting do?',
        options: ['Makes AI faster', 'Makes AI show its reasoning process', 'Makes AI shorter', 'Makes AI funnier'],
        correct: 1,
        explanation: 'CoT makes AI show its step-by-step reasoning before giving a final answer, improving accuracy on complex problems.',
      },
      {
        question: 'Which phrase triggers Chain-of-Thought?',
        options: ['"Be creative"', '"Think step by step"', '"Be brief"', '"Use emojis"'],
        correct: 1,
        explanation: '"Think step by step" is one of the most effective phrases to trigger chain-of-thought reasoning in AI.',
      },
    ],
  },
  {
    id: 'prompt-03',
    title: 'Few-Shot Prompting',
    category: 'prompting',
    duration: '4 min',
    xp: 25,
    difficulty: 'intermediate',
    summary: 'Use examples to teach AI exactly what output format and style you want.',
    content: `
# Few-Shot Prompting

## What is Few-Shot Prompting?

Instead of explaining what you want, you show the AI 2-5 examples of the exact output format. The AI then follows the pattern.

## Zero-Shot vs Few-Shot

**Zero-shot (no examples):**
\`\`\`
Classify this review as positive or negative:
"The food was amazing but the service was terrible"
\`\`\`

**Few-shot (with examples):**
\`\`\`
Classify reviews as positive, negative, or mixed.

Review: "Loved the ambiance, food was okay" → Mixed
Review: "Best meal I've had in years!" → Positive
Review: "Overpriced and underwhelming" → Negative

Now classify: "The food was amazing but the service was terrible"
\`\`\`

## When to Use Few-Shot

- Custom formats (specific JSON structure, particular writing style)
- Classification tasks
- When you need consistent output format
- Domain-specific terminology

## Pro Tips

1. **3-5 examples** is the sweet spot
2. **Include edge cases** in your examples
3. **Vary the examples** — don't just show one type
4. **Keep examples concise** — the AI learns the pattern quickly
    `,
    quiz: [
      {
        question: 'How many examples should you provide in few-shot prompting?',
        options: ['1', '3-5', '20', '100'],
        correct: 1,
        explanation: '3-5 examples is the sweet spot — enough to show the pattern without overwhelming the AI.',
      },
      {
        question: 'When is few-shot prompting most useful?',
        options: ['For simple questions', 'When you need a specific output format', 'When you want shorter answers', 'For creative writing'],
        correct: 1,
        explanation: 'Few-shot prompting is most useful when you need a specific output format or style that is hard to describe in words.',
      },
    ],
  },
  {
    id: 'prompt-04',
    title: 'Writing Prompts for Exams',
    category: 'prompting',
    duration: '6 min',
    xp: 35,
    difficulty: 'intermediate',
    summary: 'Specific prompting strategies for UPSC, APSC, JEE, NEET, and ADRE preparation.',
    content: `
# Writing Prompts for Exam Preparation

## UPSC/APSC Prompts

### Current Affairs Analysis
\`\`\`
Role: UPSC examiner with 20 years experience
Task: Analyze today's news about [topic]
Format:
1. What happened (2-3 lines)
2. Why it matters for UPSC (specific syllabus link)
3. Possible mains question
4. Model answer (150 words)
\`\`\`

### Essay Planning
\`\`\`
Topic: "Women empowerment in rural India"
Create an essay outline with:
- Introduction (hook + context)
- 5 body paragraphs with sub-points
- Conclusion with way forward
Include: Constitutional provisions, government schemes, data points, and way forward
\`\`\`

## JEE/NEET Prompts

### Concept Explanation
\`\`\`
Explain [Newton's Third Law] like I'm a JEE aspirant.
Include:
1. Core concept in 3 lines
2. Common misconceptions
3. 3 solved examples (easy → medium → hard)
4. One trick that saves time in exams
\`\`\`

### Problem Generation
\`\`\`
Generate 10 JEE-level problems on [Organic Chemistry: Alcohols].
Difficulty: 3 Easy, 4 Medium, 3 Hard
Include solutions with step-by-step reasoning
\`\`\`

## ADRE Prompts

### Quick Revision
\`\`\`
Create a revision sheet for ADRE Grade III covering:
- 20 one-liner GK facts about Assam
- 10 computer shortcuts every government employee should know
- 5 current affairs questions from last 3 months
Format as bullet points for quick revision
\`\`\`
    `,
    quiz: [
      {
        question: 'Why should you specify a role in exam prompts?',
        options: ['It makes the response longer', 'It helps AI give more targeted, expert-level responses', 'It is required by the AI', 'It makes no difference'],
        correct: 1,
        explanation: 'Specifying a role (e.g., "UPSC examiner with 20 years experience") helps AI tailor its response to your specific needs.',
      },
      {
        question: 'What difficulty mix is recommended for practice problems?',
        options: ['All easy', 'All hard', 'Easy → Medium → Hard progression', 'Random difficulty'],
        correct: 2,
        explanation: 'A mix of 3 Easy, 4 Medium, 3 Hard problems provides a natural learning progression.',
      },
    ],
  },
  {
    id: 'prompt-05',
    title: 'AI for Content Creation',
    category: 'prompting',
    duration: '5 min',
    xp: 30,
    difficulty: 'beginner',
    summary: 'Use AI to create social media content, presentations, and marketing materials.',
    content: `
# AI for Content Creation

## Social Media Content

### Instagram Post
\`\`\`
Create an Instagram carousel post about "5 AI tools every college student should know"
Format:
- Slide 1: Hook headline + eye-catching subtext
- Slides 2-6: One tool per slide with name, what it does, why it matters
- Final slide: CTA (save + share)
Tone: Gen Z, energetic, informative
Length: 15-20 words per slide
\`\`\`

### LinkedIn Post
\`\`\`
Write a LinkedIn post about my experience learning AI in college.
Context: I'm a 3rd year CS student from Assam
Angle: How AI skills opened up internship opportunities
Tone: Professional but relatable
Length: 150-200 words
Include: 3 relevant hashtags
\`\`\`

## Presentations

### Slide Deck
\`\`\`
Create a 10-slide presentation on "AI in Indian Healthcare"
Slide structure:
- Title slide
- Problem statement (with data)
- 7 content slides (one per use case)
- Conclusion with future outlook
Include speaker notes for each slide
\`\`\`

## Resume & Cover Letter

### Resume Bullet Points
\`\`\`
Rewrite these job responsibilities as strong resume bullet points:
"I managed the college website"
"I used Python for data analysis"
"I helped organize the tech fest"
Format: Action verb + What you did + Result/Impact
\`\`\`
    `,
    quiz: [
      {
        question: 'What makes a good Instagram carousel prompt?',
        options: ['Just saying "make an Instagram post"', 'Specifying slide count, tone, word count, and CTA', 'Using as few words as possible', 'Not mentioning the platform'],
        correct: 1,
        explanation: 'A good prompt specifies the format (carousel), structure (slide count), tone (Gen Z), length (15-20 words), and CTA.',
      },
      {
        question: 'How should resume bullet points be formatted?',
        options: ['As a paragraph', 'Action verb + What you did + Result/Impact', 'As a simple list', 'As a question'],
        correct: 1,
        explanation: 'Strong resume bullets follow the format: Action verb + What you did + Result/Impact.',
      },
    ],
  },
  {
    id: 'prompt-06',
    title: 'Advanced Prompt Techniques',
    category: 'prompting',
    duration: '7 min',
    xp: 40,
    difficulty: 'advanced',
    summary: 'Master persona assignment, constraint-based prompts, and iterative refinement.',
    content: `
# Advanced Prompt Techniques

## 1. Persona Assignment

Go beyond "You are X" — assign a detailed persona.

\`\`\`
You are Dr. Priya Sharma, a senior data scientist at Google India with 12 years of experience. You've mentored 50+ junior data scientists. You explain concepts using Indian examples and analogies. You're direct, practical, and occasionally funny.
\`\`\`

## 2. Constraint-Based Prompts

Set explicit constraints to control output.

\`\`\`
Write a product description for an AI learning app.
Constraints:
- Max 100 words
- Must mention: gamification, AI-powered, affordable
- Tone: Professional but not boring
- No buzzwords: "revolutionary", "game-changing", "cutting-edge"
- Must include one concrete example of what users can do
\`\`\`

## 3. Iterative Refinement

Don't accept the first output — refine it.

\`\`\`
Prompt 1: "Write a tagline for an AI learning platform"
→ AI generates options

Prompt 2: "Make #3 shorter and more punchy"
→ AI refines

Prompt 3: "Now create 5 variations of this tagline"
→ AI expands

Prompt 4: "Which one would work best for Indian college students and why?"
→ AI analyzes
\`\`\`

## 4. Meta-Prompting

Ask AI to write prompts for you.

\`\`\`
I want to create a quiz about Indian history for ADRE preparation.
Write 5 prompts that I can use with AI to generate:
1. One-liner GK questions
2. Map-based questions
3. Timeline-based questions
4. Match-the-column questions
5. Assertion-reason questions
\`\`\`

## 5. Chain Prompting

Break complex tasks into a chain of simpler prompts.

\`\`\`
Step 1: "List the top 10 topics in JEE Physics"
Step 2: "For topic #3, create a concept summary"
Step 3: "Generate 5 practice problems for this concept"
Step 4: "Create a quick revision sheet from these problems"
\`\`\`
    `,
    quiz: [
      {
        question: 'What is meta-prompting?',
        options: ['Using a meta AI model', 'Asking AI to write prompts for you', 'Using multiple AI tools', 'Writing very long prompts'],
        correct: 1,
        explanation: 'Meta-prompting is asking AI to generate prompts for specific tasks — AI writing prompts for you to use.',
      },
      {
        question: 'What is the benefit of chain prompting?',
        options: ['It is faster', 'It breaks complex tasks into simpler steps', 'It uses less tokens', 'It is required by AI'],
        correct: 1,
        explanation: 'Chain prompting breaks complex tasks into a series of simpler prompts, each building on the previous output.',
      },
    ],
  },

  // ── Coding (6) ──
  {
    id: 'code-01',
    title: 'Python for Beginners',
    category: 'coding',
    duration: '6 min',
    xp: 30,
    difficulty: 'beginner',
    summary: 'Start your coding journey with Python — the easiest and most versatile language.',
    content: `
# Python for Beginners

## Why Python?

- **Easy to learn** — Reads like English
- **Versatile** — Web, data science, AI, automation
- **High demand** — #1 language for AI/ML jobs
- **Huge community** — Help is always available

## Your First Python Program

\`\`\`python
# This is a comment
print("Hello, World!")
\`\`\`

Output: \`Hello, World!\`

## Variables & Data Types

\`\`\`python
# Strings
name = "Aniket"
greeting = f"Hello, {name}!"

# Numbers
age = 21
gpa = 8.5

# Boolean
is_student = True

# Lists
skills = ["Python", "AI", "Excel"]
skills.append("SQL")  # Add to list
\`\`\`

## Conditionals

\`\`\`python
marks = 85

if marks >= 90:
    grade = "A+"
elif marks >= 80:
    grade = "A"
elif marks >= 70:
    grade = "B"
else:
    grade = "C"

print(f"Your grade is {grade}")
\`\`\`

## Loops

\`\`\`python
# For loop
for i in range(5):
    print(f"Question {i + 1}")

# While loop
count = 0
while count < 3:
    print(f"Attempt {count + 1}")
    count += 1
\`\`\`

## Functions

\`\`\`python
def calculate_score(correct, total):
    percentage = (correct / total) * 100
    return round(percentage, 1)

score = calculate_score(8, 10)
print(f"Your score: {score}%")  # Your score: 80.0%
\`\`\`
    `,
    quiz: [
      {
        question: 'What is the output of print(type(42))?',
        options: ["<class 'str'>", "<class 'int'>", "<class 'float'>", "<class 'bool'>"],
        correct: 1,
        explanation: '42 is an integer, so type(42) returns <class "int">.',
      },
      {
        question: 'How do you add an item to a list in Python?',
        options: ['list.add()', 'list.append()', 'list.insert()', 'list.push()'],
        correct: 1,
        explanation: 'list.append() adds an item to the end of a list.',
      },
    ],
  },
  {
    id: 'code-02',
    title: 'JavaScript Basics',
    category: 'coding',
    duration: '6 min',
    xp: 30,
    difficulty: 'beginner',
    summary: 'Learn the language of the web — essential for web development and frontend projects.',
    content: `
# JavaScript Basics

## Why JavaScript?

- **Language of the web** — Every website uses it
- **Full-stack** — Frontend + Backend (Node.js)
- **Mobile apps** — React Native
- **Highest demand** — Most job listings require JS

## Your First JavaScript Program

\`\`\`javascript
// This is a comment
console.log("Hello, World!");
\`\`\`

## Variables

\`\`\`javascript
// Use 'const' for values that don't change
const name = "Aniket";
const PI = 3.14159;

// Use 'let' for values that change
let score = 0;
score = score + 10;

// Don't use 'var' (old syntax)
\`\`\`

## Data Types

\`\`\`javascript
const text = "Hello";        // String
const number = 42;           // Number
const decimal = 3.14;        // Number (no separate float)
const isActive = true;       // Boolean
const nothing = null;        // Null
const notDefined = undefined; // Undefined
const items = [1, 2, 3];    // Array
\`\`\`

## Functions

\`\`\`javascript
// Arrow function (modern)
const greet = (name) => {
    return \`Hello, \${name}!\`;
};

// Short version
const add = (a, b) => a + b;

console.log(greet("Aniket")); // Hello, Aniket!
console.log(add(5, 3));       // 8
\`\`\`

## Arrays

\`\`\`javascript
const quizzes = ["ADRE", "JEE", "NEET", "APSC"];

// Map — transform each item
const upper = quizzes.map(q => q.toUpperCase());
// ["ADRE", "JEE", "NEET", "APSC"]

// Filter — keep items that match
const short = quizzes.filter(q => q.length <= 3);
// ["JEE"]

// Find — first match
const jee = quizzes.find(q => q === "JEE");
// "JEE"
\`\`\`
    `,
    quiz: [
      {
        question: 'Which keyword should you use for a constant value in JavaScript?',
        options: ['var', 'let', 'const', 'define'],
        correct: 2,
        explanation: 'Use "const" for values that won\'t change. Use "let" for values that will change. Avoid "var".',
      },
      {
        question: 'What does array.map() do?',
        options: ['Removes items from an array', 'Transforms each item and returns a new array', 'Sorts the array', 'Combines two arrays'],
        correct: 1,
        explanation: 'map() transforms each element of an array and returns a new array with the transformed values.',
      },
    ],
  },
  {
    id: 'code-03',
    title: 'HTML & CSS Crash Course',
    category: 'coding',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Build your first webpage — the building blocks of every website on the internet.',
    content: `
# HTML & CSS Crash Course

## HTML — Structure

HTML defines the structure of a webpage.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Aniket Kumar</h1>
        <p>Aspiring Data Scientist</p>
    </header>
    
    <section id="skills">
        <h2>Skills</h2>
        <ul>
            <li>Python</li>
            <li>Machine Learning</li>
            <li>Excel</li>
        </ul>
    </section>
    
    <footer>
        <p>Contact: aniket@email.com</p>
    </footer>
</body>
</html>
\`\`\`

## CSS — Style

CSS makes your HTML look good.

\`\`\`css
/* Reset */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* Body */
body {
    font-family: 'Inter', sans-serif;
    background: #0a0e14;
    color: #e9eef5;
    line-height: 1.6;
}

/* Header */
header {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
}

h1 {
    font-size: 2.5rem;
    background: linear-gradient(90deg, #2ff3e0, #b14eff);
    -webkit-background-clip: text;
    color: transparent;
}

/* Skills Section */
#skills {
    max-width: 600px;
    margin: 40px auto;
    padding: 0 20px;
}

li {
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
\`\`\`

## Key HTML Tags

- \`<h1>-<h6>\` — Headings
- \`<p>\` — Paragraph
- \`<a href="...">\` — Links
- \`<img src="...">\` — Images
- \`<div>\` — Container (generic)
- \`<span>\` — Inline container
    `,
    quiz: [
      {
        question: 'What does HTML stand for?',
        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'],
        correct: 0,
        explanation: 'HTML stands for Hyper Text Markup Language — it is the standard markup language for web pages.',
      },
      {
        question: 'What does CSS stand for?',
        options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'],
        correct: 1,
        explanation: 'CSS stands for Cascading Style Sheets — it controls the visual presentation of HTML elements.',
      },
    ],
  },
  {
    id: 'code-04',
    title: 'SQL for Data Analysis',
    category: 'coding',
    duration: '6 min',
    xp: 35,
    difficulty: 'intermediate',
    summary: 'Query databases like a pro — essential for data analyst and backend roles.',
    content: `
# SQL for Data Analysis

## Why SQL?

- **Universal** — Every company uses databases
- **Powerful** — Handle millions of rows efficiently
- **Required** — Essential for data analyst roles
- **Complements Python** — Use both for maximum impact

## Basic Queries

\`\`\`sql
-- Select specific columns
SELECT name, marks FROM students;

-- Filter rows
SELECT * FROM students WHERE marks > 80;

-- Sort results
SELECT * FROM students ORDER BY marks DESC;

-- Limit results
SELECT * FROM students LIMIT 10;
\`\`\`

## Aggregate Functions

\`\`\`sql
-- Count rows
SELECT COUNT(*) FROM students;

-- Average
SELECT AVG(marks) FROM students WHERE course = 'B.Tech';

-- Group by
SELECT course, AVG(marks) as avg_marks
FROM students
GROUP BY course
ORDER BY avg_marks DESC;
\`\`\`

## JOINs (Combining Tables)

\`\`\`sql
-- Students + Scores (INNER JOIN)
SELECT s.name, sc.score
FROM students s
INNER JOIN scores sc ON s.id = sc.student_id;

-- All students + their scores (LEFT JOIN)
SELECT s.name, COALESCE(sc.score, 0) as score
FROM students s
LEFT JOIN scores sc ON s.id = sc.student_id;
\`\`\`

## Real-World Example

\`\`\`sql
-- Top 5 students in each course
SELECT course, name, marks
FROM (
    SELECT 
        course, 
        name, 
        marks,
        ROW_NUMBER() OVER (PARTITION BY course ORDER BY marks DESC) as rank
    FROM students
) ranked
WHERE rank <= 5;
\`\`\`
    `,
    quiz: [
      {
        question: 'What does SQL stand for?',
        options: ['Structured Query Language', 'Simple Query Logic', 'Standard Question Language', 'System Query Lookup'],
        correct: 0,
        explanation: 'SQL stands for Structured Query Language — the standard language for managing relational databases.',
      },
      {
        question: 'What does GROUP BY do?',
        options: ['Deletes duplicates', 'Groups rows with same values for aggregation', 'Sorts the table', 'Creates a new table'],
        correct: 1,
        explanation: 'GROUP BY groups rows that have the same values in specified columns, allowing aggregate functions like COUNT, AVG, SUM.',
      },
    ],
  },
  {
    id: 'code-05',
    title: 'Git & GitHub Essentials',
    category: 'coding',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Version control for your code — essential for collaboration and portfolio building.',
    content: `
# Git & GitHub Essentials

## What is Git?

Git is a **version control system** — it tracks changes to your code over time. Think of it as infinite undo/redo for your project.

## What is GitHub?

GitHub is a website where you store your Git repositories online. It's also social media for developers.

## Essential Commands

\`\`\`bash
# Start a new project
git init
git add .
git commit -m "First commit"

# Daily workflow
git add .              # Stage changes
git commit -m "Add quiz feature"  # Commit with message
git push               # Push to GitHub

# Branching (working on features)
git checkout -b feature/quiz    # Create new branch
# ... make changes ...
git add . && git commit -m "Add quiz setup"
git checkout main               # Switch back
git merge feature/quiz          # Merge feature

# Collaboration
git pull                 # Get latest changes
git clone <url>          # Download a repo
\`\`\`

## .gitignore

Tell Git which files to ignore:

\`\`\`
# .gitignore
node_modules/
.env
*.log
dist/
\`\`\`

## README.md

Every project needs one:

\`\`\`markdown
# Project Name

Brief description of what this project does.

## Features
- Feature 1
- Feature 2

## Tech Stack
- React
- Tailwind CSS

## How to Run
\`\`\`bash
npm install
npm run dev
\`\`\`
\`\`\`

## Pro Tips

1. **Commit often** — Small, focused commits
2. **Write good messages** — "Fix login bug" not "Update"
3. **Use branches** — Never work directly on main
4. **Pin your best repos** — They're your portfolio
    `,
    quiz: [
      {
        question: 'What is the correct git workflow?',
        options: ['push → commit → add', 'add → commit → push', 'commit → add → push', 'add → push → commit'],
        correct: 1,
        explanation: 'The correct workflow is: git add (stage) → git commit (save) → git push (upload to GitHub).',
      },
      {
        question: 'What is a .gitignore file?',
        options: ['A file that ignores errors', 'A file listing files Git should not track', 'A file that deletes old commits', 'A configuration file for GitHub'],
        correct: 1,
        explanation: '.gitignore tells Git which files/folders to skip (like node_modules, .env, etc.).',
      },
    ],
  },
  {
    id: 'code-06',
    title: 'API Basics for Beginners',
    category: 'coding',
    duration: '5 min',
    xp: 30,
    difficulty: 'intermediate',
    summary: 'Understand how apps communicate — the foundation of modern software development.',
    content: `
# API Basics for Beginners

## What is an API?

API = Application Programming Interface. It's how two software applications talk to each other.

**Analogy:** A waiter in a restaurant. You (the client) give your order to the waiter (API), who takes it to the kitchen (server) and brings back your food (response).

## REST API — The Standard

Most APIs use HTTP methods:

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Read data | Get all students |
| POST | Create data | Add a new student |
| PUT | Update data | Update a student's marks |
| DELETE | Remove data | Delete a student |

## Making API Calls

### Using JavaScript (fetch)

\`\`\`javascript
// GET request
const response = await fetch('https://api.example.com/students');
const data = await response.json();
console.log(data);

// POST request
const response = await fetch('https://api.example.com/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Aniket',
        course: 'B.Tech',
        marks: 85
    })
});
\`\`\`

### Using Python (requests)

\`\`\`python
import requests

# GET request
response = requests.get('https://api.example.com/students')
data = response.json()
print(data)

# POST request
response = requests.post('https://api.example.com/students', json={
    'name': 'Aniket',
    'course': 'B.Tech',
    'marks': 85
})
\`\`\`

## API Response Structure

\`\`\`json
{
    "status": 200,
    "data": {
        "id": 1,
        "name": "Aniket",
        "score": 850
    },
    "message": "Success"
}
\`\`\`
    `,
    quiz: [
      {
        question: 'What does API stand for?',
        options: ['Application Programming Interface', 'Automated Program Integration', 'Application Process Integration', 'Advanced Programming Interface'],
        correct: 0,
        explanation: 'API stands for Application Programming Interface — it defines how software applications communicate with each other.',
      },
      {
        question: 'Which HTTP method is used to create new data?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correct: 1,
        explanation: 'POST is used to create new data on the server. GET reads, PUT updates, DELETE removes.',
      },
    ],
  },

  // ── Career (6) ──
  {
    id: 'career-01',
    title: 'Building a Tech Resume',
    category: 'career',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Craft a resume that gets you noticed — ATS-friendly, project-focused, and impactful.',
    content: `
# Building a Tech Resume

## The 6-Second Rule

Recruiters spend an average of 6 seconds scanning your resume. Every word must earn its place.

## Structure

\`\`\`
[Name] | [Phone] | [Email] | [GitHub] | [LinkedIn]

EDUCATION
[College] — [Degree] — [CGPA] — [Year]

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL
Tools: Git, VS Code, Excel, Tableau
Libraries: Pandas, NumPy, Scikit-learn

PROJECTS
[Project Name] | [Tech Stack] | [Link]
• What it does (1 line)
• How you built it (1 line)  
• Impact/result (1 line with numbers)

EXPERIENCE
[Role] — [Company] — [Duration]
• Achievement with numbers
• Achievement with numbers

ACHIEVEMENTS
• Competition rank / Score / Award
\`\`\`

## Power Words for Tech Resumes

Instead of "Made a website" → "Developed a responsive web application serving 500+ users"

| Weak | Strong |
|------|--------|
| Made | Developed, Built, Architected |
| Helped | Collaborated, Co-led, Facilitated |
| Used | Leveraged, Implemented, Deployed |
| Worked on | Optimized, Streamlined, Automated |

## ATS Tips

- Use standard section headings
- No tables or columns (ATS can't read them)
- Include keywords from the job description
- Save as PDF (not Word)
- File name: "FirstName_LastName_Resume.pdf"
    `,
    quiz: [
      {
        question: 'How long do recruiters typically spend on a resume?',
        options: ['30 seconds', '6 seconds', '2 minutes', '5 minutes'],
        correct: 1,
        explanation: 'Recruiters spend an average of just 6 seconds on initial resume screening. Every word must count.',
      },
      {
        question: 'What file format should you save your resume as?',
        options: ['Word (.doc)', 'PDF', 'Text file', 'Image'],
        correct: 1,
        explanation: 'PDF preserves formatting across all devices and is ATS-friendly. Word files can have formatting issues.',
      },
    ],
  },
  {
    id: 'career-02',
    title: 'Cracking Technical Interviews',
    category: 'career',
    duration: '6 min',
    xp: 30,
    difficulty: 'intermediate',
    summary: 'A step-by-step guide to preparing for and acing tech interviews.',
    content: `
# Cracking Technical Interviews

## The Interview Process

1. **Online Assessment (OA)** — Coding test (HackerRank/LeetCode)
2. **Technical Round 1** — DSA + Problem Solving
3. **Technical Round 2** — System Design / Projects
4. **HR Round** — Culture fit + Salary negotiation

## Preparation Timeline (3 months)

### Month 1: Fundamentals
- Data Structures: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs
- Algorithms: Sorting, Searching, Recursion, DP basics
- Solve 2-3 problems daily on LeetCode (Easy → Medium)

### Month 2: Intermediate
- Advanced DS: Heaps, Tries, Union-Find
- Algorithms: BFS/DFS, Binary Search, Sliding Window
- Solve 3-4 problems daily (Medium level)
- Start system design basics

### Month 3: Interview Prep
- Mock interviews (peer practice)
- Resume review + project explanations
- Behavioral questions (STAR method)
- Company-specific preparation

## The STAR Method for Behavioral Questions

**S** — Situation: Set the context
**T** — Task: What was your responsibility?
**A** — Action: What did you do?
**R** — Result: What was the outcome? (Use numbers)

## Example

\`\`\`
Q: Tell me about a time you solved a difficult problem

S: During my internship, our data pipeline was failing silently, 
   causing 30% of reports to have stale data.

T: As the data engineering intern, I was responsible for fixing this.

A: I set up monitoring with alerts, identified the root cause 
   (a timezone bug in the ETL script), and rewrote the parsing logic.

R: Reduced data staleness from 30% to under 1%, and the monitoring 
   system I built was adopted team-wide.
\`\`\`
    `,
    quiz: [
      {
        question: 'What does the STAR method stand for?',
        options: ['Start, Test, Act, Result', 'Situation, Task, Action, Result', 'System, Technology, Approach, Response', 'Skill, Talent, Ability, Resume'],
        correct: 1,
        explanation: 'STAR stands for Situation, Task, Action, Result — a framework for answering behavioral interview questions.',
      },
      {
        question: 'How many LeetCode problems should you aim for in Month 1?',
        options: ['1 per week', '2-3 daily', '10 daily', '1 monthly'],
        correct: 1,
        explanation: '2-3 problems daily in Month 1, starting with Easy and progressing to Medium, gives you a solid foundation.',
      },
    ],
  },
  {
    id: 'career-03',
    title: 'Freelancing with AI Skills',
    category: 'career',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'How to earn money freelance using AI tools — even as a student.',
    content: `
# Freelancing with AI Skills

## High-Demand Freelance Services

| Service | Rate (India) | Rate (Global) | AI Tools Used |
|---------|-------------|---------------|---------------|
| Content Writing | ₹500-2000/article | $20-100/article | ChatGPT, Claude |
| Data Entry + Analysis | ₹300-1000/task | $15-50/task | Python, ChatGPT |
| Social Media Management | ₹5000-15000/mo | $200-500/mo | ChatGPT, FLUX |
| Resume Writing | ₹500-1500/resume | $25-75/resume | ChatGPT, Canva |
| Web Development | ₹10,000-50,000/project | $500-2000/project | Cursor, ChatGPT |

## Where to Find Work

### Indian Platforms
- **Internshala** — Internships + Freelance projects
- **WorkNHire** — Indian freelance marketplace
- **LinkedIn** — Direct outreach to businesses

### Global Platforms
- **Fiverr** — Gig-based marketplace (start here)
- **Upwork** — Project-based freelance work
- **Toptal** — Premium freelance (for experienced devs)

## Getting Your First Client

1. **Create 3 sample works** — Show what you can do
2. **Set competitive pricing** — Start lower, raise as you build reviews
3. **Write personalized proposals** — Don't copy-paste templates
4. **Respond fast** — Speed wins on freelance platforms
5. **Overdeliver** — Exceed expectations for 5-star reviews

## Pro Tips

- **Specialize** — "I write AI-powered content for EdTech startups" beats "I do everything"
- **Build a portfolio** — Even 3 strong samples help
- **Ask for testimonials** — Social proof is everything
- **Raise prices gradually** — After every 5-star review
    `,
    quiz: [
      {
        question: 'Which platform is best for starting freelance work in India?',
        options: ['Toptal', 'Internshala', 'LinkedIn', 'Indeed'],
        correct: 1,
        explanation: 'Internshala is great for Indian students — it has many internship and freelance opportunities适合初学者.',
      },
      {
        question: 'What should you do to win your first freelance client?',
        options: ['Set the highest prices', 'Start lower and overdeliver', 'Copy-paste proposals', 'Wait for clients to find you'],
        correct: 1,
        explanation: 'Start with competitive pricing, write personalized proposals, and overdeliver to build reviews and reputation.',
      },
    ],
  },
  {
    id: 'career-04',
    title: 'LinkedIn Profile Optimization',
    category: 'career',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'Turn your LinkedIn profile into a magnet for recruiters and opportunities.',
    content: `
# LinkedIn Profile Optimization

## Profile Essentials

### Headline (Most Important)
❌ "Student at [College]"
✅ "Aspiring Data Scientist | Python + ML | Building AI tools for Indian education"

### About Section (200-300 words)
\`\`\`
I'm a [year] [branch] student at [college] passionate about using AI to solve real Indian problems.

Currently learning: Machine Learning, Data Analysis, Prompt Engineering

What I've built:
• [Project 1] — One-line description with impact
• [Project 2] — One-line description with impact

What I'm looking for: Internship opportunities in data science / AI / software development

Let's connect: aniket@email.com
\`\`\`

### Experience Section
- Include internships, freelance work, and significant college projects
- Use bullet points with numbers
- Example: "Developed a Python script that automated report generation, saving 5 hours/week"

### Featured Section
- Pin your best project/demo
- Add certificates
- Link to your GitHub

## Networking Strategy

1. **Connect with 10 people daily** — Alumni, professionals in your field
2. **Comment meaningfully** on posts in your niche (not "Great post!")
3. **Share what you're learning** — Weekly posts about your projects
4. **Join relevant groups** — AI in India, Python Developers, etc.

## Content Calendar

| Day | Post Type |
|-----|-----------|
| Monday | Learning update (what you studied) |
| Wednesday | Project showcase or tutorial |
| Friday | Industry insight or opinion |
    `,
    quiz: [
      {
        question: 'What makes a good LinkedIn headline?',
        options: ['Your college name', 'Keywords about your skills and what you do', 'Your GPA', 'A list of courses'],
        correct: 1,
        explanation: 'A good headline includes keywords recruiters search for: your skills, interests, and what you\'re building/learning.',
      },
      {
        question: 'How many people should you connect with daily on LinkedIn?',
        options: ['1', '10', '100', 'As many as possible'],
        correct: 1,
        explanation: '10 meaningful connections daily is a sustainable strategy — focus on relevant people in your field.',
      },
    ],
  },
  {
    id: 'career-05',
    title: 'Portfolio Building Guide',
    category: 'career',
    duration: '5 min',
    xp: 25,
    difficulty: 'intermediate',
    summary: 'Build a portfolio that showcases your skills and lands you opportunities.',
    content: `
# Portfolio Building Guide

## What Recruiters Look For

1. **Relevant projects** — Does this person build things?
2. **Code quality** — Is the code clean and well-documented?
3. **Impact** — What did the project achieve? (Numbers!)
4. **Initiative** — Did they build this on their own or for a class?

## 5 Projects Every Student Should Build

### 1. Personal Portfolio Website
- **Tech**: HTML/CSS/JS or React
- **Shows**: Frontend skills, design sense
- **Time**: 1-2 days

### 2. Data Analysis Project
- **Tech**: Python + Pandas + Matplotlib
- **Dataset**: Indian government data (data.gov.in)
- **Shows**: Data cleaning, visualization, insights
- **Time**: 3-5 days

### 3. AI-Powered Tool
- **Tech**: Python + OpenAI API or Hugging Face
- **Example**: Quiz generator, resume analyzer, chatbot
- **Shows**: AI/ML skills, API integration
- **Time**: 1 week

### 4. Full-Stack App
- **Tech**: React + Node.js or Next.js
- **Example**: Task manager, expense tracker, study planner
- **Shows**: Full-stack capabilities
- **Time**: 2 weeks

### 5. Open Source Contribution
- **Platform**: GitHub
- **Show**: Collaboration skills, code reviews
- **Time**: Ongoing

## GitHub Profile Tips

1. **Pin 6 best repositories** — Your showcase
2. **Write detailed READMEs** — Screenshots, setup instructions, tech stack
3. **Green contribution graph** — Consistent daily commits
4. **Profile README** — Custom profile with your bio and stats
    `,
    quiz: [
      {
        question: 'How many projects should you pin on GitHub?',
        options: ['1', '3', '6', 'All of them'],
        correct: 2,
        explanation: 'Pin your 6 best repositories — they serve as your showcase when recruiters visit your profile.',
      },
      {
        question: 'What should a project README include?',
        options: ['Just the code', 'Description, screenshots, setup instructions, tech stack', 'Nothing — code speaks for itself', 'Only the project name'],
        correct: 1,
        explanation: 'A good README includes description, screenshots/demos, setup instructions, and the tech stack used.',
      },
    ],
  },
  {
    id: 'career-06',
    title: 'Salary Negotiation 101',
    category: 'career',
    duration: '4 min',
    xp: 20,
    difficulty: 'intermediate',
    summary: 'Know your worth and negotiate with confidence — most people leave money on the table.',
    content: `
# Salary Negotiation 101

## Why Negotiate?

- **73% of employers** expect negotiation
- Average increase from negotiation: **₹1.5-3 LPA** (entry level)
- Not negotiating = losing ₹15-30 Lakh over a career

## The Golden Rules

1. **Never give a number first** — Let them make the offer
2. **Always negotiate** — The worst they can say is no
3. **Have data** — Know the market rate
4. **Be professional** — Negotiation, not confrontation
5. **Consider total package** — Not just base salary

## Market Rates (2024-25, India)

| Role | Entry Level | 2-3 Years | 5+ Years |
|------|------------|-----------|----------|
| Software Developer | ₹6-12 LPA | ₹12-25 LPA | ₹25-50 LPA |
| Data Analyst | ₹4-8 LPA | ₹8-15 LPA | ₹15-30 LPA |
| ML Engineer | ₹8-15 LPA | ₹15-30 LPA | ₹30-60 LPA |
| Product Manager | ₹10-18 LPA | ₹18-35 LPA | ₹35-70 LPA |

## Negotiation Script

\`\`\`
"Thank you for the offer! I'm really excited about this role.

Based on my research and the value I'll bring, I was hoping 
for something in the range of [₹X-Y LPA].

I'm particularly confident because [2-3 reasons: skills, 
market data, competing offers].

Is there flexibility in the package?"
\`\`\`

## Beyond Base Salary

Negotiate these too:
- **Signing bonus** — One-time payment
- **Stock/ESOPs** — Can be worth a lot at startups
- **Learning budget** — Courses, conferences
- **Remote work** — Flexibility has real value
- **Joining date** — Earlier = more months of salary
    `,
    quiz: [
      {
        question: 'What percentage of employers expect salary negotiation?',
        options: ['25%', '50%', '73%', '95%'],
        correct: 2,
        explanation: '73% of employers expect candidates to negotiate. Not negotiating means leaving money on the table.',
      },
      {
        question: 'Should you give a number first in salary negotiation?',
        options: ['Yes — be direct', 'No — let them make the offer first', 'Only if asked twice', 'It doesn\'t matter'],
        correct: 1,
        explanation: 'Never give a number first. Let the employer make the offer, then negotiate from there.',
      },
    ],
  },

  // ── Exam Prep (6) ──
  {
    id: 'exam-01',
    title: 'Study Techniques That Work',
    category: 'exam-prep',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Evidence-based study methods that actually help you retain information.',
    content: `
# Study Techniques That Work

## 1. Active Recall

Instead of re-reading notes, close the book and try to recall what you learned.

**How to do it:**
- Read a section → Close the book → Write down everything you remember
- Use flashcards (physical or Anki app)
- Quiz yourself before looking at answers

**Why it works:** Forces your brain to retrieve information, strengthening neural pathways.

## 2. Spaced Repetition

Review material at increasing intervals:
- Day 1: Learn it
- Day 2: Review
- Day 4: Review
- Day 7: Review
- Day 14: Review

**Tool:** Anki (free flashcard app with built-in spaced repetition)

## 3. Pomodoro Technique

- Study for 25 minutes (no distractions)
- Take a 5-minute break
- After 4 cycles, take a 15-30 minute break

**Why it works:** Maintains focus and prevents burnout.

## 4. Feynman Technique

Named after Nobel Prize physicist Richard Feynman:

1. Pick a concept
2. Explain it in simple language (as if teaching a child)
3. Identify gaps in your explanation
4. Go back and fill the gaps
5. Repeat until you can explain it simply

## 5. Practice Testing

- Solve previous year papers (most important!)
- Take timed mock tests
- Analyze mistakes — don't just check the score
- Create an "error log" to track common mistakes

## Study Schedule Template

| Time | Activity |
|------|----------|
| 6:00-8:00 | Fresh subject (hardest topic) |
| 8:00-8:30 | Breakfast break |
| 8:30-11:00 | Problem-solving session |
| 11:00-11:15 | Short break |
| 11:15-1:00 | Revision / Flashcards |
| 1:00-2:00 | Lunch + rest |
| 2:00-4:00 | Practice papers |
| 4:00-4:30 | Break / walk |
| 4:30-6:00 | Light study / current affairs |
    `,
    quiz: [
      {
        question: 'What is Active Recall?',
        options: ['Re-reading notes multiple times', 'Trying to recall information without looking at notes', 'Copying notes by hand', 'Highlighting important text'],
        correct: 1,
        explanation: 'Active Recall means trying to retrieve information from memory without looking at your notes. It strengthens neural pathways.',
      },
      {
        question: 'How long is one Pomodoro cycle?',
        options: ['10 minutes', '25 minutes', '45 minutes', '60 minutes'],
        correct: 1,
        explanation: 'One Pomodoro cycle is 25 minutes of focused study followed by a 5-minute break.',
      },
    ],
  },
  {
    id: 'exam-02',
    title: 'Time Management for Exam Prep',
    category: 'exam-prep',
    duration: '5 min',
    xp: 25,
    difficulty: 'beginner',
    summary: 'Create a study schedule that covers everything without burning out.',
    content: `
# Time Management for Exam Prep

## The 80/20 Rule (Pareto Principle)

80% of results come from 20% of your effort. Identify the high-impact topics:

**For ADRE:**
- Computer Awareness (high weightage, easy to score)
- General Knowledge (current affairs + Assam-specific)
- English (vocabulary + comprehension)

**For JEE:**
- Mechanics (Physics)
- Algebra + Calculus (Maths)
- Physical Chemistry (highest weightage)

**For NEET:**
- Biology (50% of marks!)
- Focus: Genetics, Ecology, Human Physiology

## Weekly Planning

### Step 1: List all subjects/topics
### Step 2: Assign priority (High/Medium/Low)
### Step 3: Allocate time blocks
### Step 4: Include buffer time (things take longer than expected)

## Sample Weekly Schedule (ADRE)

| Day | Morning (6-9) | Afternoon (2-5) | Evening (6-8) |
|-----|---------------|-----------------|---------------|
| Mon | GK - Assam History | Computer Basics | Revision |
| Tue | English Grammar | GK - Current Affairs | Mock Test |
| Wed | Computer - MS Office | GK - Geography | Revision |
| Thu | English - Comprehension | GK - Polity | Mock Test |
| Fri | Computer - Internet | GK - Science | Revision |
| Sat | Full Mock Test | Error Analysis | Light Revision |
| Sun | Rest + Current Affairs | Weak Topics | Planning |

## Anti-Procrastination Tips

1. **2-minute rule** — If it takes 2 minutes, do it now
2. **Eat the frog** — Do the hardest task first
3. **Remove distractions** — Phone in another room during study
4. **Set micro-goals** — "Solve 5 questions" not "Study maths"
5. **Track progress** — Checking off tasks is motivating
    `,
    quiz: [
      {
        question: 'What does the 80/20 Rule suggest for exam prep?',
        options: ['Study 80% of the syllabus', 'Focus on the 20% of topics that give 80% of marks', 'Study for 80 minutes, rest 20', 'Answer 80% of questions correctly'],
        correct: 1,
        explanation: 'The 80/20 Rule means focusing on the high-impact 20% of topics that contribute to 80% of exam marks.',
      },
      {
        question: 'What is the "Eat the frog" technique?',
        options: ['Study biology first', 'Do the hardest task first in the day', 'Eat before studying', 'Take long breaks between tasks'],
        correct: 1,
        explanation: '"Eat the frog" means tackling your most difficult or dreaded task first, when your energy is highest.',
      },
    ],
  },
  {
    id: 'exam-03',
    title: 'Previous Year Paper Strategy',
    category: 'exam-prep',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'How to use previous year papers effectively — the single most powerful exam prep tool.',
    content: `
# Previous Year Paper Strategy

## Why Previous Year Papers Matter

- **30-40% of questions** repeat or are similar patterns
- Shows you the **exact difficulty level**
- Reveals **high-frequency topics**
- Builds **exam temperament** and time management

## How to Use Them (4-Phase Strategy)

### Phase 1: Diagnostic (Month 3-4 before exam)
- Take one paper without any preparation
- Don't worry about the score
- **Goal:** Understand the exam pattern and your baseline

### Phase 2: Topic-wise Practice (Month 2-3)
- Solve questions grouped by topic
- Identify weak areas
- **Goal:** Build topic-wise mastery

### Phase 3: Timed Practice (Month 1-2)
- Full papers with a timer
- Simulate exam conditions (no phone, no breaks)
- **Goal:** Build speed and accuracy

### Phase 4: Final Week
- Solve 1 paper daily
- Focus only on mistakes from previous papers
- **Goal:** Peak performance on exam day

## Error Analysis Template

| Question | Topic | Why I Got It Wrong | Correct Approach |
|----------|-------|--------------------|-----------------|
| Q15 | Polity | Confused Article 14 & 19 | Art 14 = Equality, Art 19 = Freedoms |
| Q32 | Computer | Didn't know Excel shortcut | Ctrl+D = Fill Down |
| Q45 | Current Affairs | Missed this news | Read newspaper daily |

## Where to Find Papers

- **ADRE**: Assam Public Service Commission website
- **UPSC**: UPSC official website + Vision IAS compilations
- **JEE**: NTA official website + Embibe
- **NEET**: NTA official website + Allen/Aakash compilations
    `,
    quiz: [
      {
        question: 'What percentage of questions typically repeat or follow similar patterns?',
        options: ['5-10%', '10-20%', '30-40%', '50-60%'],
        correct: 2,
        explanation: '30-40% of questions in competitive exams repeat or follow similar patterns from previous years.',
      },
      {
        question: 'What is the first phase of using previous year papers?',
        options: ['Timed practice', 'Topic-wise practice', 'Diagnostic (taking one paper cold)', 'Final revision'],
        correct: 2,
        explanation: 'Phase 1 is diagnostic — take one paper without preparation to understand the pattern and your baseline.',
      },
    ],
  },
  {
    id: 'exam-04',
    title: 'Current Affairs Mastery',
    category: 'exam-prep',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'Stay updated without getting overwhelmed — a systematic approach to current affairs.',
    content: `
# Current Affairs Mastery

## Why Current Affairs Matter

- **UPSC Prelims**: 15-20 questions directly from current affairs
- **APSC**: 25-30% of paper is current affairs
- **ADRE**: Current affairs is a separate section
- **Interview rounds**: Almost entirely current affairs

## Daily Sources (Pick 2-3, not all)

### Must-Read
- **The Hindu** — Editorial + National News (30 min)
- **Assam Tribune** — State-specific news (15 min, for APSC/ADRE)

### Quick Updates
- **PIB (Press Information Bureau)** — Government announcements
- **Manorama Yearbook** — Monthly compilation

### Weekly
- **Vision IAS Current Affairs Monthly** — Free PDF
- **GKToday** — Daily quiz (5 minutes)

## How to Remember Current Affairs

### 1. The Link Method
Connect new information to something you already know.

Example: "India's GDP growth is 7.2%"
→ Link: "India grew at 7.2%, faster than China's 5.2% — important for UPSC Economy"

### 2. The Write Method
Write 3 key points from each day's news in a notebook.

### 3. The Quiz Method
Quiz yourself before bed — "What happened today that matters for the exam?"

### 4. The Discussion Method
Discuss current affairs with friends — teaching others reinforces your memory.

## Monthly Revision

- Week 1: Revise Week 1-2 current affairs
- Week 2: Revise Week 3-4 current affairs
- Week 3: Revise all month's current affairs
- Week 4: Take a current affairs mock test
    `,
    quiz: [
      {
        question: 'How many current affairs sources should you read daily?',
        options: ['All available sources', '2-3 focused sources', 'Only newspapers', 'Only YouTube'],
        correct: 1,
        explanation: 'Pick 2-3 quality sources and read them consistently rather than skimming everything superficially.',
      },
      {
        question: 'What is the "Link Method" for remembering current affairs?',
        options: ['Bookmarking articles', 'Connecting new info to something you already know', 'Sharing news on social media', 'Creating hyperlinks in notes'],
        correct: 1,
        explanation: 'The Link Method involves connecting new current affairs information to knowledge you already have, making it easier to remember.',
      },
    ],
  },
  {
    id: 'exam-05',
    title: 'Mock Test Analysis',
    category: 'exam-prep',
    duration: '5 min',
    xp: 25,
    difficulty: 'intermediate',
    summary: 'Taking mock tests is not enough — learn how to analyze them and improve your score.',
    content: `
# Mock Test Analysis

## Why Analysis Matters

Taking 50 mocks without analysis < Taking 10 mocks with deep analysis

## The Analysis Framework

### Step 1: Categorize Every Question

For each question, mark it as:
- ✅ **Correct + Confident** — You knew it and got it right
- ⚠️ **Correct + Guess** — You got it right but were unsure
- ❌ **Wrong + Silly** — You knew it but made a mistake
- ❌ **Wrong + Knowledge Gap** — You didn't know the concept

### Step 2: Calculate Your "True Score"

\`\`\`
True Score = Correct + Confident - Wrong + Guess (0.33 penalty per guess)
\`\`\`

If your true score is much lower than your raw score, you're getting lucky.

### Step 3: Identify Patterns

Ask yourself:
- Which subjects am I weakest in?
- Which topics within those subjects?
- Am I making calculation errors?
- Am I running out of time?
- Am I spending too long on easy questions?

### Step 4: Create an Action Plan

| Problem | Solution | Timeline |
|---------|----------|----------|
| Weak in Polity | Read Laxmikanth Chapter 3-5 | This week |
| Time management | Practice 10 questions in 15 min | Daily |
| Silly mistakes | Double-check calculations | Always |
| Guessing too much | Mark and move on, return if time | Strategy change |

### Step 5: Re-take Failed Mocks

After 2 weeks of preparation, re-take the same mock.
Your goal: improve by 15-20% from your first attempt.
    `,
    quiz: [
      {
        question: 'What should you do with "Wrong + Knowledge Gap" questions?',
        options: ['Ignore them', 'Study the concept and create notes', 'Just memorize the answer', 'Skip to the next test'],
        correct: 1,
        explanation: 'Knowledge gap questions need you to study the underlying concept, not just memorize the correct answer.',
      },
      {
        question: 'When should you re-take a failed mock test?',
        options: ['The next day', 'After 2 weeks of preparation', 'Never', 'On exam day'],
        correct: 1,
        explanation: 'Re-take after 2 weeks of targeted preparation to measure your improvement (aim for 15-20% improvement).',
      },
    ],
  },
  {
    id: 'exam-06',
    title: 'Exam Day Strategy',
    category: 'exam-prep',
    duration: '4 min',
    xp: 20,
    difficulty: 'beginner',
    summary: 'What to do on the day of the exam — preparation, mindset, and execution.',
    content: `
# Exam Day Strategy

## Night Before

- **No new studying** — Revise only what you already know
- **Pack everything** — Admit card, ID, pens, water, watch
- **Sleep early** — 7-8 hours minimum
- **Set 2 alarms** — Don't rely on one

## Morning Of

- **Light breakfast** — Idli, dosa, fruits (avoid heavy/oily food)
- **No last-minute cramming** — Trust your preparation
- **Reach early** — 30 minutes before reporting time
- **Stay calm** — Deep breathing if anxious

## During the Exam

### Time Strategy (for 2-hour, 100-question exam)
- **Total time**: 120 minutes
- **Per question**: 1.2 minutes average
- **First pass** (60 min): Answer all easy/medium questions
- **Second pass** (40 min): Attempt hard questions
- **Review** (20 min): Check answers, fill in blanks

### The Traffic Light System
- 🟢 **Green** — You know the answer immediately → Mark it
- 🟡 **Yellow** — You can figure it out → Mark for review
- 🔴 **Red** — No idea → Skip (don't waste time)

### Guessing Strategy
- **Never leave blanks** (unless negative marking is harsh)
- **Eliminate 2 options** first, then guess from remaining 2
- **Your first instinct is usually right** — Don't change unless sure

## After Each Section

- Don't discuss answers with friends between sections
- Stay focused on the next section
- Quick 30-second reset: Deep breath → Positive self-talk → Move on

## After the Exam

- **Don't obsess** over what's done
- **Note down questions** you remember (for analysis later)
- **Start preparing** for the next exam/topic
    `,
    quiz: [
      {
        question: 'What should you do the night before an exam?',
        options: ['Study all night', 'No new studying — only revise what you know', 'Skip sleep to study more', 'Eat heavy food for energy'],
        correct: 1,
        explanation: 'No new studying the night before. Only revise what you already know, and get 7-8 hours of sleep.',
      },
      {
        question: 'What is the Traffic Light System for exams?',
        options: ['Traffic rules during exam commute', 'A system to categorize questions by difficulty', 'A color-coding system for notes', 'A time management app'],
        correct: 1,
        explanation: 'Green = know immediately, Yellow = can figure out, Red = no idea. This helps prioritize which questions to answer first.',
      },
    ],
  },
];
