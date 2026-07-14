import { useRef, useState, useEffect, memo } from "react";
import { COMPARISON } from "./data";
import { Reveal } from "./utils";

const competitors = [
  { key: "intercom", label: "Intercom" },
  { key: "zendesk", label: "Zendesk" },
  { key: "tidio", label: "Tidio" },
  { key: "freshchat", label: "Freshchat" },
  { key: "botpenguin", label: "BotPenguin" },
] as const;

const SUMMARY_VERDICTS = [
  { icon: "💰", label: "Best Value", desc: "Flat subscription, no surprises" },
  { icon: "🚀", label: "Fastest Setup", desc: "Live in under 24 hours" },
  { icon: "🌐", label: "INR Native", desc: "India-first pricing" },
  { icon: "🛡️", label: "DPDP Compliant", desc: "Data privacy built-in" },
  { icon: "💬", label: "WhatsApp Native", desc: "No add-on fees" },
  { icon: "🎯", label: "No Seat Limits", desc: "Unlimited team access" },
] as const;

const CellValue = memo(function CellValue({ value, isAutoniv = false }: { value: string; isAutoniv?: boolean }) {
  const isCheck = value.startsWith("✓");
  const isCross = value.startsWith("✗");

  if (isCheck) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{
            background: isAutoniv ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${isAutoniv ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.18)"}`,
          }}
        >
          <svg width="10" height="10" fill="none" stroke="#10B981" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="font-semibold text-slate-900" style={{ color: "#10B981", fontSize: "11.5px" }}>{value.replace("✓ ", "")}</span>
      </span>
    );
  }

  if (isCross) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.14)" }}
        >
          <svg width="8" height="8" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <span className="text-slate-500 font-medium" style={{ color: "#ef4444", fontSize: "11.5px" }}>{value.replace("✗ ", "")}</span>
      </span>
    );
  }

  return <span className="font-semibold text-slate-700" style={{ fontSize: "12px" }}>{value}</span>;
});

const ComparisonRow = memo(function ComparisonRow({ row, index, revealed }: { row: typeof COMPARISON[0]; index: number; revealed: boolean }) {
  const isVerdict = row.capability === "Verdict";

  return (
    <tr
      className="group transition-colors duration-200 hover:bg-blue-50/30"
      style={{
        borderBottom: index < COMPARISON.length - 1 ? "1px solid rgba(37,99,235,0.06)" : "none",
        background: isVerdict
          ? "linear-gradient(90deg, rgba(37,99,235,0.04), rgba(16,185,129,0.04))"
          : undefined,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "none" : "translateX(-16px)",
        transition: `opacity 0.5s cubic-bezier(.16,1,.3,1) ${index * 0.04}s, transform 0.5s cubic-bezier(.16,1,.3,1) ${index * 0.04}s`,
      }}
    >
      {/* Feature name - sticky */}
      <td
        className="px-5 py-4 text-xs font-semibold sticky left-0 z-10"
        style={{
          color: isVerdict ? "#0a0a0a" : "#334155",
          background: isVerdict
            ? "linear-gradient(90deg, rgba(37,99,235,0.06), rgba(255,255,255,0.98))"
            : "rgba(255,255,255,0.98)",
          borderRight: "1px solid rgba(37,99,235,0.06)",
          fontWeight: isVerdict ? 800 : 600,
        }}
      >
        {row.capability}
      </td>

      {/* Autoniv - highlighted */}
      <td
        className="px-5 py-4 text-xs font-medium"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.04))",
          color: row.autoniv.startsWith("✓") ? "#10B981" : row.autoniv.startsWith("✗") ? "#ef4444" : "#0a0a0a",
          borderLeft: "2.5px solid rgba(16,185,129,0.25)",
          borderRight: "2.5px solid rgba(16,185,129,0.25)",
        }}
      >
        <CellValue value={row.autoniv} isAutoniv />
      </td>

      {/* Competitors */}
      {competitors.map((c) => {
        const val = row[c.key as keyof typeof row] as string;
        return (
          <td
            key={c.key}
            className="px-5 py-4 text-xs"
            style={{
              color: val.startsWith("✓") ? "#10B981" : val.startsWith("✗") ? "#ef4444" : "#64748b",
            }}
          >
            <CellValue value={val} />
          </td>
        );
      })}
    </tr>
  );
});

export const Comparison = memo(function Comparison() {
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableRevealed, setTableRevealed] = useState(false);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTableRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="comparison" className="section-box tint" style={{ background: "#f8fafc" }}>
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 40%, transparent 100%)",
        }}
      />

      {/* Ambient orb */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{ background: "radial-gradient(ellipse, rgba(34,197,94,0.05), transparent 70%)" }}
      />

      <div className="relative z-10 py-20 sm:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <Reveal className="text-center mb-14">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
              style={{
                color: "#10B981",
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6">
                <circle cx="3" cy="3" r="3" fill="#10B981" />
              </svg>
              WHY AUTONIV
            </span>
            <h2
              className="font-extrabold tracking-tight mt-4"
              style={{ fontSize: "clamp(28px,4vw,48px)", color: "#0a0a0a" }}
            >
              Head-to-head{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                comparison
              </span>
            </h2>
            <p className="text-sm sm:text-base max-w-lg mx-auto mt-3" style={{ color: "#64748b" }}>
              We beat every competitor on every dimension. Real costs, real features — we did the math so you don't have to.
            </p>
          </Reveal>

          {/* Table */}
          <div
            ref={tableRef}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.98)",
              border: "1px solid rgba(37,99,235,0.12)",
              boxShadow: "0 30px 100px rgba(16,185,129,0.05), 0 0 0 1px rgba(37,99,235,0.03)",
              opacity: tableRevealed ? 1 : 0,
              transform: tableRevealed ? "none" : "translateY(20px)",
              transition: "opacity 0.6s cubic-bezier(.16,1,.3,1) 0.1s, transform 0.6s cubic-bezier(.16,1,.3,1) 0.1s",
            }}
          >
            {/* Scroll hint for mobile */}
            <div className="sm:hidden flex items-center gap-2 px-5 py-3 text-[11px] text-slate-400 font-medium"
              style={{ borderBottom: "1px solid rgba(37,99,235,0.06)" }}
            >
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              Swipe to see all competitors
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid rgba(37,99,235,0.08)",
                      background: "linear-gradient(135deg, rgba(37,99,235,0.02), rgba(16,185,129,0.01))",
                    }}
                  >
                    <th
                      className="px-5 py-5 text-[11px] font-bold uppercase tracking-wider sticky left-0 z-20"
                      style={{
                        color: "#64748b",
                        background: "rgba(255,255,255,0.98)",
                        borderRight: "1px solid rgba(37,99,235,0.06)",
                        width: "18%",
                      }}
                    >
                      Feature
                    </th>
                    <th
                      className="px-5 py-5 text-[11px] font-bold uppercase tracking-wider relative overflow-hidden"
                      style={{
                        color: "#ffffff",
                        background: "linear-gradient(135deg, #1d4ed8, #059669)",
                        width: "14%",
                        borderLeft: "2px solid rgba(16,185,129,0.25)",
                        borderRight: "2px solid rgba(16,185,129,0.25)",
                        boxShadow: "0 4px 15px rgba(16,185,129,0.15)",
                      }}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-white/20 text-white border border-white/20 tracking-wider">
                          🏆 WINNER
                        </span>
                        <span className="text-xs font-extrabold tracking-wide">Autoniv</span>
                      </div>
                    </th>
                    {competitors.map((c) => (
                      <th
                        key={c.key}
                        className="px-5 py-5 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "#94a3b8", width: "13%" }}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, index) => (
                    <ComparisonRow key={index} row={row} index={index} revealed={tableRevealed} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary verdict */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SUMMARY_VERDICTS.map((item, i) => (
              <Reveal key={i} delay={i * 0.06} from="bottom">
                <div
                  className="group relative rounded-2xl p-5 text-center transition-[transform,box-shadow] duration-350 hover:shadow-xl hover:-translate-y-1.5 overflow-hidden cursor-default"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(37,99,235,0.08)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                  }}
                >
                  {/* Accent hover wash */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.08), transparent 70%)" }}
                  />
                  
                  {/* Border line indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-500" />
                  
                  <div className="relative text-3xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 inline-block">{item.icon}</div>
                  <div className="relative text-xs font-black tracking-wide" style={{ color: "#1e293b" }}>{item.label}</div>
                  <div className="relative text-[10px] mt-1.5 font-medium leading-relaxed" style={{ color: "#64748b" }}>{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

