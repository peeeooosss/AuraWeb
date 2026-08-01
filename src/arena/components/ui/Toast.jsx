import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';

let toastId = 0;

const TYPE_CONFIG = {
  success: {
    icon: Check,
    bg: 'bg-emerald-500/10 border-emerald-400/30',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
  },
  error: {
    icon: X,
    bg: 'bg-red-500/10 border-red-400/30',
    text: 'text-red-300',
    iconBg: 'bg-red-500/20',
  },
  'xp-gain': {
    icon: Zap,
    bg: 'bg-amber-500/10 border-amber-400/30',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
  },
  info: {
    icon: Check,
    bg: 'bg-cyan-500/10 border-cyan-400/30',
    text: 'text-cyan-300',
    iconBg: 'bg-cyan-500/20',
  },
};

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
        glass-panel border shadow-lg shadow-black/30
        ${config.bg}
      `}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}>
        <Icon size={14} className={config.text} />
      </div>
      <p className={`text-sm font-medium ${config.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 p-1 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    xp: (msg, dur) => addToast(msg, 'xp-gain', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return { toasts, toast, removeToast };
}
