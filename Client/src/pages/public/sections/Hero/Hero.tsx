import { useRef, useEffect, useState } from "react";
import { HeroContent } from "./HeroContent";
import { PhoneMockup } from "./PhoneMockup";
import { FloatingCards } from "./FloatingCards";
import { LogoMarquee } from "./LogoMarquee";

export function Hero({ openAuth }: { openAuth: (m: "login" | "register") => void }) {
  const ref = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setIsMobile(window.innerWidth < 1024), 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setDocumentLoaded(true), 200);
    };
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  const lowPower = reduced || isMobile;

  return (
    <section
      ref={ref}
      className="section-box tint"
    >
      <div
        className="section-pad relative overflow-hidden"
        style={{ paddingTop: 40, paddingBottom: 40 }}
      >
        <div
          className="absolute inset-0 pointer-events-none animate-[fadeIn_1.2s_ease-out_forwards]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full">
          {/* Left Column: Text + CTAs */}
          <HeroContent
            openAuth={openAuth}
            reduced={reduced}
            lowPower={lowPower}
          />

          {/* Right Column: Interactive Phone + Floating Cards */}
          <div
            className="mt-4 lg:col-span-5 flex justify-center items-center relative min-h-[380px] sm:min-h-[450px] lg:min-h-[580px] z-10 w-full order-2 lg:order-2 pt-4 lg:pt-0 animate-[fadeInUp_0.6s_ease-out_0.1s_forwards] opacity-0"
          >
            <PhoneMockup
              reduced={reduced}
              isMobile={isMobile}
              lowPower={lowPower}
              documentLoaded={documentLoaded}
            />

            <FloatingCards
              lowPower={lowPower}
            />
          </div>
        </div>

        {/* Bottom trusted companies marquee */}
        <LogoMarquee />
      </div>
    </section>
  );
}
