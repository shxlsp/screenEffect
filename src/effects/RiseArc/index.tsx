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

interface ArcCircle {
  centerX: number;
  centerY: number;
  initialRadius: number;
  currentRadius: number;
  colorStops: Array<{ offset: number; color: string }>;
  delay: number;
}
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
/**
 * 圆弧升起动效
 * - 从屏幕底部升起3个透明圆弧
 * - 圆弧由圆形放大形成，只显示与屏幕相交的部分
 * - 铺满屏幕后延迟0.3s，再执行0.3s的消失动画
 */
export const RiseArcEffect: React.FC<EffectComponentProps> = ({ options, onComplete, onRegisterStop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const [isExiting, setIsExiting] = useState(false);
  const circlesRef = useRef<ArcCircle[]>([]);

  // 动画总时长（毫秒），默认 2000ms（升起）+ 300ms（延迟）+ 300ms（消失）= 2600ms
  const riseDuration = (options?.riseDuration as number) || 2000;
  const holdDuration = 300; // 铺满后延迟时间
  const fadeDuration = 300; // 消失动画时长
  const totalDuration = riseDuration + holdDuration + fadeDuration;

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

    // 初始化3个圆形
    const initCircles = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // 计算屏幕对角线长度，确保圆形能完全覆盖屏幕
      const diagonal = Math.sqrt(width * width + height * height);
      
      // 3个圆形的初始半径（从小到大，形成层次感）
      // 确保初始半径足够小，且中心Y位置足够低，使圆形完全在屏幕外
      const initialRadii = [
        diagonal * 0.1,   // 最小
        diagonal * 0.15,  // 中等
        diagonal * 0.3,   // 最大
      ];
      
      // 3个圆形的中心X坐标（分散分布）
      const centerXs = [
        width * randomNumber(1, 2) / 10,   // 左侧
        width * randomNumber(5, 6) / 10,   // 中间
        width * randomNumber(7, 9) / 10,   // 右侧
      ];
      
      // 所有圆形的中心Y坐标都在屏幕底部外（初始不可见）
      // 确保 centerY + maxInitialRadius < height，这样所有圆形都在屏幕外
      const maxRadius = Math.max(...initialRadii);
      const centerY = height + maxRadius + 50; // 额外增加50px的缓冲
      
      // 3个渐变配置（包含紫色和红色，透明度约0.05）
      const colorConfigs = [
        // 第一个：紫色到红色渐变
        [
          { offset: 0, color: 'rgba(138, 43, 226, 0.04)' },    // 蓝紫色
          { offset: 0.4, color: 'rgba(186, 85, 211, 0.04)' },  // 中紫色
          { offset: 0.7, color: 'rgba(220, 20, 60, 0.04)' },   // 深红色
          { offset: 1, color: 'rgba(255, 0, 0, 0.03)' },       // 红色
        ],
        // 第二个：红色到紫色渐变
        [
          { offset: 0, color: 'rgba(220, 20, 60, 0.04)' },     // 深红色
          { offset: 0.3, color: 'rgba(255, 20, 147, 0.04)' },  // 粉红色
          { offset: 0.6, color: 'rgba(186, 85, 211, 0.04)' },  // 中紫色
          { offset: 1, color: 'rgba(138, 43, 226, 0.03)' },   // 蓝紫色
        ],
        // 第三个：蓝紫色到红色渐变
        [
          { offset: 0, color: 'rgba(100, 149, 237, 0.04)' },   // 蓝色
          { offset: 0.4, color: 'rgba(138, 43, 226, 0.04)' }, // 蓝紫色
          { offset: 0.7, color: 'rgba(186, 85, 211, 0.04)' }, // 中紫色
          { offset: 1, color: 'rgba(255, 69, 0, 0.03)' },     // 橙红色
        ],
      ];
      
      // 创建3个圆形
      circlesRef.current = initialRadii.map((initialRadius, index) => ({
        centerX: centerXs[index],
        centerY: centerY,
        initialRadius: initialRadius,
        currentRadius: initialRadius,
        colorStops: colorConfigs[index],
        delay: index * 50 + randomNumber(0, 50), // 轻微延迟，形成层次感
      }));
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 窗口大小改变时，重新初始化圆形位置
      initCircles();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initCircles();

    const animate = (currentTime: number) => {
      if (isExiting) return;

      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / totalDuration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const diagonal = Math.sqrt(width * width + height * height);
      
      // 计算当前处于哪个阶段
      const holdStart = riseDuration;
      const fadeStart = holdStart + holdDuration;
      const fadeProgress = elapsed < fadeStart ? 0 : Math.min((elapsed - fadeStart) / fadeDuration, 1);
      
      // 计算整体透明度（消失阶段）
      const globalAlpha = fadeProgress > 0 ? 1 - fadeProgress : 1;

      // 先设置clip区域，只显示屏幕内的部分
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();

      // 绘制每个圆形
      circlesRef.current.forEach((circle) => {
        // 计算当前半径（升起阶段）
        const targetRadius = diagonal * 1.2; // 目标半径要大于屏幕对角线，确保完全覆盖
        
        // 应用延迟，计算实际进度
        const effectiveElapsed = Math.max(0, elapsed - circle.delay);
        const effectiveRiseProgress = Math.min(effectiveElapsed / riseDuration, 1);
        const easedProgress = 1 - Math.pow(1 - effectiveRiseProgress, 3); // 缓动函数
        
        // 在升起阶段结束后，半径保持最大值
        if (effectiveRiseProgress >= 1) {
          circle.currentRadius = circle.initialRadius + (targetRadius - circle.initialRadius);
        } else {
          circle.currentRadius = circle.initialRadius + (targetRadius - circle.initialRadius) * easedProgress;
        }

        // 创建径向渐变（从中心向外）
        const gradient = ctx.createRadialGradient(
          circle.centerX,
          circle.centerY,
          0,
          circle.centerX,
          circle.centerY,
          circle.currentRadius
        );

        // 添加颜色停止点，应用全局透明度
        circle.colorStops.forEach((stop) => {
          const rgbaMatch = stop.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgbaMatch) {
            const r = rgbaMatch[1];
            const g = rgbaMatch[2];
            const b = rgbaMatch[3];
            const baseAlpha = parseFloat(rgbaMatch[4]);
            const finalAlpha = baseAlpha * globalAlpha;
            gradient.addColorStop(stop.offset, `rgba(${r}, ${g}, ${b}, ${finalAlpha})`);
          }
        });

        // 绘制圆形（只显示屏幕内的部分，形成圆弧边缘效果）
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.centerX, circle.centerY, circle.currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // 继续动画或完成
      if (progress < 1) {
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
  }, [riseDuration, totalDuration, onComplete, isExiting]);

  return (
    <CanvasContainer>
      <Canvas ref={canvasRef} />
    </CanvasContainer>
  );
};

// 注册特效
effectRegistry.register({
  type: 'riseArc',
  component: RiseArcEffect,
  name: '圆弧升起',
  description: '从屏幕底部升起3个透明圆弧，铺满屏幕后消失',
  defaultOptions: {
    riseDuration: 1800, // 升起动画时长（毫秒）
  },
});

export default RiseArcEffect;

