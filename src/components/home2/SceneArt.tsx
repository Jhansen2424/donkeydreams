"use client";

// Illustrated film frames for the homepage story — layered desert scenes
// (sky, sun, far ridge, near ridge, ground, donkey silhouettes) that stand
// in for the real photos and parallax at different depths as the frame
// moves through the viewport. When the final photo exports arrive these
// swap for <img>, but the frames should FEEL like scenes from day one —
// flat gradient boxes were reading as empty (client, 10/12).

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

export type SceneTone = "dawn" | "gold" | "amber" | "dusk" | "night";
export type SceneKind = "herd" | "pair" | "lone" | "run" | "land";

const SKY: Record<SceneTone, { top: string; bottom: string; sun: string; sunY: number }> = {
  dawn: { top: "#f8ecd6", bottom: "#eac089", sun: "#f3d07a", sunY: 62 },
  gold: { top: "#f3dcae", bottom: "#dd9a4e", sun: "#f0b652", sunY: 40 },
  amber: { top: "#e8ad70", bottom: "#a84a28", sun: "#e2963f", sunY: 66 },
  dusk: { top: "#8c9bb0", bottom: "#3c4f6a", sun: "#e8d9b4", sunY: 30 },
  night: { top: "#2b3347", bottom: "#15100b", sun: "#e8e4da", sunY: 24 },
};

const RIDGE: Record<SceneTone, { far: string; near: string; ground: string }> = {
  dawn: { far: "#cfae87", near: "#9a7a55", ground: "#7a5f41" },
  gold: { far: "#b98a4a", near: "#8a6232", ground: "#6e4d26" },
  amber: { far: "#8a4a2a", near: "#5e3018", ground: "#45230f" },
  dusk: { far: "#324257", near: "#232f41", ground: "#1a2330" },
  night: { far: "#1d1812", near: "#13100b", ground: "#0d0b07" },
};

/** The site's walking-donkey silhouette (from DonkeySilhouettes), reusable
    at any scale; `grazing` drops the head to the ground. */
export function Donkey({
  x,
  scale = 1,
  flip,
  grazing,
  color,
  opacity = 1,
}: {
  x: number; // percent from left
  scale?: number;
  flip?: boolean;
  grazing?: boolean;
  color: string;
  opacity?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${100 - 12 - 26 * scale}) scale(${(flip ? -1 : 1) * scale * 0.3} ${scale * 0.3})`}
      fill={color}
      opacity={opacity}
    >
      <g transform={grazing ? "rotate(14 60 50)" : undefined}>
        <ellipse cx="60" cy="50" rx="30" ry="18" />
        <path d="M82 42 Q88 28 84 18 Q82 14 78 14 Q74 14 73 18 Q70 28 75 42Z" />
        <ellipse cx="81" cy="14" rx="10" ry="7" />
        <ellipse cx="90" cy="16" rx="5" ry="4" />
        <path d="M76 8 Q74 -2 72 0 Q70 2 74 9Z" />
        <path d="M80 7 Q80 -3 82 -1 Q84 1 82 8Z" />
      </g>
      <path d="M72 64 L74 88 L78 88 L76 64Z" />
      <path d="M80 62 L86 86 L90 86 L84 62Z" />
      <path d="M40 64 L36 88 L40 88 L44 64Z" />
      <path d="M46 64 L50 88 L54 88 L50 64Z" />
      <path
        d="M30 42 Q20 36 18 40 Q16 44 26 46"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="17" cy="39" r="3" />
    </g>
  );
}

function Cast({ kind, color }: { kind: SceneKind; color: string }) {
  switch (kind) {
    case "pair":
      return (
        <>
          <Donkey x={38} scale={1.15} color={color} />
          <Donkey x={56} scale={0.72} flip color={color} />
        </>
      );
    case "lone":
      return <Donkey x={46} scale={0.9} color={color} />;
    case "run":
      return (
        <>
          <Donkey x={26} scale={1.05} flip color={color} />
          <Donkey x={48} scale={0.95} flip color={color} opacity={0.9} />
          <Donkey x={66} scale={0.8} flip color={color} opacity={0.8} />
        </>
      );
    case "land":
      return (
        <>
          <Donkey x={70} scale={0.5} color={color} opacity={0.85} />
          <Donkey x={80} scale={0.42} grazing color={color} opacity={0.8} />
        </>
      );
    case "herd":
    default:
      return (
        <>
          <Donkey x={18} scale={0.85} grazing color={color} />
          <Donkey x={36} scale={1.1} color={color} />
          <Donkey x={55} scale={0.7} flip color={color} />
          <Donkey x={70} scale={0.95} grazing flip color={color} />
        </>
      );
  }
}

export default function SceneArt({
  tone,
  kind = "herd",
  parallax = true,
}: {
  tone: SceneTone;
  kind?: SceneKind;
  parallax?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const still = reduce || !parallax;
  const farY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["6%", "-6%"]);
  const nearY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["12%", "-12%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["-10%", "10%"]);

  const sky = SKY[tone];
  const ridge = RIDGE[tone];
  const isNight = tone === "night";

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* sky */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, ${sky.top}, ${sky.bottom})` }}
      />
      {/* stars at night */}
      {isNight && (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 15% 20%, #fff8, transparent), radial-gradient(1px 1px at 45% 35%, #fff6, transparent), radial-gradient(1.5px 1.5px at 70% 15%, #fff7, transparent), radial-gradient(1px 1px at 88% 42%, #fff5, transparent)",
          }}
        />
      )}
      {/* sun / moon */}
      <motion.div
        className="absolute rounded-full"
        style={{
          y: sunY,
          left: "68%",
          top: `${sky.sunY}%`,
          width: "16%",
          aspectRatio: "1",
          backgroundColor: sky.sun,
          boxShadow: `0 0 40px 14px ${sky.sun}55`,
        }}
      />
      {/* far ridge */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
        style={{ y: farY }}
      >
        <path
          d="M0,72 L12,52 L24,66 L38,42 L52,62 L66,48 L80,64 L92,55 L100,62 L100,100 L0,100 Z"
          fill={ridge.far}
          opacity={0.75}
        />
      </motion.svg>
      {/* near ridge + ground + donkeys */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[52%] w-full"
        style={{ y: nearY }}
      >
        <path
          d="M0,84 L18,70 L34,80 L54,66 L72,78 L88,70 L100,78 L100,100 L0,100 Z"
          fill={ridge.near}
          opacity={0.9}
        />
        <rect x="0" y="88" width="100" height="12" fill={ridge.ground} />
      </motion.svg>
      {/* cast — donkeys stand on the ground plane (uniform aspect so they
          don't stretch; sized against frame height) */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-x-0 bottom-0 h-[58%] w-full"
        style={{ y: nearY }}
      >
        <Cast kind={kind} color={isNight ? "#0a0806" : "#241d14"} />
      </motion.svg>
      {/* atmosphere: vignette + warm haze */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(20,14,8,0.28) 100%)",
        }}
      />
    </div>
  );
}
