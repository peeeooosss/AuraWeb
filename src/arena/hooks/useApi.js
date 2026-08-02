import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';

export function usePresentations() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllPresentations();
      setDecks(Array.isArray(data) ? data : []);
    } catch {
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  const removeDeck = useCallback(async (id) => {
    await api.deletePresentation(id);
    setDecks(prev => prev.filter(d => d.id !== id));
  }, []);

  const addDeck = useCallback((presentation) => {
    setDecks(prev => {
      const exists = prev.some(d => d.id === presentation.id);
      if (exists) return prev;
      return [presentation, ...prev];
    });
  }, []);

  return { decks, loading, reload: loadDecks, removeDeck, addDeck };
}

export function useGenerate() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = useCallback(async (data) => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const json = await api.generate(data);
      setResult(json);
      return json;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, result, error };
}

export function useCredits() {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCredits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCredits();
      setCredits(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCredits(); }, [loadCredits]);

  return { credits, loading, error, reload: loadCredits };
}
