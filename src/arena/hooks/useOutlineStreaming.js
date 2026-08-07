import { useState, useEffect, useRef, useCallback } from 'react';
import { jsonrepair } from 'jsonrepair';
import { getAccessToken } from '../lib/auth';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useOutlineStreaming(presentationId, enabled) {
  const [status, setStatus] = useState('');
  const [outlines, setOutlines] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const esRef = useRef(null);
  const accumulatedRef = useRef('');
  const retryCountRef = useRef(0);
  const closedRef = useRef(false);

  const closeES = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const connectionTimerRef = useRef(null);
  const dataReceivedRef = useRef(false);

  const clearConnectionTimer = useCallback(() => {
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback((presentationId, enabled, reason) => {
    if (closedRef.current || retryCountRef.current >= MAX_RETRIES) return false;
    retryCountRef.current += 1;
    console.warn(`SSE retry ${retryCountRef.current}/${MAX_RETRIES}: ${reason}`);
    setTimeout(() => {
      if (!closedRef.current && enabled) {
        openStream(presentationId);
      }
    }, RETRY_DELAY * retryCountRef.current);
    return true;
  }, []);

  const openStream = useCallback(async (presentationId) => {
    closeES();
    clearConnectionTimer();
    setStreamError(null);
    accumulatedRef.current = '';
    dataReceivedRef.current = false;

    const token = await getAccessToken();
    if (!token) {
      setStreamError('Not signed in');
      setIsStreaming(false);
      return;
    }

    const url = `/api/v1/ppt/outlines/stream/${presentationId}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    connectionTimerRef.current = setTimeout(() => {
      closeES();
      scheduleRetry(presentationId, true, 'connection timeout');
    }, 15000);

    es.addEventListener('response', (event) => {
      clearConnectionTimer();
      dataReceivedRef.current = true;

      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === 'status') {
        setStatus(data.status);
      } else if (data.type === 'chunk') {
        accumulatedRef.current += data.chunk;
        try {
          const repaired = jsonrepair(accumulatedRef.current);
          const parsed = JSON.parse(repaired);
          if (parsed.slides && Array.isArray(parsed.slides)) {
            setOutlines(parsed.slides.map((s, i) => ({
              _key: `s-${i}`,
              content: s.content || '',
              title: s.title || '',
            })));
          }
        } catch {}
      } else if (data.type === 'complete') {
        try {
          const slides = data.presentation?.outlines?.slides;
          if (slides) {
            setOutlines(slides.map((s, i) => ({
              _key: `s-${i}`,
              content: s.content || '',
              title: s.title || '',
            })));
          }
        } catch {}
        setIsStreaming(false);
        setIsComplete(true);
        setStatus('Outline ready');
        window.dispatchEvent(new CustomEvent('credits:updated'));
        closeES();
        clearConnectionTimer();
      } else if (data.type === 'closing') {
        setIsStreaming(false);
        setIsComplete(true);
        setStatus('Outline ready');
        closeES();
        clearConnectionTimer();
      } else if (data.type === 'error') {
        setStreamError(data.detail || 'Stream error');
        scheduleRetry(presentationId, true, data.detail || 'server error');
      }
    });

    es.onerror = () => {
      clearConnectionTimer();
      const readyState = es.readyState;
      if (readyState === EventSource.CLOSED) {
        if (dataReceivedRef.current) {
          setIsStreaming(false);
          setIsComplete(true);
        } else {
          const retried = scheduleRetry(presentationId, true, 'connection closed');
          if (!retried) {
            setIsStreaming(false);
            setStreamError('Connection lost. Please try again.');
          }
        }
      } else {
        const retried = scheduleRetry(presentationId, true, 'connection lost');
        if (!retried) {
          setIsStreaming(false);
          setStreamError('Connection lost. Please try again.');
        }
      }
    };
  }, [closeES, scheduleRetry, clearConnectionTimer]);

  useEffect(() => {
    closedRef.current = false;
    retryCountRef.current = 0;

    if (!presentationId || !enabled) {
      closeES();
      return;
    }

    setIsStreaming(true);
    setIsComplete(false);
    setOutlines([]);
    setStreamError(null);
    setStatus('Connecting...');
    openStream(presentationId);

    return () => {
      closedRef.current = true;
      closeES();
      clearConnectionTimer();
    };
  }, [presentationId, enabled, openStream, closeES]);

  const reset = useCallback(() => {
    closeES();
    clearConnectionTimer();
    setOutlines([]);
    setStatus('');
    setIsStreaming(false);
    setIsComplete(false);
    setStreamError(null);
    accumulatedRef.current = '';
    retryCountRef.current = 0;
    closedRef.current = true;
    dataReceivedRef.current = false;
  }, [closeES, clearConnectionTimer]);

  return { outlines, setOutlines, status, isStreaming, isComplete, streamError, reset };
}
