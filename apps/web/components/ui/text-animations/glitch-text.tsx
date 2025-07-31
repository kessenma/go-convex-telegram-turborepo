import type { CSSProperties, FC } from "react";

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  isInView?: boolean;
  backgroundColor?: string;
}

interface CustomCSSProperties extends CSSProperties {
  "--after-duration": string;
  "--before-duration": string;
  "--after-shadow": string;
  "--before-shadow": string;
  "--bg-color": string;
}

const GlitchText: FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = "",
  isInView = true,
  backgroundColor = "transparent",
}) => {
  const inlineStyles: CustomCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? "-2px 0 red" : "none",
    "--before-shadow": enableShadows ? "2px 0 cyan" : "none",
    "--bg-color": backgroundColor,
  };

  const baseClasses =
    "text-white text-[clamp(0.5rem,2.5vw,2rem)] font-black relative mx-auto select-none cursor-pointer";

  const pseudoClasses = !enableOnHover
    ? isInView
      ? "after:content-[attr(data-text)] after:absolute after:top-0 after:left-[3px] after:text-white after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:[text-shadow:var(--after-shadow)] after:animate-glitch-after after:[background-color:var(--bg-color)] " +
        "before:content-[attr(data-text)] before:absolute before:top-0 before:left-[-3px] before:text-white before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:[text-shadow:var(--before-shadow)] before:animate-glitch-before before:[background-color:var(--bg-color)]"
      : "after:content-[attr(data-text)] after:absolute after:top-0 after:left-[3px] after:text-white after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:[text-shadow:var(--after-shadow)] after:[background-color:var(--bg-color)] " +
        "before:content-[attr(data-text)] before:absolute before:top-0 before:left-[-3px] before:text-white before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:[text-shadow:var(--before-shadow)] before:[background-color:var(--bg-color)]"
    : "after:content-[''] after:absolute after:top-0 after:left-[3px] after:text-white after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:opacity-0 after:[background-color:var(--bg-color)] " +
      "before:content-[''] before:absolute before:top-0 before:left-[-3px] before:text-white before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:opacity-0 before:[background-color:var(--bg-color)] " +
      (isInView
        ? "hover:after:content-[attr(data-text)] hover:after:opacity-100 hover:after:[text-shadow:var(--after-shadow)] hover:after:animate-glitch-after " +
          "hover:before:content-[attr(data-text)] hover:before:opacity-100 hover:before:[text-shadow:var(--before-shadow)] hover:before:animate-glitch-before"
        : "hover:after:content-[attr(data-text)] hover:after:opacity-100 hover:after:[text-shadow:var(--after-shadow)] " +
          "hover:before:content-[attr(data-text)] hover:before:opacity-100 hover:before:[text-shadow:var(--before-shadow)]");

  const combinedClasses = `${baseClasses} ${pseudoClasses} ${className}`;

  return (
    <div style={inlineStyles} data-text={children} className={combinedClasses}>
      {children}
    </div>
  );
};

export default GlitchText;

// tailwind.config.js
// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         glitch: {
//           "0%": { "clip-path": "inset(10% 0 85% 0)" },
//           "5%": { "clip-path": "inset(0% 0 90% 0)" },
//           "10%": { "clip-path": "inset(85% 0 5% 0)" },
//           "15%": { "clip-path": "inset(20% 0 70% 0)" },
//           "20%": { "clip-path": "inset(60% 0 30% 0)" },
//           "25%": { "clip-path": "inset(5% 0 80% 0)" },
//           "30%": { "clip-path": "inset(75% 0 15% 0)" },
//           "35%": { "clip-path": "inset(15% 0 75% 0)" },
//           "40%": { "clip-path": "inset(40% 0 50% 0)" },
//           "45%": { "clip-path": "inset(70% 0 20% 0)" },
//           "50%": { "clip-path": "inset(25% 0 65% 0)" },
//           "55%": { "clip-path": "inset(0% 0 85% 0)" },
//           "60%": { "clip-path": "inset(80% 0 10% 0)" },
//           "65%": { "clip-path": "inset(35% 0 55% 0)" },
//           "70%": { "clip-path": "inset(55% 0 35% 0)" },
//           "75%": { "clip-path": "inset(10% 0 80% 0)" },
//           "80%": { "clip-path": "inset(90% 0 0% 0)" },
//           "85%": { "clip-path": "inset(0% 0 95% 0)" },
//           "90%": { "clip-path": "inset(45% 0 45% 0)" },
//           "95%": { "clip-path": "inset(65% 0 25% 0)" },
//           "100%": { "clip-path": "inset(30% 0 60% 0)" },
//         },
//       },
//       animation: {
//         "glitch-after": "glitch var(--after-duration) infinite linear alternate-reverse",
//         "glitch-before": "glitch var(--before-duration) infinite linear alternate-reverse",
//       },
//     },
//   },
//   plugins: [],
// };
