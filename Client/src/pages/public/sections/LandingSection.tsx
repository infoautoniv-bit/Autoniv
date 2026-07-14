import { useState, lazy, Suspense, useCallback } from "react";
import { PublicNavbar } from "../../../components/PublicNavbar";
import Footer from "../Footer";
import { USPSlider } from "./USPSlider";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Services } from "./ServicesSection";
import { VoiceAgentService, ChatAgentService } from "./services";

const AuthDialog = lazy(() =>
  import("../AuthDialog").then((m) => ({ default: m.AuthDialog }))
);

const Demo = lazy(() => import("./Demo").then((m) => ({ default: m.Demo })));
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
  const [activeUseCase, setActiveUseCase] = useState(0);

  const openAuth = useCallback((mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthDialog(mode);
  }, []);

  const closeAuth = useCallback(() => setAuthDialog(null), []);

  return (
    <div className="landing-page" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <PublicNavbar />
      <div className="page-bg" style={{ paddingTop: 120, paddingBottom: 8 }}>
        <div className="box-wrap">
          <USPSlider />
          <Hero openAuth={openAuth} />
          <Suspense fallback={<div style={{ minHeight: 400 }} />}>
            <Demo />
          </Suspense>
            <div id="features">
              <Features />
            </div>
            <Services openAuth={openAuth} />
            <VoiceAgentService />
            <ChatAgentService />
          <Suspense fallback={<div style={{ minHeight: 500 }} />}>
            <Comparison />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 600 }} />}>
            <div id="how-it-works">
              <HowItWorks openAuth={openAuth} />
            </div>
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 600 }} />}>
            <Industry activeUseCase={activeUseCase} setActiveUseCase={setActiveUseCase} openAuth={openAuth} />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 500 }} />}>
            <CaseStudiesSection />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 500 }} />}>
            <Blog />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 600 }} />}>
            <Pricing />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 500 }} />}>
            <Contact />
          </Suspense>

          <Suspense fallback={<div style={{ minHeight: 500 }} />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 400 }} />}>
            <FAQ />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 300 }} />}>
            <CTABanner openAuth={openAuth} />
          </Suspense>
        </div>
      </div>
      <Footer />

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
