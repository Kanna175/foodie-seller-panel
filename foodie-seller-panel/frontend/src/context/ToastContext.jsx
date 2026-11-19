import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const api = useMemo(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-up pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-card"
          >
            {t.type === 'success' ? (
              <CheckCircle2 size={18} className="shrink-0 text-green-400" />
            ) : (
              <XCircle size={18} className="shrink-0 text-brand-500" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
