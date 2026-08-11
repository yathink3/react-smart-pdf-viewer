import { useState, useEffect, useRef } from 'react';
import pdfjs from '@bundled-es-modules/pdfjs-dist';

export const usePdfRenderer = ({
  internalPdfUrl,
  scale,
  maxPages,
  clarityFactor,
  padding,
  trimSpace,
  viewMode,
  isMobile,
  setPdfTitle,
}) => {
  const [pageCount, setPageCount] = useState(0);
  const [linkOverlays, setLinkOverlays] = useState([]);
  const [isRendering, setIsRendering] = useState(false);

  const mainRefs = useRef([]);
  const thumbRefs = useRef([]);

  useEffect(() => {
    if (!internalPdfUrl) return;

    const renderPDF = async () => {
      setIsRendering(true);
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
            let rMin = height, rMax = 0, foundContent = false;
            for (let y = 0; y < height; y += 4) {
              for (let x = 0; x < width; x += 4) {
                const idx = (y * width + x) * 4;
                if (imageData[idx] < 250 || imageData[idx + 1] < 250 || imageData[idx + 2] < 250) {
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
                    left: `${(Math.min(rect[0], rect[2]) / displayViewport.width) * 100}%`,
                    top: `${((Math.min(rect[1], rect[3]) - displayCropY) / displayCropH) * 100}%`,
                    width: `${(Math.abs(rect[2] - rect[0]) / displayViewport.width) * 100}%`,
                    height: `${(Math.abs(rect[3] - rect[1]) / displayCropH) * 100}%`,
                  },
                };
              })
          );
        }
        setLinkOverlays(allOverlays);
      } catch (err) {
        console.error('PDF render error:', err);
      } finally {
        setIsRendering(false);
      }
    };

    renderPDF();
  }, [internalPdfUrl, scale, maxPages, isMobile, viewMode, clarityFactor, padding, trimSpace, setPdfTitle]);

  return { pageCount, linkOverlays, isRendering, mainRefs, thumbRefs };
};
