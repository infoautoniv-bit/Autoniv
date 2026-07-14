import { useState, useEffect, useRef } from "react";
import { CONVERSATION } from "./data";
import { SpectrumField, GlowRingOrb, Reveal } from "./utils";

export function Demo() {
  const [demoMsgs, setDemoMsgs] = useState<{ role: string; text: string; id: number }[]>([]);
  const [speaking, setSpeaking] = useState<"user" | "agent" | "idle">("idle");
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);
  const demoRunningRef = useRef(false);
  const demoDoneRef = useRef(false);
  const isIntersectingRef = useRef(false);

  useEffect(() => { demoRunningRef.current = demoRunning; }, [demoRunning]);
  useEffect(() => { demoDoneRef.current = demoDone; }, [demoDone]);
  useEffect(() => { const c = chatContainerRef.current; if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); }, [demoMsgs]);
  useEffect(() => () => { demoTimers.current.forEach(clearTimeout); }, []);

  const stopDemo = () => {
    demoRunningRef.current = false;
    demoDoneRef.current = false;
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setDemoMsgs([]);
    setSpeaking("idle");
    setDemoDone(false);
    setDemoRunning(false);
  };

  const startDemo = () => {
    demoRunningRef.current = true;
    demoDoneRef.current = false;
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setDemoMsgs([]);
    setSpeaking("idle");
    setDemoDone(false);
    setDemoRunning(true);
    CONVERSATION.forEach((msg, i) => {
      const tS = setTimeout(() => {
        if (!isIntersectingRef.current) return;
        setSpeaking(msg.role as "user" | "agent");
      }, msg.delay - 350);
      const tM = setTimeout(() => {
        if (!isIntersectingRef.current) return;
        setDemoMsgs((p) => [...p, { ...msg, id: i }]);
        const next = CONVERSATION[i + 1];
        const gap = next ? next.delay - msg.delay : 1800;
        if (gap > 900) {
          const tI = setTimeout(() => {
            if (!isIntersectingRef.current) return;
            setSpeaking("idle");
          }, Math.min(gap - 400, 1200));
          demoTimers.current.push(tI);
        }
        if (i === CONVERSATION.length - 1) {
          demoRunningRef.current = false;
          demoDoneRef.current = true;
          setDemoRunning(false);
          setDemoDone(true);
          const tD = setTimeout(() => {
            if (!isIntersectingRef.current) return;
            setDemoMsgs([]);
            setDemoDone(false);
            startDemo();
          }, 1800);
          demoTimers.current.push(tD);
        }
      }, msg.delay);
      demoTimers.current.push(tS, tM);
    });
  };

  useEffect(() => {
    const el = demoSectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        if (!demoRunningRef.current && !demoDoneRef.current) {
          startDemo();
        }
      } else {
        stopDemo();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => {
      obs.disconnect();
      demoTimers.current.forEach(clearTimeout);
    };
  }, []);

  return (
   <section ref={demoSectionRef} id="demo" className="section-box black" style={{ contain: "layout style", contentVisibility: "auto", containIntrinsicSize: "auto 600px" } as React.CSSProperties}>
            <div className="section-pad relative overflow-hidden" style={{ transform: "translateZ(0)" }}>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: "10%",
                  width: "400px",
                  height: "400px",
                  background:
                    "radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)",
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
                  background:
                    "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)",
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
                    Watch Autoniv handle a real customer booking — start to
                    finish.
                  </p>
                </Reveal>

                <Reveal>
                  <div
                    style={{
                      background: "linear-gradient(160deg,#141414,#0a0a0a)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 24,
                          overflow: "hidden",
                          boxShadow:
                            "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
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
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06))",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#ff5f57",
                          }}
                        />
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#febc2e",
                          }}
                        />
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#28c840",
                          }}
                        />
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
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: demoRunning ? "#10B981" : "#94a3b8",
                            flexShrink: 0,
                            animation: demoRunning
                              ? "livePulse 1.8s infinite"
                              : "none",
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "44px 32px",
                          borderRight: "1px solid rgba(255,255,255,0.08)",
                          background: "#0a0e16",
                          position: "relative",
                          gap: 28,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            opacity: 0.2,
                            backgroundImage:
                              "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                            backgroundSize: "32px 32px",
                            maskImage:
                              "radial-gradient(ellipse at 50% 60%,black 20%,transparent 75%)",
                            WebkitMaskImage:
                              "radial-gradient(ellipse at 50% 60%,black 20%,transparent 75%)",
                          }}
                        />

                        <SpectrumField
                          active={speaking !== "idle" || demoRunning}
                        />

                        <div
                          style={{
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            height: "100%",
                            paddingBottom: 20,
                            gap: 16,
                          }}
                        >
                          <GlowRingOrb
                            active={speaking !== "idle" || demoRunning}
                          />

                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 18px",
                              borderRadius: 99,
                              background: "rgba(10,14,22,0.85)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              fontSize: 13,
                              color: "#e2e8f0",
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 20 20"
                              style={{ flexShrink: 0 }}
                            >
                              {[0, 1, 2, 3, 4].map((i) => (
                                <rect
                                  key={i}
                                  x={i * 4}
                                  y={10 - [3, 4.5, 2.5, 4, 2][i] / 2}
                                  width="2"
                                  rx="1"
                                  height={[3, 4.5, 2.5, 4, 2][i]}
                                  fill="#34D399"
                                  style={{
                                    animation:
                                      speaking !== "idle" || demoRunning
                                        ? `waveBounce 1.6s ease-in-out ${i * 0.15}s infinite`
                                        : "none",
                                  }}
                                />
                              ))}
                            </svg>
                          </div>

                          <div
                            className="hidden md:flex"
                            style={{
                              position: "relative",
                              zIndex: 20,
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 14px",
                              borderRadius: 8,
                              background: "rgba(10,14,22,0.9)",
                              border: "1px solid rgba(16,185,129,0.18)",
                              opacity: speaking === "agent" ? 1 : 0.3,
                              transition: "opacity 0.4s ease",
                            }}
                          >
                            <div
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: speaking === "agent" ? "#10B981" : "#475569",
                                boxShadow: speaking === "agent" ? "0 0 8px rgba(16,185,129,0.5)" : "none",
                                animation: speaking === "agent" ? "livePulse 1.8s infinite" : "none",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: "'JetBrains Mono',monospace",
                                color: speaking === "agent" ? "#10B981" : "#64748b",
                                letterSpacing: "0.08em",
                                whiteSpace: "nowrap",
                              }}
                            >
                              AI Agent Speaking
                            </span>
                          </div>

                          <div
                            style={{
                              position: "relative",
                              zIndex: 20,
                              display: "none",
                              gap: 16,
                              opacity: demoRunning ? 0.9 : 0.3,
                              transition: "opacity 0.4s ease",
                            }}
                          >
                            {[
                              { label: 'Latency', value: '< 1.2s', color: '#2563EB' },
                              { label: 'Confidence', value: '98.5%', color: '#10B981' },
                              { label: 'Language', value: 'EN', color: '#8b5cf6' },
                            ].map((stat) => (
                              <div
                                key={stat.label}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono',monospace",
                                    color: stat.color,
                                  }}
                                >
                                  {stat.value}
                                </span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontFamily: "'JetBrains Mono',monospace",
                                    color: '#64748b',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {stat.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT — Chat */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "28px 24px",
                          gap: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#ffffff",
                                marginBottom: 2,
                              }}
                            >
                              Booking Assistant
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                fontFamily: "'JetBrains Mono',monospace",
                                letterSpacing: "0.08em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {demoMsgs.length > 0
                                ? `${demoMsgs.length}/${CONVERSATION.length} turns`
                                : "starting…"}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 5,
                              alignItems: "center",
                              padding: "5px 10px",
                              borderRadius: 99,
                              background:
                                "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(16,185,129,0.10))",
                              border: "1px solid rgba(16,185,129,0.20)",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: demoRunning ? "#10B981" : "#94a3b8",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "'JetBrains Mono',monospace",
                                color: demoRunning ? "#10B981" : "#94a3b8",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {demoRunning ? "LIVE" : "IDLE"}
                            </span>
                          </div>
                        </div>

                        <div
                          ref={chatContainerRef}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            overflowY: "auto",
                            minHeight: 240,
                          }}
                        >
                          {demoMsgs.length === 0 &&
                            !demoRunning &&
                            !demoDone && (
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#94a3b8",
                                  fontSize: 13,
                                  textAlign: "center",
                                  padding: "20px 0",
                                }}
                              >
                                Press Start Demo to watch
                                <br />
                                the conversation unfold
                              </div>
                            )}
                          {demoMsgs.map((msg, i) => {
                            const isAgent = msg.role === "agent";
                            return (
                              <div
                                key={msg.id}
                                className="chat-bubble-in"
                                style={{
                                  display: "flex",
                                  justifyContent: isAgent
                                    ? "flex-start"
                                    : "flex-end",
                                  animationDelay: `${i * 0.04}s`,
                                }}
                              >
                                {isAgent && (
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: "50%",
                                      flexShrink: 0,
                                      marginRight: 8,
                                      marginTop: 2,
                                      background:
                                        "linear-gradient(135deg,#10B981,#2563EB)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#ffffff",
                                    }}
                                  >
                                    A
                                  </div>
                                )}
                                <div
                                  style={{
                                    maxWidth: "76%",
                                    padding: "9px 13px",
                                    borderRadius: isAgent
                                      ? "4px 14px 14px 14px"
                                      : "14px 4px 14px 14px",
                                    fontSize: 13.5,
                                    lineHeight: 1.45,
                                    background: isAgent
                                      ? "rgba(16,185,129,0.08)"
                                      : "rgba(37,99,235,0.08)",
                                    border: isAgent
                                      ? "1px solid rgba(16,185,129,0.2)"
                                      : "1px solid rgba(37,99,235,0.2)",
                                    color: "#e2e8f0",
                                  }}
                                >
                                  {msg.text}
                                </div>
                                {!isAgent && (
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: "50%",
                                      flexShrink: 0,
                                      marginLeft: 8,
                                      marginTop: 2,
                                      background:
                                        "linear-gradient(135deg,#2563EB,#10B981)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#ffffff",
                                    }}
                                  >
                                    U
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {demoDone && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 16,
                              paddingTop: 14,
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                              Demo complete — restarting…
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

  );
}
