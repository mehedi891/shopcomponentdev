const ChatIcon = () => {
  return (
     <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 22,
        position: "relative",
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow:
          "0 18px 45px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
        overflow: "hidden",
        cursor: "pointer",
      }}
      aria-label="Open AI chat"
      title="AI Chat"
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-35%",
          background:
            "radial-gradient(circle at 25% 30%, rgba(0,229,255,0.42), transparent 55%), radial-gradient(circle at 80% 75%, rgba(124,77,255,0.32), transparent 60%)",
          filter: "blur(14px)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      {/* Soft pulse ring */}
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: 999,
          border: "2px solid rgba(0,229,255,0.28)",
          boxShadow:
            "0 0 14px rgba(0,229,255,0.22), 0 0 24px rgba(124,77,255,0.14)",
          animation: "softPulse 1.9s ease-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Friendly robot face */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 16,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.16), rgba(10,14,28,0.72))",
          border: "1px solid rgba(0,229,255,0.30)",
          boxShadow:
            "0 0 12px rgba(0,229,255,0.28), 0 0 22px rgba(124,77,255,0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
          position: "relative",
          animation: "breathe 2.4s ease-in-out infinite",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* Soft visor (less intense than before) */}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 6,
            right: 6,
            height: 14,
            borderRadius: 10,
            background:
              "linear-gradient(90deg, rgba(0,229,255,0.55), rgba(124,77,255,0.55))",
            boxShadow: "0 0 10px rgba(0,229,255,0.22)",
            opacity: 0.9,
          }}
        />

        {/* Eyes (round, warm, friendly) */}
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 0 10px rgba(255,255,255,0.45)",
                animation: "blink 5s infinite",
              }}
            />
          ))}
        </div>

        {/* Smile (friendly) */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 20,
            height: 10,
            borderBottom: "2px solid rgba(255,255,255,0.75)",
            borderRadius: "0 0 20px 20px",
            boxShadow: "0 0 10px rgba(0,229,255,0.14)",
            opacity: 0.95,
          }}
        />

        {/* Tiny "info" sparkle dot to feel helpful/informative */}
        <div
          style={{
            position: "absolute",
            right: 7,
            bottom: 7,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "rgba(0,229,255,0.9)",
            boxShadow:
              "0 0 10px rgba(0,229,255,0.55), 0 0 16px rgba(124,77,255,0.25)",
            animation: "twinkle 1.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Antenna (soft glow) */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 2,
          height: 10,
          background: "linear-gradient(180deg, #00e5ff, #7c4dff)",
          boxShadow: "0 0 8px rgba(0,229,255,0.25)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "rgba(0,229,255,0.9)",
          boxShadow: "0 0 12px rgba(0,229,255,0.45)",
          animation: "softPulseDot 2.2s ease-in-out infinite",
        }}
      />

      <style>
        {`
          @keyframes breathe {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }

          @keyframes blink {
            0%, 93%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.12); }
          }

          @keyframes softPulse {
            0% { transform: scale(0.9); opacity: 0.0; }
            20% { opacity: 0.55; }
            100% { transform: scale(1.25); opacity: 0; }
          }

          @keyframes softPulseDot {
            0%,100% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.15); }
          }

          @keyframes twinkle {
            0%,100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.25); }
          }
        `}
      </style>
    </div>
  );
};

export default ChatIcon;
