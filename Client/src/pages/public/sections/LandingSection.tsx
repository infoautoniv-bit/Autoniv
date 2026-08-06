import { useState, lazy, Suspense, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DeferRender } from "../../../components/DeferRender";
import { Hero } from "./Hero/Hero";

import { PublicNavbar } from "../../../components/PublicNavbar";
import { USPSlider } from "./USPSlider";
const Footer = lazy(() => import("../Footer"));

const Features = lazy(() => import("./Features").then(m => ({ default: m.Features })));
const Services = lazy(() => import("./ServicesSection").then(m => ({ default: m.Services })));

const Demo = lazy(() => import("./Demo/Demo").then(m => ({ default: m.Demo })));

const AuthDialog = lazy(() =>
  import("../AuthDialog").then((m) => ({ default: m.AuthDialog }))
);
const HowItWorks = lazy(() => import("./HowItWorks").then(m => ({ default: m.HowItWorks })));
const Comparison = lazy(() => import("./Comparison").then(m => ({ default: m.Comparison })));
const Industry = lazy(() => import("./Industry").then(m => ({ default: m.Industry })));
const Testimonials = lazy(() => import("./Testimonials").then(m => ({ default: m.Testimonials })));
const CaseStudiesSection = lazy(() => import("./CaseStudiesSection").then(m => ({ default: m.CaseStudiesSection })));
const CTABanner = lazy(() => import("./CTABanner").then(m => ({ default: m.CTABanner })));
const FAQ = lazy(() => import("./FAQ").then(m => ({ default: m.FAQ })));
const Blog = lazy(() => import("./Blog").then(m => ({ default: m.Blog })));
const Pricing = lazy(() => import("./Pricing").then(m => ({ default: m.Pricing })));
const Contact = lazy(() => import("./Contact").then(m => ({ default: m.Contact })));

type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

export function LandingSection() {
  const [authDialog, setAuthDialog] = useState<AuthMode | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const location = useLocation();
  const forceRender = !!location.hash;

  useEffect(() => {
    if (location.hash) {
      const rawHash = location.hash.replace('#', '');
      const scroll = () => {
        const el =
          document.getElementById(rawHash) ||
          document.getElementById(rawHash + 's') ||
          (rawHash.endsWith('s') ? document.getElementById(rawHash.slice(0, -1)) : null);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      };
      const timer = setTimeout(scroll, 250);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  const openAuth = useCallback((mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthDialog(mode);
  }, []);

  const closeAuth = useCallback(() => setAuthDialog(null), []);

  return (
    <div className="landing-page" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Suspense fallback={null}>
        <PublicNavbar />
      </Suspense>
      <main>
        <div className="page-bg" style={{ paddingTop: 120, paddingBottom: 8 }}>
          <div className="box-wrap">
            <Suspense fallback={null}>
              <USPSlider />
            </Suspense>
            <Hero openAuth={openAuth} />
            <DeferRender height={600} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 600 }} />}>
                <Demo />
              </Suspense>
            </DeferRender>
            <DeferRender height={500} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                <div id="feature">
                  <Features />
                </div>
              </Suspense>
            </DeferRender>
            <DeferRender height={600} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 600 }} />}>
                <Services openAuth={openAuth} />
              </Suspense>
            </DeferRender>
            <DeferRender height={500} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                <Comparison />
              </Suspense>
            </DeferRender>
            <div id="how-it-works">
              <DeferRender height={600} forceRender={forceRender}>
                <Suspense fallback={<div style={{ minHeight: 600 }} />}>
                  <HowItWorks openAuth={openAuth} />
                </Suspense>
              </DeferRender>
            </div>
            <DeferRender height={600} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 600 }} />}>
                <Industry />
              </Suspense>
            </DeferRender>
            <DeferRender height={500} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                <CaseStudiesSection />
              </Suspense>
            </DeferRender>
            <DeferRender height={500} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                <Blog />
              </Suspense>
            </DeferRender>
            <DeferRender height={600} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 600 }} />}>
                <Pricing openAuth={openAuth} />
              </Suspense>
            </DeferRender>
            <div id="contact">
              <DeferRender height={500} forceRender={forceRender}>
                <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                  <Contact />
                </Suspense>
              </DeferRender>
            </div>

            <DeferRender height={500} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 500 }} />}>
                <Testimonials />
              </Suspense>
            </DeferRender>
            <DeferRender height={400} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                <FAQ />
              </Suspense>
            </DeferRender>
            <DeferRender height={300} forceRender={forceRender}>
              <Suspense fallback={<div style={{ minHeight: 300 }} />}>
                <CTABanner openAuth={openAuth} />
              </Suspense>
            </DeferRender>
          </div>
        </div>
      </main>
      <Suspense fallback={<div style={{ minHeight: 200 }} />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <AuthDialog
          isOpen={authDialog !== null}
          mode={authMode}
          onClose={closeAuth}
          onSwitch={(m) => {
            setAuthMode(m);
            setAuthDialog(m);
          }}
        />
      </Suspense>
    </div>
  );
}
