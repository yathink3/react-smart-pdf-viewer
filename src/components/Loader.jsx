import React from 'react';

export const Loader = ({ message }) => (
  <div className="pdf-viewer-loader">
    <svg width="40" height="40" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
    <span className="pdf-viewer-loader-text">{message}</span>
  </div>
);
