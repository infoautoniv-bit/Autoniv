declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GOOGLE_ADS_CONVERSION_ID = 'AW-18349392281';
export const GOOGLE_ADS_CONVERSION_LABEL = 'ThqqCNrzwtYcEJmD1q1E';

/**
 * Tracks lead form submission conversion in Google Ads
 * @param value Monitory value of conversion (default 1.0)
 * @param currency Currency code (default 'INR')
 */
export function trackLeadFormConversion(value = 1.0, currency = 'INR') {
  if (typeof window !== 'undefined') {
    const conversionData = {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      value: value,
      currency: currency,
    };
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', conversionData);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(['event', 'conversion', conversionData]);
    }
  }
}

let lastTrackedPath: string | null = null;

/**
 * Tracks page view in Google Ads / Analytics for SPA navigation.
 * Deduplicates rapid identical path events to prevent rate-limit errors in Google Tag.
 * @param path Relative path (e.g. /pricing)
 */
export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  if (lastTrackedPath === path) return;
  lastTrackedPath = path;

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      send_to: GOOGLE_ADS_CONVERSION_ID,
    });
    const gaId = import.meta.env.VITE_GA_ID;
    if (gaId && gaId.startsWith('G-')) {
      window.gtag('event', 'page_view', {
        page_path: path,
        send_to: gaId,
      });
    }
  }
}


