import React, { useEffect, useRef, useState } from 'react';
import pdfjs from '@bundled-es-modules/pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Reusable Loader Component
const Loader = ({ message }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '12px',
      color: '#8ab4f8',
      height: '100%',
    }}>
    <svg width='40' height='40' viewBox='0 0 50 50' style={{ animation: 'rotate 2s linear infinite' }}>
      <circle
        cx='25'
        cy='25'
        r='20'
        fill='none'
        stroke='currentColor'
        strokeWidth='5'
        strokeLinecap='round'
        style={{
          strokeDasharray: '90, 150',
          strokeDashoffset: '0',
          animation: 'dash 1.5s ease-in-out infinite',
        }}
      />
    </svg>
    <style>{`
      @keyframes rotate { 100% { transform: rotate(360deg); } }
      @keyframes dash {
        0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
        100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
      }
    `}</style>
    <span style={{ fontSize: '14px', fontWeight: '500' }}>{message}</span>
  </div>
);

const ReactSmartPdfViewer = ({
  fileUrl,
  viewMode = 'canvas',
  renderPlugins = [],
  scale = 1.5,
  maxPages = 20,
  nativeView = false,
  clarityFactor = 2,
  padding = 20,
  className = '',
  containerStyle = {},
  onClose,
  showDownload = false,
  downloadFileName = '',
  noRecordMessage = 'No Record Found',
  trimSpace = false,
}) => {
  const [pageCount, setPageCount] = useState(0);
  const [linkOverlays, setLinkOverlays] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pdfTitle, setPdfTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  const [internalPdfUrl, setInternalPdfUrl] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isRendering, setIsRendering] = useState(false); // New Rendering State

  const mainRefs = useRef([]);
  const thumbRefs = useRef([]);
  const mainContainerRef = useRef(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (viewMode === 'viewer') {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [viewMode]);

  useEffect(() => {
    if (!fileUrl) return;

    const processFile = async () => {
      setIsConverting(true);
      const plugin = Array.isArray(renderPlugins) && renderPlugins.find(p => p.canHandle(fileUrl));

      try {
        if (plugin) {
          const convertedUrl = await plugin.render(fileUrl);
          setInternalPdfUrl(convertedUrl);
        } else {
          setInternalPdfUrl(fileUrl);
        }
      } catch (err) {
        console.error(`Conversion failed in plugin: ${plugin?.name || 'unknown'}`, err);
        setInternalPdfUrl(fileUrl);
      } finally {
        setIsConverting(false);
      }
    };

    processFile();

    return () => {
      if (internalPdfUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(internalPdfUrl);
      }
    };
  }, [fileUrl, renderPlugins]);

  useEffect(() => {
    if (!internalPdfUrl) return;

    if (nativeView) {
      const renderPDF = async () => {
        try {
          const loadingTask = pdfjs.getDocument(internalPdfUrl);
          const pdf = await loadingTask.promise;
          const metadata = await pdf.getMetadata();
          setPdfTitle(metadata.info?.Title || '');
        } catch (err) {
          console.error('Error loading PDF:', err);
        }
      };
      renderPDF();
      return;
    }

    const renderPDF = async () => {
      setIsRendering(true); // Start rendering state
      try {
        const loadingTask = pdfjs.getDocument(internalPdfUrl);
        const pdf = await loadingTask.promise;
        const metadata = await pdf.getMetadata();
        setPdfTitle(metadata.info?.Title || '');
        const totalPages = Math.min(pdf.numPages, maxPages);
        setPageCount(totalPages);
        const allOverlays = [];

        let maxPageHeight = 0;
        if (!trimSpace) {
          for (let i = 0; i < totalPages; i++) {
            const page = await pdf.getPage(i + 1);
            const baseViewport = page.getViewport({ scale: 1 });
            const displayScale = (baseViewport.width * scale) / baseViewport.width;
            const renderViewport = page.getViewport({ scale: displayScale * clarityFactor });
            if (renderViewport.height > maxPageHeight) {
              maxPageHeight = renderViewport.height;
            }
          }
        }

        for (let i = 0; i < totalPages; i++) {
          const page = await pdf.getPage(i + 1);
          const baseViewport = page.getViewport({ scale: 1 });
          const displayScale = (baseViewport.width * scale) / baseViewport.width;
          const renderViewport = page.getViewport({ scale: displayScale * clarityFactor });

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = renderViewport.width;
          tempCanvas.height = renderViewport.height;
          await page.render({ canvasContext: tempCanvas.getContext('2d'), viewport: renderViewport }).promise;

          const getVerticalCrop = canvas => {
            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;
            const imageData = ctx.getImageData(0, 0, width, height).data;
            let rMin = height,
              rMax = 0,
              foundContent = false;
            for (let y = 0; y < height; y += 4) {
              for (let x = 0; x < width; x += 4) {
                const i = (y * width + x) * 4;
                if (imageData[i] < 250 || imageData[i + 1] < 250 || imageData[i + 2] < 250) {
                  if (y < rMin) rMin = y;
                  if (y > rMax) rMax = y;
                  foundContent = true;
                }
              }
            }
            if (!foundContent) return { y: 0, h: height };
            return { y: Math.max(0, rMin - padding), h: Math.min(height, rMax + padding) - Math.max(0, rMin - padding) };
          };

          const vCrop = trimSpace ? getVerticalCrop(tempCanvas) : { y: 0, h: maxPageHeight };

          const mainCanvas = mainRefs.current[i]?.current;
          if (mainCanvas) {
            mainCanvas.width = renderViewport.width;
            mainCanvas.height = vCrop.h;
            const ctx = mainCanvas.getContext('2d');
            if (!trimSpace) ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            ctx.drawImage(tempCanvas, 0, vCrop.y, renderViewport.width, tempCanvas.height, 0, 0, renderViewport.width, tempCanvas.height);
            if (viewMode === 'canvas') mainCanvas.style.maxWidth = `${renderViewport.width / clarityFactor}px`;
          }

          if (viewMode === 'viewer' && !isMobile) {
            const thumbCanvas = thumbRefs.current[i]?.current;
            if (thumbCanvas) {
              thumbCanvas.width = renderViewport.width * 0.15;
              thumbCanvas.height = vCrop.h * 0.15;
              const tCtx = thumbCanvas.getContext('2d');
              if (!trimSpace) tCtx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
              tCtx.drawImage(tempCanvas, 0, vCrop.y, renderViewport.width, tempCanvas.height, 0, 0, thumbCanvas.width, tempCanvas.height * 0.15);
            }
          }

          const annotations = await page.getAnnotations();
          const displayViewport = page.getViewport({ scale: displayScale });
          const displayCropY = vCrop.y / clarityFactor;
          const displayCropH = vCrop.h / clarityFactor;

          allOverlays.push(
            annotations
              .filter(ann => ann.subtype === 'Link')
              .map(ann => {
                const rect = displayViewport.convertToViewportRectangle(ann.rect);
                return {
                  key: `link-${i + 1}-${ann.id}`,
                  url: ann.url || ann.unsafeUrl || (ann.dest ? `#${ann.dest}` : ''),
                  style: {
                    position: 'absolute',
                    left: `${(Math.min(rect[0], rect[2]) / displayViewport.width) * 100}%`,
                    top: `${((Math.min(rect[1], rect[3]) - displayCropY) / displayCropH) * 100}%`,
                    width: `${(Math.abs(rect[2] - rect[0]) / displayViewport.width) * 100}%`,
                    height: `${(Math.abs(rect[3] - rect[1]) / displayCropH) * 100}%`,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  },
                };
              })
          );
        }
        setLinkOverlays(allOverlays);
      } catch (err) {
        console.error('PDF render error:', err);
      } finally {
        setIsRendering(false); // End rendering state
      }
    };
    renderPDF();
  }, [internalPdfUrl, nativeView, scale, maxPages, isMobile, viewMode, clarityFactor, padding]);

  useEffect(() => {
    if (pageCount === 0 || viewMode !== 'viewer' || !mainContainerRef.current) return;
    const observerOptions = { root: mainContainerRef.current, rootMargin: '-10% 0px -70% 0px', threshold: 0 };
    const observer = new IntersectionObserver(entries => {
      if (isScrollingRef.current) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-page-index'));
          setActivePageIndex(index);
        }
      });
    }, observerOptions);
    mainRefs.current.forEach(ref => {
      if (ref?.current?.parentElement) observer.observe(ref.current.parentElement);
    });
    return () => observer.disconnect();
  }, [pageCount, viewMode]);

  const scrollToPage = index => {
    const container = mainContainerRef.current;
    const targetPage = mainRefs.current[index]?.current?.parentElement;
    if (container && targetPage) {
      isScrollingRef.current = true;
      setActivePageIndex(index);
      container.scrollTo({ top: targetPage.offsetTop - container.offsetTop - 10, behavior: 'smooth' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
      if (isMobile) setShowSidebar(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    const finalName = downloadFileName || pdfTitle || 'document.pdf';
    link.download = finalName.endsWith('.pdf') ? finalName : `${finalName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toolbarButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  };

  // Logic: Show loader if converting OR if starting to render PDF pages

  const loaderMessage = isConverting ? 'Converting document...' : 'Preparing PDF viewer...';
  const isLoading = isConverting || isRendering;

  const fileName = pdfTitle || (fileUrl?.includes('/') ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) : 'Document');

  if (nativeView) {
    if (viewMode === 'viewer') {
      const nativeStyle = {
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#202124',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999999,
        flexDirection: 'column',
        ...containerStyle,
      };
      const isOpenable = !isMobile;
      const navPanesParam = showSidebar ? 1 : 0;

      return (
        <div className={`pdf-viewer-mode native-mode ${className}`} style={nativeStyle}>
          {/* HEADER SECTION */}
          <div
            style={{
              height: '6vh', // Changed from 48px to vh
              minHeight: '40px', // Safety floor for high zoom levels
              background: '#323639',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1vw', // Scalable padding
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              zIndex: 20,
              flexShrink: 0, // Prevents header from collapsing
            }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isOpenable && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  style={{ ...toolbarButtonStyle, paddingLeft: '8px', paddingRight: '8px', paddingTop: '0px', paddingBottom: '2px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  ☰
                </button>
              )}
              <span style={{ color: 'white', marginLeft: '15px', fontSize: '14px', fontWeight: '500' }}>{fileName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {showDownload && (
                <button
                  onClick={handleDownload}
                  title={'Download'}
                  style={{ ...toolbarButtonStyle, paddingTop: '8px', paddingBottom: '8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 22 22'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='7 10 12 15 17 10' />
                    <line x1='12' y1='15' x2='12' y2='3' />
                  </svg>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label='Close'
                  style={{
                    ...toolbarButtonStyle,
                    fontSize: '24px',
                    marginTop: '2px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    paddingTop: '0px',
                    paddingBottom: '0px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* PDF VIEWPORT SECTION */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#525659' }}>
            {isLoading && <Loader message={loaderMessage} />}
            {!isLoading && !internalPdfUrl && <div style={{ padding: 20 }}>{noRecordMessage}</div>}
            {!isLoading && internalPdfUrl && (
              <embed
                key={`pdf-embed-${navPanesParam}-${isOpenable}`}
                title={fileName}
                src={`${internalPdfUrl}#navpanes=${navPanesParam}`}
                type='application/pdf'
                style={{
                  width: '100%',
                  height: `calc(100% + 6.4vh)`, // Use 100% of the flex-grow container
                  marginTop: `-6.4vh`,
                  border: 'none',
                }}
              />
            )}
          </div>
        </div>
      );
    }

    if (isLoading) return <Loader message={loaderMessage} />;
    if (!internalPdfUrl) return <div style={{ padding: 20 }}>{noRecordMessage}</div>;

    return (
      <embed
        title={fileName}
        src={`${internalPdfUrl}#toolbar=0&navpanes=0`}
        type='application/pdf'
        style={{ height: '90vh', width: '100%', border: 'none' }}
      />
    );
  }

  if (viewMode === 'viewer') {
    const isOpenable = !isMobile && pageCount !== 0;
    const isShowSidebar = showSidebar && pageCount !== 0;

    return (
      <div
        className={`pdf-viewer-mode ${className}`}
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          background: '#202124',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999999,
          ...containerStyle,
        }}>
        <div
          className='pdf-sidebar'
          style={{
            width: isShowSidebar ? '240px' : '0px',
            opacity: isShowSidebar ? 1 : 0,
            visibility: isShowSidebar ? 'visible' : 'hidden',
            background: '#2c2c2c',
            overflowY: 'auto',
            borderRight: '1px solid #3c4043',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'width 0.3s ease, opacity 0.2s ease',
            padding: isShowSidebar ? '20px 0' : '0',
          }}>
          {Array.from({ length: pageCount }, (_, i) => (
            <div
              key={`thumb-${i}`}
              onClick={() => scrollToPage(i)}
              style={{
                marginBottom: '24px',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '10px',
                borderRadius: '4px',
                background: activePageIndex === i ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}>
              <canvas
                ref={el => (thumbRefs.current[i] = { current: el })}
                style={{
                  width: '140px',
                  boxShadow: activePageIndex === i ? '0 0 0 3px #8ab4f8' : '0 4px 12px rgba(0,0,0,0.5)',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  color: activePageIndex === i ? '#8ab4f8' : '#bdc1c6',
                  fontSize: '12px',
                  marginTop: '8px',
                  fontWeight: activePageIndex === i ? 'bold' : '500',
                }}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              height: '48px',
              background: '#323639',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              zIndex: 10,
            }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isOpenable && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  style={{ ...toolbarButtonStyle, paddingLeft: '8px', paddingRight: '8px', paddingTop: '0px', paddingBottom: '2px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  ☰
                </button>
              )}
              <span style={{ color: 'white', marginLeft: '15px', fontSize: '14px', fontWeight: '500' }}>{fileName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {showDownload && (
                <button
                  onClick={handleDownload}
                  title={'Download'}
                  style={{ ...toolbarButtonStyle, paddingTop: '8px', paddingBottom: '8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 22 22'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='7 10 12 15 17 10' />
                    <line x1='12' y1='15' x2='12' y2='3' />
                  </svg>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label='Close'
                  style={{
                    ...toolbarButtonStyle,
                    fontSize: '24px',
                    marginTop: '2px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    paddingTop: '0px',
                    paddingBottom: '0px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  &times;
                </button>
              )}
            </div>
          </div>

          <div
            ref={mainContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: !isOpenable ? '10px 5px' : '30px 20px',
              scrollBehavior: 'smooth',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
            {/* Show internal loader inside main container if pages are still drawing */}
            {isLoading && <Loader message={loaderMessage} />}
            {!isLoading && (!internalPdfUrl || pageCount === 0) && <div style={{ padding: 20 }}>{noRecordMessage}</div>}
            <div style={{ width: '100%', maxWidth: '1000px', display: isLoading ? 'none' : 'block' }}>
              {Array.from({ length: pageCount }, (_, i) => (
                <div
                  key={`p-${i}`}
                  data-page-index={i}
                  style={{
                    position: 'relative',
                    marginBottom: !isOpenable ? '10px' : '20px',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    lineHeight: 0,
                    borderRadius: '6px',
                  }}>
                  <canvas ref={el => (mainRefs.current[i] = { current: el })} style={{ width: '100%', display: 'block', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {linkOverlays[i]?.map(link => (
                      <a
                        key={link.key}
                        href={link.url}
                        title={link.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{ ...link.style, pointerEvents: 'auto' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-canvas-mode ${className}`} style={{ width: '100%', ...containerStyle }} title={fileName}>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader message={loaderMessage} />
        </div>
      )}
      {!isLoading && (!internalPdfUrl || pageCount === 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ padding: 20 }}>{noRecordMessage}</div>
        </div>
      )}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={`canvas-p-${i}`}
            style={{
              position: 'relative',
              margin: '0 auto 24px auto',
              padding: '0.80rem 0.25rem',
              maxWidth: 'fit-content',
              background: '#fff',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: `0 -2px 4px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.08)`,
            }}>
            <canvas ref={el => (mainRefs.current[i] = { current: el })} style={{ display: 'block', width: '100%', height: 'auto' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {linkOverlays[i]?.map(link => (
                <a
                  key={link.key}
                  href={link.url}
                  title={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ ...link.style, pointerEvents: 'auto' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReactSmartPdfViewer;
