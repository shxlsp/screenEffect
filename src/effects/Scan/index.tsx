import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 120vh; /* 超出屏幕20% */
  pointer-events: none;
  z-index: 99999;
  opacity: 0.6;
  background: transparent;
  overflow: hidden;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  background: transparent;
`;

interface ScanParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

/**
 * 页面粒子扫描动效
 * - 从顶部开始向下扫描
 * - 粒子随机飘散效果
 * - 扫描线跟随效果
 * - 适用于截图前的视觉提示
 */
export const ScanEffect: React.FC<EffectComponentProps> = ({ options, onComplete, onRegisterStop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ScanParticle[]>([]);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const scanPositionRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);

  // 从 options 中获取 duration，默认 2000ms
  const duration = (options?.duration as number) || 2000;

  // 注册停止处理函数
  useEffect(() => {
    if (onRegisterStop) {
      const stopHandler = (): Promise<void> => {
        return new Promise((resolve) => {
          setIsExiting(true);
          // 停止动画
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          // 立即完成
          setTimeout(() => {
            resolve();
          }, 100);
        });
      };
      onRegisterStop(stopHandler);
    }
  }, [onRegisterStop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // 设置画布尺寸 - 高度超出屏幕20%，避免底部停顿
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 1.2; // 超出屏幕20%
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 颜色配置 - 纯浅蓝色
    const particleColor = 'rgba(167, 123, 225, '; // 统一的浅蓝色

    // 创建扫描粒子
    const createScanParticles = (scanY: number) => {
      const particleCount = Math.floor(canvas.width / 15); // 根据宽度生成粒子
      for (let i = 0; i < particleCount; i++) {
        const x = (i / particleCount) * canvas.width + Math.random() * 15;

        particlesRef.current.push({
          x,
          y: scanY,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 1,
          radius: Math.random() * 2 + 1,
          color: particleColor, // 统一使用浅蓝色
          alpha: 0.4, // 降低不透明度，更透明虚化
          life: 0,
          maxLife: 60,
        });
      }
    };

    // 绘制扫描线
    const drawScanLine = (scanY: number, progress: number) => {
      const lineHeight = 3;
      const glowSize = 30;

      // 主扫描线 - 浅蓝色光晕
      const gradient = ctx.createLinearGradient(0, scanY - glowSize, 0, scanY + glowSize);
      gradient.addColorStop(0, 'rgba(206, 120, 205, 0)');
      gradient.addColorStop(0.3, 'rgba(206, 120, 205, 0.2)');
      gradient.addColorStop(0.5, 'rgba(206, 120, 205, 0.5)');
      gradient.addColorStop(0.7, 'rgba(206, 120, 205, 0.2)');
      gradient.addColorStop(1, 'rgba(206, 120, 205, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - glowSize, canvas.width, glowSize * 2);

      // 核心线条 - 更透明的白色
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, scanY - lineHeight / 2, canvas.width, lineHeight);

      // 网格效果 - 浅蓝色
      const gridSpacing = 40;
      ctx.strokeStyle = `rgba(206, 120, 205, ${0.2 * (1 - progress)})`;
      ctx.lineWidth = 1;

      // 垂直网格线
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, scanY - 100));
        ctx.lineTo(x, scanY);
        ctx.stroke();
      }

      // 水平网格线
      const gridLineCount = 5;
      for (let i = 0; i < gridLineCount; i++) {
        const y = scanY - (gridLineCount - i) * 20;
        if (y >= 0) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // 扫描指示器（两侧的三角形）- 浅蓝色
      const triangleSize = 15;
      const triangleAlpha = 0.5 * (1 - progress * 0.5);

      ctx.fillStyle = `rgba(206, 120, 205, ${triangleAlpha})`;

      // 左侧三角形
      ctx.beginPath();
      ctx.moveTo(20, scanY);
      ctx.lineTo(20 + triangleSize, scanY - triangleSize / 2);
      ctx.lineTo(20 + triangleSize, scanY + triangleSize / 2);
      ctx.closePath();
      ctx.fill();

      // 右侧三角形
      ctx.beginPath();
      ctx.moveTo(canvas.width - 20, scanY);
      ctx.lineTo(canvas.width - 20 - triangleSize, scanY - triangleSize / 2);
      ctx.lineTo(canvas.width - 20 - triangleSize, scanY + triangleSize / 2);
      ctx.closePath();
      ctx.fill();
    };

    // 更新粒子
    const updateParticles = () => {
      particlesRef.current.forEach((particle) => {
        particle.life++;
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 粒子淡出 - 更虚化
        const lifeRatio = particle.life / particle.maxLife;
        particle.alpha = Math.max(0, 0.4 - lifeRatio * 0.5);
      });

      // 移除死亡粒子
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
    };

    // 绘制粒子
    const drawParticles = () => {
      particlesRef.current.forEach((particle) => {
        // 粒子光晕 - 更虚化
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 4
        );
        gradient.addColorStop(0, `${particle.color}${particle.alpha * 0.6})`);
        gradient.addColorStop(0.5, `${particle.color}${particle.alpha * 0.3})`);
        gradient.addColorStop(1, `${particle.color}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // 粒子核心 - 降低不透明度
        ctx.fillStyle = `${particle.color}${particle.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // 绘制进度指示器
    const drawProgressIndicator = (progress: number) => {
      const barWidth = 200;
      const barHeight = 4;
      const barX = canvas.width - barWidth - 30;
      const barY = 30;

      // 背景条
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // 进度条 - 浅蓝色渐变
      const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      progressGradient.addColorStop(0, 'rgba(147, 197, 253, 0.6)');
      progressGradient.addColorStop(1, 'rgba(186, 230, 253, 0.6)');

      ctx.fillStyle = progressGradient;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      // 文字
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`扫描中... ${Math.floor(progress * 100)}%`, barX + barWidth, barY - 5);
    };

    // 动画循环
    let lastParticleSpawn = 0;
    const animate = (currentTime: number) => {
      if (isExiting) {
        return;
      }

      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // 计算扫描位置
      scanPositionRef.current = progress * canvas.height;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 每隔一段时间生成粒子
      if (currentTime - lastParticleSpawn > 30) {
        createScanParticles(scanPositionRef.current);
        lastParticleSpawn = currentTime;
      }

      // 更新和绘制
      updateParticles();
      drawParticles();
      drawScanLine(scanPositionRef.current, progress);
      drawProgressIndicator(progress);

      // 继续动画或完成
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // 扫描完成，延迟一点再回调
        setTimeout(() => {
          onComplete?.();
        }, 200);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理
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
  type: 'scan',
  component: ScanEffect,
  name: '扫描',
  description: '页面粒子扫描动效，适用于截图前的视觉提示',
  defaultOptions: {
    duration: 2000, // 默认扫描持续时间（毫秒）
  },
});

export default ScanEffect;

