import { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  swing: number;
  swingSpeed: number;
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

export const SnowEffect: React.FC<EffectComponentProps> = ({ options, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>(0);

  const snowflakeCount = (options?.snowflakeCount as number) || 200;
  const windSpeed = (options?.windSpeed as number) || 0.5;
  const snowColor = (options?.color as string) || '#FFFFFF';

  const createSnowflake = useCallback((canvas: HTMLCanvasElement): Snowflake => {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      radius: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 1,
      wind: (Math.random() - 0.5) * windSpeed,
      opacity: Math.random() * 0.5 + 0.5,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.01,
    };
  }, [windSpeed]);

  const initSnowflakes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    snowflakesRef.current = Array.from({ length: snowflakeCount }, () => {
      const flake = createSnowflake(canvas);
      flake.y = Math.random() * canvas.height; // 初始化时分布在整个屏幕
      return flake;
    });
  }, [snowflakeCount, createSnowflake]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snowflakesRef.current.forEach((flake, index) => {
      // 更新位置
      flake.swing += flake.swingSpeed;
      flake.x += flake.wind + Math.sin(flake.swing) * 0.5;
      flake.y += flake.speed;

      // 绘制雪花
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = snowColor;
      ctx.globalAlpha = flake.opacity;
      ctx.fill();
      ctx.closePath();

      // 重置超出屏幕的雪花
      if (flake.y > canvas.height + 10 || flake.x < -10 || flake.x > canvas.width + 10) {
        snowflakesRef.current[index] = createSnowflake(canvas);
      }
    });

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(animate);
  }, [snowColor, createSnowflake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    initSnowflakes();
    animate();

    // 如果有 duration，设置完成回调
    if (options?.duration && onComplete) {
      setTimeout(onComplete, options.duration);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initSnowflakes, options?.duration, onComplete]);

  return <Canvas ref={canvasRef} />;
};

// 注册特效
effectRegistry.register({
  type: 'snow',
  component: SnowEffect,
  name: '飘雪',
  description: '冬日浪漫的雪花飘落特效',
  defaultOptions: {
    snowflakeCount: 200,
    windSpeed: 0.5,
    color: '#FFFFFF',
  },
});

export default SnowEffect;

