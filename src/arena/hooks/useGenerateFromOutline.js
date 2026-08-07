import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function useGenerateFromOutline() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(null); // null | 'saving' | 'preparing' | 'navigating'
  const abortRef = useRef(null);

  const generate = useCallback(async ({ presentationId, outlines, template }) => {
    setLoading(true);
    setError(null);
    setStep('saving');

    try {
      // Step 1: Save current outlines
      const slides = outlines.map(s => ({ content: s.content || '', title: s.title || '' }));
      const saveRes = await authFetch(`/api/v1/ppt/outlines/${presentationId}`, {
        method: 'PUT',
        body: JSON.stringify({ slides }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save outlines');
      }

      // Step 2: Prepare presentation with retry for KV propagation
      setStep('preparing');
      let prepareRes;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        prepareRes = await authFetch('/api/v1/ppt/presentation/prepare', {
          method: 'POST',
          body: JSON.stringify({
            presentation_id: presentationId,
            outlines: slides,
            layout: template,
          }),
        });

        if (prepareRes.ok) break;

        // Retry on 404 (KV propagation delay)
        if (prepareRes.status === 404 && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }

        // Parse error response for real message
        const err = await prepareRes.json().catch(() => ({}));
        const detail = err.detail || err.message || `Server error (${prepareRes.status})`;
        throw new Error(detail);
      }

      if (!prepareRes.ok) {
        const err = await prepareRes.json().catch(() => ({}));
        throw new Error(err.detail || 'Generation failed');
      }

      window.dispatchEvent(new CustomEvent('credits:updated'));

      // Step 3: Navigate to presentation with streaming params
      setStep('navigating');
      navigate(`/presentation?id=${presentationId}&stream=true&type=standard`);
      return true;
    } catch (e) {
      const msg = e.message || 'Generation failed';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
      setStep(null);
    }
  }, [navigate]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setStep(null);
    setError(null);
  }, []);

  return { generate, loading, error, step, cancel };
}
