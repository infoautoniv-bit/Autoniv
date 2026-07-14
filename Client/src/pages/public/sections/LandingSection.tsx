import { useState, lazy, Suspense, useCallback } from "react";
import { PublicNavbar } from "../../../components/PublicNavbar";
import Footer from "../Footer";
import { USPSlider } from "./USPSlider";
import { Features } from "./Features";
import { Services } from "./ServicesSection";
import { VoiceAgentService, ChatAgentService } from "./services";
import { DeferRender } from "../../../components/DeferRender";

const Hero = lazy(() => import("./Hero/Hero").then(m => ({ default: m.Hero })));
const Demo = lazy(() => import("./Demo/Demo").then(m => ({ default: m.Demo })));

function HeroSkeleton() {
  return (
    <div style={{ minHeight: "700px", background: "linear-gradient(rgba(37,99,235,0.02) 1px,transparent 1px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", animation: "socialBounce 1s linear infinite" }} />
    </div>
  );
}

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
          <Suspense fallback={<HeroSkeleton />}>
            <Hero openAuth={openAuth} />
          </Suspense>
          <DeferRender height={600}>
            <Suspense fallback={<div style={{ minHeight: 600 }} />}>
              <Demo />
            </Suspense>
          </DeferRender>
            <div id="features">
              <Features />
            </div>
            <Services openAuth={openAuth} />
            <VoiceAgentService />
            <ChatAgentService />
          <DeferRender height={500}>
            <Suspense fallback={<div style={{ minHeight: 500 }} />}>
              <Comparison />
            </Suspense>
          </DeferRender>
          <DeferRender height={600}>
            <Suspense fallback={<div style={{ minHeight: 600 }} />}>
              <div id="how-it-works">
                <HowItWorks openAuth={openAuth} />
              </div>
            </Suspense>
          </DeferRender>
          <DeferRender height={600}>
            <Suspense fallback={<div style={{ minHeight: 600 }} />}>
              <Industry activeUseCase={activeUseCase} setActiveUseCase={setActiveUseCase} openAuth={openAuth} />
            </Suspense>
          </DeferRender>
          <DeferRender height={500}>
            <Suspense fallback={<div style={{ minHeight: 500 }} />}>
              <CaseStudiesSection />
            </Suspense>
          </DeferRender>
          <DeferRender height={500}>
            <Suspense fallback={<div style={{ minHeight: 500 }} />}>
              <Blog />
            </Suspense>
          </DeferRender>
          <DeferRender height={600}>
            <Suspense fallback={<div style={{ minHeight: 600 }} />}>
              <Pricing />
            </Suspense>
          </DeferRender>
          <DeferRender height={500}>
            <Suspense fallback={<div style={{ minHeight: 500 }} />}>
              <Contact />
            </Suspense>
          </DeferRender>

          <DeferRender height={500}>
            <Suspense fallback={<div style={{ minHeight: 500 }} />}>
              <Testimonials />
            </Suspense>
          </DeferRender>
          <DeferRender height={400}>
            <Suspense fallback={<div style={{ minHeight: 400 }} />}>
              <FAQ />
            </Suspense>
          </DeferRender>
          <DeferRender height={300}>
            <Suspense fallback={<div style={{ minHeight: 300 }} />}>
              <CTABanner openAuth={openAuth} />
            </Suspense>
          </DeferRender>
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
