import { useState, useEffect, useRef } from 'react';

export const usePdfScrollObserver = (pageCount, viewMode, mainContainerRef, mainRefs, isMobile, setShowSidebar) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const isScrollingRef = useRef(false);

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
      if (ref?.current?.parentElement) {
        observer.observe(ref.current.parentElement);
      }
    });

    return () => observer.disconnect();
  }, [pageCount, viewMode, mainRefs, mainContainerRef]);

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
      if (isMobile) {
        setShowSidebar(false);
      }
    }
  };

  return { activePageIndex, scrollToPage };
};
