'use client';

export function LiquidBackground() {
  return (
    <div
      data-testid="liquid-background-container"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {/* Base background */}
      <div
        data-testid="liquid-background-base"
        className="absolute inset-0 bg-background"
      />

      {/* Floating gradient orbs */}
      <div
        data-testid="floating-orb-primary"
        className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-[var(--primary)] opacity-20 blur-[120px] rounded-full animate-float-slow"
      />
      <div
        data-testid="floating-orb-accent"
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[var(--accent)] opacity-15 blur-[100px] rounded-full animate-float-delayed"
      />
      <div
        data-testid="floating-orb-purple"
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-purple-500 opacity-10 blur-[90px] rounded-full animate-pulse-slow"
      />

      {/* Noise texture overlay */}
      <div
        data-testid="noise-texture"
        className="absolute inset-0 opacity-[0.03] liquid-noise"
      />
    </div>
  );
}