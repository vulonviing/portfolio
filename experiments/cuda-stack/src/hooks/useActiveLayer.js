import { useEffect, useState } from 'react';

// Watches a list of section elements and reports which one currently sits in
// the horizontal band near the vertical center of the viewport — that's the
// "active" layer the sticky rail on the left should highlight.
export default function useActiveLayer(sectionRefs) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const elements = sectionRefs.map((ref) => ref.current).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          const index = elements.indexOf(visible[0].target);
          if (index !== -1) setActiveIndex(index);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRefs.length]);

  return activeIndex;
}
