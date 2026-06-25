import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

let confirmListeners = new Set();

export const confirmModal = {
  show({ title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', isDanger = true }) {
    return new Promise((resolve) => {
      confirmListeners.forEach(listener => 
        listener({ title, message, confirmText, cancelText, isDanger, resolve })
      );
    });
  }
};

export function ConfirmModalContainer() {
  const [modal, setModal] = useState(null); // { title, message, confirmText, cancelText, isDanger, resolve }

  useEffect(() => {
    const handleConfirm = (config) => {
      setModal(config);
    };

    confirmListeners.add(handleConfirm);
    return () => {
      confirmListeners.delete(handleConfirm);
    };
  }, []);

  if (!modal) return null;

  const handleAction = (value) => {
    modal.resolve(value);
    setModal(null);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${modal.isDanger ? 'text-rose-500' : 'text-indigo-500'}`} />
            {modal.title}
          </h3>
          <button
            onClick={() => handleAction(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-right">
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {modal.message}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex gap-2 justify-end border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleAction(false)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            {modal.cancelText}
          </button>
          <button
            type="button"
            onClick={() => handleAction(true)}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm ${
              modal.isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
