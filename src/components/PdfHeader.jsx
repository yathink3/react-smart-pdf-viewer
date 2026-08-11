import React from 'react';

export const PdfHeader = ({
  isOpenable,
  showSidebar,
  setShowSidebar,
  fileName,
  showDownload,
  handleDownload,
  onClose
}) => {
  return (
    <div className="pdf-header">
      <div className="pdf-header-left">
        {isOpenable && (
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="pdf-toolbar-btn pdf-toolbar-btn-menu"
          >
            ☰
          </button>
        )}
        <span className="pdf-header-title">{fileName}</span>
      </div>
      <div className="pdf-header-right">
        {showDownload && (
          <button
            onClick={handleDownload}
            title={'Download'}
            className="pdf-toolbar-btn pdf-toolbar-btn-download"
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="pdf-toolbar-btn pdf-toolbar-btn-close"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
