'use client';

import { useEffect, useState } from 'react';

export default function SnowEffect() {
  const [flakes, setFlakes] = useState<Array<{ id: number; left: number; duration: number; delay: number; size: number; opacity: number }>>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Generar copos con variaciones naturales
    const newFlakes = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // porcentaje
      duration: 6 + Math.random() * 8, // segundos
      delay: Math.random() * 5, // segundos
      size: 4 + Math.random() * 8, // px
      opacity: 0.3 + Math.random() * 0.5
    }));
    setFlakes(newFlakes);
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="absolute text-white select-none animate-fall"
          style={{
            left: `${flake.left}%`,
            top: '-20px',
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear'
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

