import { useRef, useEffect, useState } from "react";
import { LazyMotion, domAnimation, m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { HeroContent } from "./HeroContent";
import { PhoneMockup } from "./PhoneMockup";
import { FloatingCards } from "./FloatingCards";
import { LogoMarquee } from "./LogoMarquee";

export function Hero({ openAuth }: { openAuth: (m: "login" | "register") => void }) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [documentLoaded, setDocumentLoaded] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
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

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yCards = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [48, -48]);
  const yGlow = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-36, 36]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0, 0, 0] : [-3, 0, 3]);

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={ref}
        className="section-box tint"
        style={{
          contain: "layout style",
          contentVisibility: "auto",
          containIntrinsicSize: "auto 700px",
        } as React.CSSProperties}
      >
        <div
          className="section-pad relative overflow-hidden"
          style={{ paddingTop: 40, paddingBottom: 40, transform: "translate3d(0,0,0)" }}
        >
          <m.div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full">
            {/* Left Column: Text + CTAs */}
            <HeroContent
              openAuth={openAuth}
              reduced={reduced}
              lowPower={lowPower}
            />

            {/* Right Column: Interactive Phone + Floating Cards */}
            <m.div
              style={{ y: yCards, transform: "translate3d(0,0,0)" }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="mt-4 lg:col-span-5 flex justify-center items-center relative min-h-[380px] sm:min-h-[450px] lg:min-h-[580px] z-10 w-full order-2 lg:order-2 pt-4 lg:pt-0"
            >
              <PhoneMockup
                reduced={reduced}
                isMobile={isMobile}
                lowPower={lowPower}
                documentLoaded={documentLoaded}
                phoneRotate={phoneRotate}
                yGlow={yGlow}
              />

              <FloatingCards
                lowPower={lowPower}
              />
            </m.div>
          </div>

          {/* Bottom trusted companies marquee */}
          <LogoMarquee />
        </div>
      </section>
    </LazyMotion>
  );
}
