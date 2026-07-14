import React, { useEffect, useRef } from "react";
import { CONVERSATION } from "../data";

interface ChatWindowProps {
  msgs: typeof CONVERSATION;
  demoRunning: boolean;
  demoDone: boolean;
}

export const ChatWindow = React.memo(function ChatWindow({
  msgs,
  demoRunning,
  demoDone,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    const c = chatContainerRef.current;
    if (c) {
      c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    }
  }, [msgs]);

  return (
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
            {msgs.length > 0
              ? `${msgs.length}/${CONVERSATION.length} turns`
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
            background: "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(16,185,129,0.10))",
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
        {msgs.length === 0 && !demoRunning && !demoDone && (
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
        {msgs.map((msg, i) => {
          const isAgent = msg.role === "agent";
          return (
            <div
              key={i}
              className="chat-bubble-in"
              style={{
                display: "flex",
                justifyContent: isAgent ? "flex-start" : "flex-end",
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
                    background: "linear-gradient(135deg,#10B981,#2563EB)",
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
                  borderRadius: isAgent ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  background: isAgent ? "rgba(16,185,129,0.08)" : "rgba(37,99,235,0.08)",
                  border: isAgent ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(37,99,235,0.2)",
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
                    background: "linear-gradient(135deg,#2563EB,#10B981)",
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
  );
});
