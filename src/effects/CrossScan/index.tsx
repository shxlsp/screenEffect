import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 99999;
  background: transparent;
  overflow: hidden;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  background: transparent;
`;

interface CrossParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  phase: 'in' | 'out';
  life: number;
  maxLife: number;
}

/**
 * 对向粒子扫描动效
 * - 粒子从左上角和右下角同时向屏幕中心汇聚
 * - 在接近中心区域时爆散并逐渐消散
 * - 不包含扫描线，仅使用粒子表现
 */
export const CrossScanEffect: React.FC<EffectComponentProps> = ({ options, onComplete, onRegisterStop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CrossParticle[]>([]);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);

  // 动画总时长（毫秒），默认 2200ms
  const duration = (options?.duration as number) || 2200;

  // 注册停止处理函数
  useEffect(() => {
    if (!onRegisterStop) return;

    const stopHandler = (): Promise<void> => {
      return new Promise((resolve) => {
        setIsExiting(true);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setTimeout(() => {
          resolve();
        }, 100);
      });
    };

    onRegisterStop(stopHandler);
  }, [onRegisterStop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 统一的粒子颜色（带透明度前缀）
    const baseColor = 'rgba(234, 51, 61, ';

    const createInitialParticles = () => {
      particlesRef.current = [];

      const countPerSide = Math.floor((canvas.width + canvas.height) / 12);

      // 从左上角向中心
      for (let i = 0; i < countPerSide; i++) {
        const jitterX = Math.random() * canvas.width * 0.2;
        const jitterY = Math.random() * canvas.height * 0.2;

        particlesRef.current.push({
          x: jitterX,
          y: jitterY,
          vx: 0,
          vy: 0,
          radius: Math.random() * 2 + 1.2,
          color: baseColor,
          alpha: 0.6,
          phase: 'in',
          life: 0,
          maxLife: 60 + Math.random() * 40,
        });
      }

      // 从右下角向中心
      for (let i = 0; i < countPerSide; i++) {
        const jitterX = canvas.width - Math.random() * canvas.width * 0.2;
        const jitterY = canvas.height - Math.random() * canvas.height * 0.2;

        particlesRef.current.push({
          x: jitterX,
          y: jitterY,
          vx: 0,
          vy: 0,
          radius: Math.random() * 2 + 1.2,
          color: baseColor,
          alpha: 0.6,
          phase: 'in',
          life: 0,
          maxLife: 60 + Math.random() * 40,
        });
      }

      // 为每个粒子预生成爆散阶段的速度（存放在 vx/vy，实际在 out 阶段才使用）
      particlesRef.current.forEach((p) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1.2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      });
    };

    createInitialParticles();

    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;

    const animate = (currentTime: number) => {
      if (isExiting) return;

      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // 轻微缓动
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = centerX();
      const cy = centerY();
      const explodeRadius = Math.min(canvas.width, canvas.height) * 0.06;

      particlesRef.current.forEach((p) => {
        if (p.phase === 'in') {
          // 向中心收拢
          const fromTopLeft = p.y < cy;

          const targetX = cx + (Math.random() - 0.5) * explodeRadius * 0.3;
          const targetY = cy + (Math.random() - 0.5) * explodeRadius * 0.3;

          const originX = fromTopLeft ? 0 : canvas.width;
          const originY = fromTopLeft ? 0 : canvas.height;

          p.x = originX + (targetX - originX) * easedProgress;
          p.y = originY + (targetY - originY) * easedProgress;

          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < explodeRadius * 0.8 || progress > 0.55) {
            p.phase = 'out';
            p.life = 0;
          }
        } else {
          // 爆散阶段
          p.life += 1;
          p.x += p.vx;
          p.y += p.vy;

          const lifeRatio = p.life / p.maxLife;
          p.alpha = Math.max(0, 0.6 * (1 - lifeRatio));
        }
      });

      // 绘制粒子
      particlesRef.current.forEach((p) => {
        if (p.alpha <= 0) return;

        // 外部光晕
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius * 5
        );
        gradient.addColorStop(0, `${p.color}${p.alpha * 0.7})`);
        gradient.addColorStop(0.5, `${p.color}${p.alpha * 0.35})`);
        gradient.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 内部核心
        ctx.fillStyle = `${p.color}${p.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const allFaded = particlesRef.current.every((p) => p.phase === 'out' && p.alpha <= 0.02);

      if (progress < 1 || !allFaded) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          onComplete?.();
        }, 150);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [duration, onComplete, isExiting]);

  return (
    <CanvasContainer>
      <Canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

// 注册特效
effectRegistry.register({
  type: 'crossScan',
  component: CrossScanEffect,
  name: '对向粒子扫描',
  description: '粒子从左上与右下同时向中间汇聚并在中心爆散消散的特效',
  defaultOptions: {
    duration: 2200,
  },
});

export default CrossScanEffect;


