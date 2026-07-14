import React from "react";
import { COMPANIES } from "./constants";

export const LogoMarquee = React.memo(function LogoMarquee() {
  return (
    <div
      style={{
        marginTop: 40,
        paddingTop: 24,
        borderTop: "1px solid rgba(37,99,235,0.12)",
      }}
    >
      <p
        className="text-center tag mb-4 sm:mb-6 m-0 text-[10px] sm:text-xs"
        style={{ color: "#475569", letterSpacing: "0.18em", fontWeight: 500 }}
      >
        Trusted by leading companies
      </p>
      <div className="relative w-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-8 sm:w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, #F5F7FA, transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-8 sm:w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(270deg, #F5F7FA, transparent)",
          }}
        />
        <div className="flex gap-8 sm:gap-16 items-center animate-marquee opacity-90" style={{ willChange: "transform" }}>
          {[...Array(2)].flatMap((_, dup) =>
            COMPANIES.map((c, i) => (
              <div
                key={`${dup}-${i}`}
                className="flex items-center gap-2 sm:gap-3 whitespace-nowrap"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24" fill={c.c} style={{ opacity: 0.7 }}>
                  <path d={c.icon} />
                </svg>
                <span
                  className="text-xs sm:text-sm font-semibold tracking-tight"
                  style={{ color: "#030B2E" }}
                >
                  {c.n}
                </span>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
});
