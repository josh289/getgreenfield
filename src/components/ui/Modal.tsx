import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-black border border-gray-800 p-6 shadow-[0_0_40px_rgba(0,217,255,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#00d9ff] hover:text-[#00d9ff]/80 transition-all hover:shadow-[0_0_10px_rgba(0,217,255,0.3)]"
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;