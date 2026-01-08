import { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
  particles: Particle[];
}

const Canvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
`;

const COLORS = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
  '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
  '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40',
];

export const FireworksEffect: React.FC<EffectComponentProps> = ({ options, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animationRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);

  const launchInterval = (options?.launchInterval as number) || 500;
  const particleCount = (options?.particleCount as number) || 80;
  const gravity = (options?.gravity as number) || 0.05;

  const createParticle = useCallback((x: number, y: number, color: string): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01,
      size: Math.random() * 3 + 1,
    };
  }, []);

  const createFirework = useCallback((canvas: HTMLCanvasElement): Firework => {
    const x = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
    return {
      x,
      y: canvas.height,
      targetY: Math.random() * canvas.height * 0.4 + canvas.height * 0.1,
      vy: -12 - Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      exploded: false,
      particles: [],
    };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 透明背景
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    // 定时发射烟花
    if (now - lastLaunchRef.current > launchInterval) {
      fireworksRef.current.push(createFirework(canvas));
      lastLaunchRef.current = now;
    }

    // 更新和绘制烟花
    fireworksRef.current = fireworksRef.current.filter((fw) => {
      if (!fw.exploded) {
        // 上升阶段
        fw.y += fw.vy;
        fw.vy += gravity;

        // 绘制上升的烟花
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.fill();

        // 到达目标高度时爆炸
        if (fw.y <= fw.targetY || fw.vy >= 0) {
          fw.exploded = true;
          fw.particles = Array.from({ length: particleCount }, () =>
            createParticle(fw.x, fw.y, fw.color)
          );
        }
        return true;
      } else {
        // 爆炸阶段
        fw.particles = fw.particles.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += gravity;
          p.vx *= 0.99;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
            return true;
          }
          return false;
        });

        return fw.particles.length > 0;
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [gravity, launchInterval, particleCount, createFirework, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    lastLaunchRef.current = Date.now();
    animate();

    // 如果有 duration，设置完成回调
    if (options?.duration && onComplete) {
      setTimeout(onComplete, options.duration);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, options?.duration, onComplete]);

  return <Canvas ref={canvasRef} />;
};

// 注册特效
effectRegistry.register({
  type: 'fireworks',
  component: FireworksEffect,
  name: '烟花',
  description: '绚丽的烟花绽放特效',
  defaultOptions: {
    launchInterval: 500,
    particleCount: 80,
    gravity: 0.05,
  },
});

export default FireworksEffect;

