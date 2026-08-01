function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function extractYouTubeTranscript(url) {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  try {
    const response = await fetch(
      `https://youtube-transcript-api.vercel.app/api/transcript?videoId=${videoId}`
    );

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.transcript || data.transcript.length === 0) return null;

    const transcript = data.transcript
      .map(segment => segment.text)
      .join(' ');

    return {
      videoId,
      transcript,
      segments: data.transcript,
    };
  } catch {
    return null;
  }
}

export function isYouTubeUrl(text) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(text);
}
