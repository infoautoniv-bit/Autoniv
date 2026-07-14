import { useState, useEffect, useRef, type ReactNode } from "react";

interface DeferRenderProps {
  children: ReactNode;
  height?: number | string;
  rootMargin?: string;
}

export function DeferRender({
  children,
  height = 300,
  rootMargin = "150px",
}: DeferRenderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [rootMargin]);

  return (
    <div ref={ref} style={shouldRender ? undefined : { minHeight: height, width: "100%" }}>
      {shouldRender ? children : null}
    </div>
  );
}
