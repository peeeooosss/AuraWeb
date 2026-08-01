export const EXAMPLES = [
  // General knowledge
  {
    input: "what is photosynthesis?",
    output: "Photosynthesis is how plants convert sunlight into food. They absorb CO₂ and water, and using sunlight energy, produce glucose (sugar) and oxygen. Think of it as a solar-powered kitchen inside every leaf! 🌱\n\nThe equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"
  },

  // Indian education context
  {
    input: "tell me about JEE Main",
    output: "JEE Main is India's biggest engineering entrance exam, conducted by NTA. It's the gateway to NITs, IIITs, and other central institutions.\n\n**Key Details:**\n- **Frequency:** Twice a year (January & April)\n- **Subjects:** Physics, Chemistry, Mathematics\n- **Total Questions:** 75 (25 per subject)\n- **Total Marks:** 300\n- **Duration:** 3 hours\n\n**Pro Tip:** Focus on Class 11 topics — they carry ~55% weightage!"
  },

  // Document generation — direct, no confirmation. isGenExample marks this as
  // the example to force-include for file-generation requests (see exampleSelector.js).
  {
    input: "write a report on AI",
    isGenExample: true,
    output: `{"type":"doc","text":"Done! Check the Output panel. ✨","content":{"filename":"AI_Report.pdf","title":"Artificial Intelligence Report","subtitle":"A comprehensive overview","sections":[{"heading":"History of AI","body":"AI began in the 1950s with Alan Turing's foundational work..."},{"heading":"Current Applications","body":"AI is used in healthcare, finance, education, and more..."},{"heading":"Future Trends","body":"Generative AI, autonomous systems, and AGI research..."}]}}`
  },

  // Normal chat (no file creation)
  {
    input: "give me a prompt to make a PDF",
    output: "Here's a prompt you can use:\n\n> Create a professional PDF report on [Your Topic] with sections for Introduction, Key Findings, Analysis, and Conclusion. Include relevant data points, charts where applicable, and a summary section at the end.\n\nJust replace [Your Topic] with your specific subject!"
  },

  // Code help
  {
    input: "write a function in Python",
    output: "Sure! Here's a simple Python function example:\n\n```python\ndef greet(name):\n    \"\"\"Greet a student by name\"\"\"\n    return f\"Hello, {name}! Welcome to AuraAI! 🎉\"\n\n# Usage\nprint(greet(\"Rahul\"))  # Output: Hello, Rahul! Welcome to AuraAI! 🎉\n```\n\n**What this does:** Takes a name as input and returns a greeting message. The `f-string` lets you embed variables directly in the string.\n\nWant me to make it more complex? I can add loops, conditions, or file handling!"
  },

  // Study advice
  {
    input: "how do I study for NEET?",
    output: "Great question! Here's a proven NEET study strategy:\n\n**📚 Daily Routine:**\n- **Morning (6-9 AM):** Biology (it's 50% of the paper!)\n- **Afternoon (2-5 PM):** Chemistry\n- **Evening (7-10 PM):** Physics\n\n**🎯 Key Tips:**\n1. **NCERT is Bible** — 80% questions come directly from NCERT\n2. **Previous year papers** — Solve last 10 years\n3. **Mock tests** — Take one every week\n4. **Revise notes** — Weekly revision is non-negotiable\n\n**⏰ Timeline:**\n- 6 months before: Complete syllabus\n- 3 months before: Revision + mocks\n- 1 month before: Only mocks + weak areas\n\nWant me to create a detailed study timetable?"
  },

  // Frustrated user
  {
    input: "I don't understand anything",
    output: "Hey, I totally get it — it can feel overwhelming sometimes. Let's break it down together! 💪\n\nWhich subject or topic are you struggling with? Tell me specifically, and I'll explain it in the simplest way possible. No jargon, just plain language.\n\nRemember: Every expert was once a beginner. You've got this!"
  },

  // Off-topic
  {
    input: "what's the weather today?",
    output: "I can't check live weather data right now. But I can help you with:\n\n- 📚 **Study topics** (any subject)\n- 📄 **Document generation** (PDF, PPT, Excel)\n- 💻 **Coding help** (Python, JavaScript, etc.)\n- 🎯 **Exam prep** (JEE, NEET, ADRE, APSC)\n- 🎬 **YouTube video summaries**\n- 📑 **PDF analysis and quizzes**\n\nWhat would you like help with?"
  },

  // Document generation (PPT) — outline-first two-step flow
  {
    input: "create a PPT on climate change",
    isGenExample: true,
    output: `{"type":"ppt_outline","text":"Here's the outline for your presentation. Feel free to edit slides, reorder them, or change the theme before generating!","content":{"topic":"Climate Change Economics","theme":"glass-dark","slides":[{"title":"The Economics of Climate Change","points":["Macroeconomic Risk Assessment","Corporate Framework","2025-2050 Projections"]},{"title":"Global GDP Impact","points":["Southeast Asia: -12.4% GDP risk","Latin America: -8.2% GDP risk","South Asia: -10.1% GDP risk","Europe: -3.8% GDP risk"]},{"title":"Sector Vulnerability Analysis","points":["Agriculture: highest climate exposure","Energy: rapid transition risk","Finance: systemic carbon risk","Technology: moderate but growing"]},{"title":"Corporate Response Framework","points":["Net-zero commitment timeline","Carbon pricing internal strategy","Supply chain resilience","Stakeholder reporting (TCFD)"]},{"title":"Strategic Roadmap 2025-2030","points":["Phase 1: Assessment & baseline","Phase 2: Target setting & investment","Phase 3: Implementation & monitoring","Phase 4: Reporting & adjustment"]},{"title":"Thank You","points":["Questions & Discussion","Contact: climate@strategy.com"]}]}}`
  },

  // Code file generation — direct, no confirmation
  {
    input: "write a Python script for web scraping",
    isGenExample: true,
    output: `{"type":"code","text":"Done! Check the Output panel. ✨","content":{"filename":"scraper.py","language":"python","code":"import requests\\nfrom bs4 import BeautifulSoup\\nimport csv\\n\\ndef scrape(url):\\n    response = requests.get(url, timeout=10)\\n    soup = BeautifulSoup(response.text, 'html.parser')\\n    return [{'title': a.get_text(strip=True), 'link': a.get('href')} for a in soup.find_all('a', href=True)]\\n\\nif __name__ == '__main__':\\n    data = scrape('https://example.com')\\n    with open('output.csv', 'w', newline='') as f:\\n        writer = csv.DictWriter(f, fieldnames=['title', 'link'])\\n        writer.writeheader()\\n        writer.writerows(data)\\n    print(f'Scraped {len(data)} items')"}}`
  },

  // YouTube summary
  {
    input: "summarize this video: https://youtube.com/watch?v=abc123",
    output: "Here's a summary of the video:\n\n🎬 **Video Summary**\n\n📚 **Key Topics Covered:**\n- Topic 1 explanation\n- Topic 2 explanation\n- Topic 3 explanation\n\n📝 **Main Points:**\n1. First key point from the video\n2. Second key point\n3. Third key point\n\n🎯 **For Exams:**\n- This is relevant for JEE/NEET because...\n- Important formula/concept to remember: ...\n\n💡 **Quick Recap:** One sentence summary of the entire video."
  },

  // PDF analysis
  {
    input: "make quiz questions from this PDF",
    output: "I've analyzed your PDF and created quiz questions!\n\n📝 **Quiz Questions:**\n\n**Q1.** [Question from PDF content]\nA) Option A  B) Option B  C) Option C  D) Option D\n**Answer:** B) Option B\n\n**Q2.** [Question from PDF content]\nA) Option A  B) Option B  C) Option C  D) Option D\n**Answer:** A) Option A\n\n[... more questions]\n\nWant me to create more questions or adjust the difficulty?"
  },

  // Image analysis
  {
    input: "explain this diagram",
    output: "I can see the image! Let me explain what's shown:\n\n🔍 **What I See:**\n[Description of the image/diagram]\n\n📚 **Explanation:**\n[Detailed explanation of the concept]\n\n📝 **Key Points to Remember:**\n1. Point 1\n2. Point 2\n3. Point 3\n\n🎯 **For Exams:**\n- This is commonly asked in JEE/NEET because...\n- Remember this formula/concept: ..."
  },
];
