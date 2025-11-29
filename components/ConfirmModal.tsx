import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="w-96 bg-[#0b1220] border border-slate-700 rounded p-4 shadow-2xl">
        <div className="text-lg font-bold text-white mb-2">{title || 'Confirm'}</div>
        <div className="text-sm text-slate-300 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 bg-slate-800 text-slate-200 rounded">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
