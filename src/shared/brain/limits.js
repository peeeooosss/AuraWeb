export const TIERS = {
  free_trial: {
    name: 'Free Trial',
    price: 0,
    docsPerDay: -1,
    chatMemory: 8,
    modelAccess: 'premium',
    knowledgeBase: 'full',
    webSearch: false,
    youtubePerDay: -1,
    pdfPerDay: -1,
    pptPerDay: -1,
    imagePerDay: -1,
    xlsxPerDay: -1,
    features: ['chat', 'documents', 'quizzes', 'leaderboards', 'roadmaps', 'referrals'],
    quality: 'max',
  },
  student: {
    name: 'Student Base',
    price: 199,
    docsPerDay: 20,
    chatMemory: 5,
    modelAccess: 'paid',
    knowledgeBase: 'basic',
    webSearch: false,
    youtubePerDay: 3,
    pdfPerDay: 10,
    pptPerDay: 5,
    imagePerDay: 5,
    xlsxPerDay: 10,
    features: ['chat', 'documents', 'quizzes', 'referrals'],
    quality: 'high',
  },
  creator: {
    name: 'Creator Pro',
    price: 399,
    docsPerDay: 50,
    chatMemory: 8,
    modelAccess: 'premium',
    knowledgeBase: 'full',
    webSearch: false,
    youtubePerDay: 5,
    pdfPerDay: 20,
    pptPerDay: 10,
    imagePerDay: 10,
    xlsxPerDay: 20,
    features: ['chat', 'documents', 'quizzes', 'leaderboards', 'roadmaps', 'referrals'],
    quality: 'max',
  },
};

export function getLimits(tier) {
  return TIERS[tier] || TIERS.student;
}

export function canGenerate(tier, type, todayCount) {
  const limits = getLimits(tier);

  switch (type) {
    case 'doc':
      return limits.docsPerDay === -1 || todayCount < limits.docsPerDay;
    case 'youtube':
      return limits.youtubePerDay === -1 || todayCount < limits.youtubePerDay;
    case 'pdf':
      return limits.pdfPerDay === -1 || todayCount < limits.pdfPerDay;
    case 'ppt':
      return limits.pptPerDay === -1 || todayCount < limits.pptPerDay;
    case 'image':
      return limits.imagePerDay === -1 || todayCount < limits.imagePerDay;
    case 'xlsx':
      return limits.xlsxPerDay === -1 || todayCount < limits.xlsxPerDay;
    default:
      return true;
  }
}

export function getMemorySize(tier) {
  return getLimits(tier).chatMemory;
}

export function getUsageInfo(tier, usage) {
  const limits = getLimits(tier);
  return {
    docs: { used: usage.docs || 0, limit: limits.docsPerDay },
    youtube: { used: usage.youtube || 0, limit: limits.youtubePerDay },
    pdf: { used: usage.pdf || 0, limit: limits.pdfPerDay },
    ppt: { used: usage.ppt || 0, limit: limits.pptPerDay },
    image: { used: usage.image || 0, limit: limits.imagePerDay },
    xlsx: { used: usage.xlsx || 0, limit: limits.xlsxPerDay },
  };
}
