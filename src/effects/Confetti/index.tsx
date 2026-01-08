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
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
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
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF6F61',
];

export const ConfettiEffect: React.FC<EffectComponentProps> = ({ options, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const particleCount = (options?.particleCount as number) || 150;
  const gravity = (options?.gravity as number) || 0.3;
  const spread = (options?.spread as number) || 70;

  const createParticle = useCallback((): Particle => {
    const canvas = canvasRef.current;
    if (!canvas) return {} as Particle;

    return {
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * spread * 0.2,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    };
  }, [spread]);

  const initParticles = useCallback(() => {
    particlesRef.current = Array.from({ length: particleCount }, createParticle);
  }, [particleCount, createParticle]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach((particle, index) => {
      // 更新位置
      particle.vy += gravity * 0.1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;

      // 绘制粒子
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);
      ctx.restore();

      // 重置超出屏幕的粒子
      if (particle.y > canvas.height + 20) {
        particlesRef.current[index] = createParticle();
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [gravity, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    initParticles();
    animate();

    // 如果有 duration，设置完成回调
    if (options?.duration && onComplete) {
      setTimeout(onComplete, options.duration);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initParticles, options?.duration, onComplete]);

  return <Canvas ref={canvasRef} />;
};

// 注册特效
effectRegistry.register({
  type: 'confetti',
  component: ConfettiEffect,
  name: '五彩纸屑',
  description: '庆祝时刻的五彩纸屑特效',
  defaultOptions: {
    particleCount: 150,
    gravity: 0.3,
    spread: 70,
  },
});

export default ConfettiEffect;

