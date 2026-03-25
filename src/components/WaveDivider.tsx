interface WaveDividerProps {
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
  variant?: "gentle" | "steep" | "double";
}

export default function WaveDivider({
  fromColor = "#FDF8F0",
  toColor = "#ffffff",
  flip = false,
  variant = "gentle",
}: WaveDividerProps) {
  const paths = {
    gentle:
      "M0,64 C200,120 400,0 600,80 C800,160 1000,40 1200,80 L1200,200 L0,200 Z",
    steep:
      "M0,100 C150,160 350,0 500,80 C650,160 850,20 1000,100 C1100,140 1150,60 1200,100 L1200,200 L0,200 Z",
    double:
      "M0,80 C100,120 200,40 300,80 C400,120 500,40 600,80 C700,120 800,40 900,80 C1000,120 1100,40 1200,80 L1200,200 L0,200 Z",
  };

  return (
    <div
      className="relative w-full overflow-hidden leading-[0] -my-px"
      style={{ transform: flip ? "rotate(180deg)" : undefined }}
    >
      <svg
        className="relative block w-full"
        style={{ height: "clamp(60px, 8vw, 120px)" }}
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`wave-grad-${fromColor}-${toColor}-${flip}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
        <path
          d={paths[variant]}
          fill={toColor}
        />
      </svg>
    </div>
  );
}
