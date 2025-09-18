'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const icons = [
  '₿', 'Ξ', 'Ł', '◎', 'Δ', '◈', '◇', '⛓️'
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  icon: string;
  opacity: number;
}

const CryptoBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();

  const createParticles = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth: width, clientHeight: height } = containerRef.current;
    if (width === 0 || height === 0) return;

    const newParticles: Particle[] = [];
    const numParticles = Math.floor((width * height) / 10000);

    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 12 + 12,
        icon: icons[Math.floor(Math.random() * icons.length)],
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    createParticles();
    
    const handleResize = () => {
      // Small debounce
      setTimeout(createParticles, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [createParticles]);

  useEffect(() => {
    const animate = () => {
      if (containerRef.current) {
        const { clientWidth: width, clientHeight: height } = containerRef.current;
        setParticles(prevParticles =>
          prevParticles.map(p => {
            let newX = p.x + p.vx;
            let newY = p.y + p.vy;

            if (newX < 0 || newX > width) p.vx *= -1;
            if (newY < 0 || newY > height) p.vy *= -1;

            return { ...p, x: newX, y: newY };
          })
        );
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-background overflow-hidden -z-10"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute text-foreground"
          style={{
            left: p.x,
            top: p.y,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.1s linear, top 0.1s linear',
          }}
        >
          {p.icon}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
    </div>
  );
};

export default CryptoBackground;
