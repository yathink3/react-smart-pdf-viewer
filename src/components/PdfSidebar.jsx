import React from 'react';

export const PdfSidebar = ({
  pageCount,
  isShowSidebar,
  activePageIndex,
  scrollToPage,
  thumbRefs,
}) => {
  return (
    <div className={`pdf-sidebar-container ${isShowSidebar ? 'open' : ''}`.trim()}>
      {Array.from({ length: pageCount }, (_, i) => (
        <div
          key={`thumb-${i}`}
          onClick={() => scrollToPage(i)}
          className={`pdf-thumb-wrapper ${activePageIndex === i ? 'active' : ''}`.trim()}
        >
          <canvas
            ref={el => { thumbRefs.current[i] = { current: el }; }}
            className="pdf-thumb-canvas"
          />
          <div className="pdf-thumb-label">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
};
