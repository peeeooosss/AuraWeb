import { useState, useCallback, useRef } from 'react';
import { authFetch } from '../lib/api';

export function useGenerateFlow() {
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState('creating');
  const [status, setStatus] = useState('');
  const [chunks, setChunks] = useState('');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const generate = useCallback(async (data) => {
    setGenerating(true);
    setError(null);
    setStep('creating');
    setStatus('Creating presentation...');
    setChunks('');

    try {
      const createRes = await authFetch('/api/v1/ppt/presentation/create', {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          n_slides: data.n_slides || 8,
          language: data.language || 'English',
          template: data.template || 'general',
          tone: data.tone || 'default',
          verbosity: data.verbosity || 'standard',
          instructions: data.instructions || '',
          include_title_slide: true,
          web_search: !!data.web_search,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ detail: 'Create failed' }));
        throw new Error(err.detail || 'Failed to create presentation');
      }

      const presentation = await createRes.json();
      const presentationId = presentation.id;
      if (!presentationId) throw new Error('No presentation ID returned');

      setStep('outlining');
      setStatus('Presentation created — loading outline page...');

      return { id: presentationId, success: true };
    } catch (e) {
      setError(e.message || 'Generation failed');
      setStep('done');
      setGenerating(false);
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.close();
    setGenerating(false);
    setError(null);
  }, []);

  return { generate, generating, step, status, chunks, error, cancel };
}
