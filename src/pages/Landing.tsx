import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import "./Landing.css";

function randomPercent(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function Landing() {
  const glowPositions = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        top: randomPercent(-15, 115),
        left: randomPercent(-15, 115),
      })),
    []
  );

  return (
    <div className="landing-bg">
      <div
        className="landing-glow landing-glow-1"
        aria-hidden
        style={{
          top: `${glowPositions[0].top}%`,
          left: `${glowPositions[0].left}%`,
        }}
      />
      <div
        className="landing-glow landing-glow-2"
        aria-hidden
        style={{
          top: `${glowPositions[1].top}%`,
          left: `${glowPositions[1].left}%`,
        }}
      />
      <div
        className="landing-glow landing-glow-3"
        aria-hidden
        style={{
          top: `${glowPositions[2].top}%`,
          left: `${glowPositions[2].left}%`,
        }}
      />
      <div
        className="landing-glow landing-glow-4"
        aria-hidden
        style={{
          top: `${glowPositions[3].top}%`,
          left: `${glowPositions[3].left}%`,
        }}
      />
      <div className="landing-content">
        <Outlet />
      </div>
    </div>
  );
}
