import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CONVERSATION } from "../data";
import { Orb } from "./Orb";
import { ChatWindow } from "./ChatWindow";
import { Reveal } from "../utils";

export function Demo() {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [speaking, setSpeaking] = useState<"user" | "agent" | "idle">("idle");
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [documentLoaded, setDocumentLoaded] = useState(false);

  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);
  const isIntersectingRef = useRef(false);
  const demoRunningRef = useRef(false);
  const demoDoneRef = useRef(false);

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

  const startDemoRef = useRef<() => void>(() => {});
  const runTurnRef = useRef<(idx: number) => void>(() => {});

  const stopDemo = useCallback(() => {
    if (playTimer.current) {
      clearTimeout(playTimer.current);
      playTimer.current = null;
    }
    setDemoRunning(false);
    demoRunningRef.current = false;
    setDemoDone(false);
    demoDoneRef.current = false;
    setCurrentIdx(-1);
    setSpeaking("idle");
  }, []);

  const runTurn = useCallback((index: number) => {
    if (index >= CONVERSATION.length) {
      setSpeaking("idle");
      setDemoDone(true);
      demoDoneRef.current = true;
      setDemoRunning(false);
      demoRunningRef.current = false;
      // Auto-restart after 2.5 seconds
      playTimer.current = setTimeout(() => {
        if (isIntersectingRef.current) startDemoRef.current();
      }, 2500);
      return;
    }

    const msg = CONVERSATION[index];
    const prevMsg = index > 0 ? CONVERSATION[index - 1] : null;
    const prevDelay = prevMsg ? prevMsg.delay : 0;
    const interval = msg.delay - prevDelay;

    const speakingDelay = Math.max(0, interval - 350);

    playTimer.current = setTimeout(() => {
      if (!isIntersectingRef.current) return;
      setSpeaking(msg.role as "user" | "agent");

      playTimer.current = setTimeout(() => {
        if (!isIntersectingRef.current) return;
        setCurrentIdx(index);

        const nextMsg = CONVERSATION[index + 1];
        if (nextMsg) {
          const nextGap = nextMsg.delay - msg.delay;
          if (nextGap > 900) {
            playTimer.current = setTimeout(() => {
              if (isIntersectingRef.current) setSpeaking("idle");
            }, Math.min(nextGap - 400, 1200));
          }
        }

        runTurnRef.current(index + 1);
      }, 350);

    }, speakingDelay);
  }, []);

  useEffect(() => {
    runTurnRef.current = runTurn;
  }, [runTurn]);

  const startDemo = useCallback(() => {
    if (playTimer.current) clearTimeout(playTimer.current);
    setDemoRunning(true);
    demoRunningRef.current = true;
    setDemoDone(false);
    demoDoneRef.current = false;
    setCurrentIdx(-1);
    setSpeaking("idle");
    runTurnRef.current(0);
  }, []);

  useEffect(() => {
    startDemoRef.current = startDemo;
  }, [startDemo]);

  useEffect(() => {
    const el = demoSectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!demoRunningRef.current && !demoDoneRef.current) {
            startDemoRef.current();
          }
        } else {
          stopDemo();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, [stopDemo]);

  // Compute sliced message array
  const msgs = useMemo(() => {
    return currentIdx >= 0 ? CONVERSATION.slice(0, currentIdx + 1) : [];
  }, [currentIdx]);

  return (
    <section
      ref={demoSectionRef}
      id="demo"
      className="section-box black"
      style={{
        contain: "layout style",
        contentVisibility: "auto",
        containIntrinsicSize: "auto 600px",
      } as React.CSSProperties}
    >
      <div className="section-pad relative overflow-hidden" style={{ transform: "translate3d(0,0,0)" }}>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: "10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <Reveal className="text-center mb-14 space-y-4">
            <span
              className="tag px-4 py-1.5 rounded-full inline-block"
              style={{
                color: "#ffffff",
                background: "var(--gg)",
                border: "none",
              }}
            >
              Live Demo
            </span>
            <h2
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4"
              style={{
                color: "#ffffff",
                fontSize: "clamp(30px,4vw,52px)",
              }}
            >
              Hear It in <span className="gradient-text">Action</span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 16,
                maxWidth: 440,
                margin: "0 auto",
              }}
            >
              Watch Autoniv handle a real customer booking — start to finish.
            </p>
          </Reveal>

          <Reveal>
            <div
              style={{
                background: "linear-gradient(160deg,#141414,#0a0a0a)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06))",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    overflow: "hidden",
                    margin: "0 8px",
                    minWidth: 0,
                  }}
                >
                  <div
                    className={demoRunning && documentLoaded ? "live-pulse" : ""}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: demoRunning && documentLoaded ? "#10B981" : "#94a3b8",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="demo-status-text"
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono',monospace",
                      color: "#94a3b8",
                      letterSpacing: "0.1em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                    }}
                  >
                    {demoRunning
                      ? "autoniv-agent · live call"
                      : demoDone
                      ? "call ended · booked ✓"
                      : "autoniv-agent · ready"}
                  </span>
                </div>
                <div style={{ width: 52, flexShrink: 0 }} />
              </div>

              {/* Two-column layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  minHeight: 420,
                }}
                className="demo-grid"
              >
                {/* LEFT — Orb */}
                <Orb
                  speaking={speaking}
                  demoRunning={demoRunning}
                  documentLoaded={documentLoaded}
                />

                {/* RIGHT — Chat */}
                <ChatWindow
                  msgs={msgs}
                  demoRunning={demoRunning}
                  demoDone={demoDone}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
