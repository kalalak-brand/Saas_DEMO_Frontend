// src/components/Modal.tsx

import React from 'react';

// Define the props for the Modal component using a TypeScript interface
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Don't render the modal if it's not open
  if (!isOpen) {
    return null;
  }

  return (
    // Main modal overlay (the backdrop)
    // It's fixed to cover the entire viewport.
    <div
      onClick={onClose} // Closes the modal when the backdrop is clicked
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/15 "
    >
      {/* Modal content container */}
      {/* We stop propagation to prevent the modal from closing when clicking inside the content area. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-xl"
      >
        {/* The actual content of the modal, passed in as children */}
        {children}

        {/* Absolute-positioned close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
          aria-label="Close modal"
        >
          {/* An 'X' icon using SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Modal;