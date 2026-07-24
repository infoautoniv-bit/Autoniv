import { useState, useEffect, useRef, type ReactNode } from "react";

interface DeferRenderProps {
  children: ReactNode;
  height?: number | string;
  rootMargin?: string;
  forceRender?: boolean;
}

export function DeferRender({
  children,
  height = 300,
  rootMargin = "150px",
  forceRender = false,
}: DeferRenderProps) {
  const [shouldRender, setShouldRender] = useState(forceRender);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceRender) {
      const handle = setTimeout(() => setShouldRender(true), 0);
      return () => clearTimeout(handle);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, forceRender]);

  return (
    <div ref={ref} style={shouldRender ? undefined : { minHeight: height, width: "100%" }}>
      {shouldRender ? children : null}
    </div>
  );
}
