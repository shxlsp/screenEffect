import { useEffect, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

// 定义CSS @property，用于支持渐变角度动画
const GlobalStyle = createGlobalStyle`
  @property --angle {
    inherits: false;
    initial-value: 0deg;
    syntax: "<angle>";
  }
`;

// 旋转动画
const spin = keyframes`
  to {
    --angle: 360deg;
  }
`;

// 初始化动画：透明度从0->1，scale从1.05->1
const init = keyframes`
  from {
    opacity: 0;
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// 退出动画：透明度从1->0，scale从1->1.2
const exit = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.2);
  }
`;

// Glow容器样式
const GlowContainer = styled.div<{ $speed: number; $isExiting: boolean }>`
  position: fixed;
  inset: 0;
  pointer-events: none;
  border-style: solid;
  border-image-slice: 1;
  border-image-source:  conic-gradient(
        from var(--angle) at 50% 50%,
        #0894ff 0deg,
        #c959dd 60deg,
        #ff2e54 120deg,
        #ffa73b 180deg,
        #71f7c2 240deg,
        #0894ff 360deg
      );
  border-width: 24px;
  filter: blur(7px);
  margin: -14px;
  mix-blend-mode: hard-light;
  z-index: 9999;
  animation: ${init} 0.5s ease-out,
    ${spin} ${props => props.$speed}ms infinite linear 0.3s,
    ${props => props.$isExiting ? exit : 'none'} 0.5s ease-in forwards;
`;

export const GlowEffect: React.FC<EffectComponentProps> = ({ options, onComplete, onRegisterStop }) => {
  // 获取速度参数，默认 5000ms 完成一次旋转
  const speed = (options?.speed as number) || 5000;
  const [isExiting, setIsExiting] = useState(false);
  const exitDuration = 500; // 退出动画持续时间（毫秒）

  // 注册停止处理函数
  useEffect(() => {
    if (onRegisterStop) {
      const stopHandler = (): Promise<void> => {
        return new Promise((resolve) => {
          setIsExiting(true);
          // 等待退出动画完成
          setTimeout(() => {
            resolve();
          }, exitDuration);
        });
      };
      onRegisterStop(stopHandler);
    }
  }, [onRegisterStop, exitDuration]);

  useEffect(() => {
    // 如果有 duration，设置完成回调
    if (options?.duration && onComplete) {
      const exitStartTime = options.duration - exitDuration;
      const timer = setTimeout(() => {
        setIsExiting(true);
        // 退出动画完成后调用 onComplete
        setTimeout(() => {
          onComplete();
        }, exitDuration);
      }, Math.max(0, exitStartTime));
      return () => clearTimeout(timer);
    }
  }, [options?.duration, onComplete, exitDuration]);

  return (
    <>
      <GlobalStyle />
      <GlowContainer $speed={speed} $isExiting={isExiting} />
    </>
  );
};

// 注册特效
effectRegistry.register({
  type: 'glow',
  component: GlowEffect,
  name: '发光边框',
  description: '炫彩旋转发光边框特效',
  defaultOptions: {
    duration: 0, // 默认持续播放
    speed: 5000, // 默认旋转速度（毫秒），值越小速度越快
  },
});

export default GlowEffect;

