'use client';

import { useEffect, useRef } from 'react';

/**
 * Cursor-follow aura blob with mix-blend-mode: difference. Desktop / fine-
 * pointer only (hidden via media query on touch devices and under reduced-
 * motion). Position written as CSS vars so the browser handles the transition.
 */
export default function AuraBlob() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e: PointerEvent) {
      if (!el) return;
      el.style.setProperty('--mogster-blob-x', `${e.clientX}px`);
      el.style.setProperty('--mogster-blob-y', `${e.clientY}px`);
      if (el.dataset.visible !== 'true') {
        el.dataset.visible = 'true';
      }
    }

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return <div ref={ref} aria-hidden="true" className="mogster-blob" />;
}
