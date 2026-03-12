"use client";

// Single walking donkey silhouette
const DonkeySVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 120 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Body */}
    <ellipse cx="60" cy="50" rx="30" ry="18" />
    {/* Neck */}
    <path d="M82 42 Q88 28 84 18 Q82 14 78 14 Q74 14 73 18 Q70 28 75 42Z" />
    {/* Head */}
    <ellipse cx="81" cy="14" rx="10" ry="7" />
    {/* Snout */}
    <ellipse cx="90" cy="16" rx="5" ry="4" />
    {/* Ear left */}
    <path d="M76 8 Q74 -2 72 0 Q70 2 74 9Z" />
    {/* Ear right */}
    <path d="M80 7 Q80 -3 82 -1 Q84 1 82 8Z" />
    {/* Front left leg */}
    <path d="M72 64 L74 88 L78 88 L76 64Z" />
    {/* Front right leg - forward stride */}
    <path d="M80 62 L86 86 L90 86 L84 62Z" />
    {/* Back left leg */}
    <path d="M40 64 L36 88 L40 88 L44 64Z" />
    {/* Back right leg - back stride */}
    <path d="M46 64 L50 88 L54 88 L50 64Z" />
    {/* Tail */}
    <path
      d="M30 42 Q20 36 18 40 Q16 44 26 46"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Tail tuft */}
    <circle cx="17" cy="39" r="3" />
  </svg>
);

// Individual dust particle
function DustParticle({ delay, size, y }: { delay: number; size: number; y: number }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        bottom: y,
        right: 0,
        backgroundColor: "rgba(212, 184, 122, 0.5)",
        animation: `dust-float 2s ease-out ${delay}s infinite`,
      }}
    />
  );
}

export default function DonkeySilhouettes() {
  const particles = [
    { delay: 0, size: 5, y: 8 },
    { delay: 0.3, size: 7, y: 4 },
    { delay: 0.6, size: 4, y: 14 },
    { delay: 0.9, size: 6, y: 6 },
    { delay: 1.2, size: 5, y: 12 },
    { delay: 1.5, size: 8, y: 2 },
    { delay: 1.8, size: 4, y: 16 },
    { delay: 2.1, size: 6, y: 8 },
    { delay: 2.4, size: 5, y: 5 },
    { delay: 2.7, size: 7, y: 13 },
    { delay: 3.0, size: 4, y: 3 },
    { delay: 3.3, size: 6, y: 10 },
  ];

  return (
    <>
      {/* Inject keyframes directly so they can't be purged */}
      <style jsx global>{`
        @keyframes walk-donkey {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(calc(100vw + 150px)); }
        }
        @keyframes dust-float {
          0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { transform: translate(-30px, -20px) scale(0.2); opacity: 0; }
        }
      `}</style>
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none overflow-hidden h-28 sm:h-36">
        {/* Donkey + dust trail — walks left to right */}
        <div
          className="absolute bottom-2"
          style={{ animation: "walk-donkey 30s linear infinite" }}
        >
          <div className="relative">
            <DonkeySVG className="w-24 h-24 sm:w-32 sm:h-32 text-sand-light/70" />
            {/* Dust trail behind the donkey */}
            <div className="absolute bottom-1 -left-6 w-12 h-8">
              {particles.map((p, i) => (
                <DustParticle key={i} delay={p.delay} size={p.size} y={p.y} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
