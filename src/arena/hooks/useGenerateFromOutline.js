import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';

export function useGenerateFromOutline() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async ({ presentationId, outlines, template }) => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Save current outlines
      const slides = outlines.map(s => ({ content: s.content || '', title: s.title || '' }));
      await authFetch(`/api/v1/ppt/outlines/${presentationId}`, {
        method: 'PUT',
        body: JSON.stringify({ slides }),
      });

      // Step 2: Prepare presentation (generates full slides)
      const res = await authFetch('/api/v1/ppt/presentation/prepare', {
        method: 'POST',
        body: JSON.stringify({
          presentation_id: presentationId,
          outlines: slides,
          layout: template,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Generation failed');
      }

      // Step 3: Navigate to presentation with streaming params
      navigate(`/presentation?id=${presentationId}&stream=true&type=standard`);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return { generate, loading, error };
}
