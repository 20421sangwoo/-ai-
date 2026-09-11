import { motion } from "motion/react";

interface RobotMascotProps {
  state: "idle" | "listening" | "speaking" | "thinking";
}

export default function RobotMascot({ state }: RobotMascotProps) {
  // Animating elements based on state
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-radial from-orange-50/50 to-transparent rounded-full select-none" id="robot-mascot-container">
      {/* Listening Aura pulse ring */}
      {state === "listening" && (
        <div className="absolute inset-0 rounded-full border-4 border-emerald-400/40 scale-110 pulse-ring-active" />
      )}
      {state === "thinking" && (
        <div className="absolute inset-0 rounded-full border-4 border-orange-400/30 scale-105 pulse-ring-active" />
      )}

      {/* Main Robot Body SVG */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
        id="robot-svg"
      >
        {/* Antenna */}
        <motion.rect
          x="75"
          y="15"
          width="10"
          height="20"
          rx="5"
          fill="#d4af37"
          animate={state === "thinking" ? { y: [15, 12, 15] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        />
        {/* Antenna Bulb */}
        <motion.circle
          cx="80"
          cy="12"
          r="10"
          className="transition-colors duration-300"
          fill={
            state === "listening"
              ? "#10b981" // emerald-500
              : state === "speaking"
              ? "#f97316" // orange-500
              : state === "thinking"
              ? "#f59e0b" // amber-500
              : "#e2e8f0" // default slate-200
          }
          animate={
            state !== "idle"
              ? { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }
              : { scale: [1, 1.05, 1] }
          }
          transition={{ repeat: Infinity, duration: state === "thinking" ? 0.8 : 2 }}
        />

        {/* Head Shell */}
        <rect
          x="20"
          y="35"
          width="120"
          height="100"
          rx="35"
          fill="#fbf7f4"
          stroke="#e3d2be"
          strokeWidth="6"
        />

        {/* Ears */}
        {/* Left Ear */}
        <rect
          x="10"
          y="65"
          width="10"
          height="40"
          rx="5"
          fill="#e3d2be"
        />
        {/* Right Ear */}
        <rect
          x="140"
          y="65"
          width="10"
          height="40"
          rx="5"
          fill="#e3d2be"
        />

        {/* Face Screen */}
        <rect
          x="32"
          y="47"
          width="96"
          height="76"
          rx="20"
          fill="#2d2621"
        />

        {/* Eyes */}
        {/* Left Eye */}
        {state === "speaking" ? (
          // Happy Eyes (crescent ^)
          <motion.path
            d="M 46 80 Q 54 70 62 80"
            stroke="#fdba74"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        ) : state === "thinking" ? (
          // Pulsing search eyes
          <motion.circle
            cx="54"
            cy="78"
            r="8"
            fill="#fdba74"
            animate={{ scale: [0.8, 1.3, 0.8] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        ) : (
          // Default Round Eye with occasional blink
          <motion.ellipse
            cx="54"
            cy="78"
            rx="8"
            ry="8"
            fill="#fdba74"
            animate={{ ry: [8, 8, 1, 8, 8, 8, 8] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          />
        )}

        {/* Right Eye */}
        {state === "speaking" ? (
          // Happy Eyes (crescent ^)
          <motion.path
            d="M 98 80 Q 106 70 114 80"
            stroke="#fdba74"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        ) : state === "thinking" ? (
          // Pulsing search eyes
          <motion.circle
            cx="106"
            cy="78"
            r="8"
            fill="#fdba74"
            animate={{ scale: [1.3, 0.8, 1.3] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        ) : (
          // Default Round Eye with occasional blink
          <motion.ellipse
            cx="106"
            cy="78"
            rx="8"
            ry="8"
            fill="#fdba74"
            animate={{ ry: [8, 8, 1, 8, 8, 8, 8] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          />
        )}

        {/* Cheeks (Warm Blush) */}
        <circle cx="42" cy="92" r="5" fill="#f87171" opacity="0.6" />
        <circle cx="118" cy="92" r="5" fill="#f87171" opacity="0.6" />

        {/* Mouth */}
        {state === "speaking" ? (
          // Moving mouth wave
          <motion.path
            d="M 68 102 Q 80 115 92 102"
            stroke="#fdba74"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={{ strokeWidth: [4, 6, 4] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          />
        ) : state === "listening" ? (
          // Listening focused "O" mouth
          <circle cx="80" cy="104" r="6" stroke="#fdba74" strokeWidth="4" fill="none" />
        ) : state === "thinking" ? (
          // Thinking flat line
          <line x1="72" y1="104" x2="88" y2="104" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
        ) : (
          // Normal happy smile
          <path
            d="M 70 100 Q 80 110 90 100"
            stroke="#fdba74"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>

      {/* Decorative Text indicating state */}
      <div className="mt-3 text-sm font-medium px-4 py-1 rounded-full border border-orange-100 transition-colors duration-300" style={{ backgroundColor: "#faf5ef" }}>
        {state === "listening" && (
          <span className="text-emerald-600 flex items-center gap-1.5 font-sans animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            어르신의 말씀을 귀담아듣고 있어요...
          </span>
        )}
        {state === "speaking" && (
          <span className="text-orange-600 flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            다온이가 따뜻하게 말씀드리는 중이에요...
          </span>
        )}
        {state === "thinking" && (
          <span className="text-amber-600 flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce"></span>
            무슨 말씀을 드릴지 생각 중이에요...
          </span>
        )}
        {state === "idle" && (
          <span className="text-stone-500 font-sans">
            다온이가 곁에서 어르신을 기다려요 😊
          </span>
        )}
      </div>
    </div>
  );
}
