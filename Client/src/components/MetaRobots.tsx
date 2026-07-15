import { useEffect } from 'react';

type RobotsContent = 'index, follow' | 'noindex, nofollow' | 'noindex, follow' | 'index, nofollow';

interface MetaRobotsProps {
  content: RobotsContent;
}

export function MetaRobots({ content }: MetaRobotsProps) {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = content;

    return () => {
      meta.content = 'index, follow';
    };
  }, [content]);

  return null;
}

export const PUBLIC_ROBOTS = 'index, follow';
export const PRIVATE_ROBOTS = 'noindex, nofollow';
