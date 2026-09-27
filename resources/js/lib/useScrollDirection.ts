import { useEffect, useState } from 'react';

/** True once the page has scrolled past `threshold` and the last move was downward. */
export function useScrolledDown(threshold = 80): boolean {
    const [scrolledDown, setScrolledDown] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;

        function onScroll() {
            const y = window.scrollY;
            if (y <= threshold) {
                setScrolledDown(false);
            } else if (y > lastY) {
                setScrolledDown(true);
            } else if (y < lastY) {
                setScrolledDown(false);
            }
            lastY = y;
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrolledDown;
}
