import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastListeners = new Set();

export const toast = {
  success(message, duration = 3000) {
    this._emit('success', message, duration);
  },
  error(message, duration = 4000) {
    this._emit('error', message, duration);
  },
  warn(message, duration = 3500) {
    this._emit('warn', message, duration);
  },
  info(message, duration = 3000) {
    this._emit('info', message, duration);
  },
  _emit(type, message, duration) {
    toastListeners.forEach(listener => listener(type, message, duration));
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (type, message, duration) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, type, message, duration }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    };

    toastListeners.add(handleToast);
    return () => {
      toastListeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          progress: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 border-rose-500/30 text-rose-200',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          progress: 'bg-rose-500'
        };
      case 'warn':
        return {
          bg: 'bg-amber-950/90 border-amber-500/30 text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          progress: 'bg-amber-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 border-slate-700/50 text-slate-200',
          icon: <Info className="w-5 h-5 text-sky-400" />,
          progress: 'bg-indigo-500'
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-5 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const styles = getToastStyles(t.type);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg shadow-slate-950/15 animate-in slide-in-from-left-5 fade-in duration-300 relative overflow-hidden ${styles.bg}`}
          >
            {styles.icon}
            <div className="flex-1 text-xs font-semibold leading-relaxed pt-0.5 select-none text-right">
              {t.message}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
            <div 
              className={`absolute bottom-0 right-0 h-1 transition-all ease-linear ${styles.progress}`}
              style={{
                width: '100%',
                animation: `shrinkWidth ${t.duration}ms linear forwards`,
                transformOrigin: 'right'
              }}
            />
          </div>
        );
      })}
      
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
