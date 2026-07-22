import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${sizeClasses[size]} bg-[#0d0e24] border border-[#252648] rounded-2xl shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#252648]">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#13142e] border border-[#252648] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1b3a] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;