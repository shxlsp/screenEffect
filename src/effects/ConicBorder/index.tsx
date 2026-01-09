import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { EffectComponentProps } from "../../types";
import { effectRegistry } from "../../core";

// 定义CSS @property，用于支持渐变角度动画
const GlobalStyle = createGlobalStyle`
  @property --a {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }
  @property --font-size {
    syntax: "<length>";
    initial-value: 24px;
    inherits: false;
  }
`;

// 旋转动画
const rotate = keyframes`
  to {
    --a: 1turn;
  }
`;

// 创建动态呼吸动画函数
const createBreathAnimation = (size: number) => keyframes`
  0% {
    --font-size: ${size}px;
  }
  30% {
    --font-size: ${size * 1.3}px;
  }
  70% {
    --font-size: ${size * 1.3}px;
  }
  100% {
    --font-size: ${size}px;
  }
`;

// 创建动态初始化动画函数
const createInitAnimation = (size: number) => keyframes`
  from {
    opacity: 0;
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// 创建动态退出动画函数
const createExitAnimation = (size: number) => keyframes`
  from {
    opacity: 1;
    transform: scale(1);
    --font-size: ${size}px;
  }
  to {
    opacity: 0;
    transform: scale(1.2);
    --font-size: ${size * 1.15}px;
  }
`;

// 容器样式
const EffectContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
`;

// #00ff00,  /* 荧光绿 */
// #00ff88,  /* 青绿色 */
// #00ffcc,  /* 青蓝色 */

// ${(props) => createBreathAnimation(props.$size)} 4s linear infinite
// border: solid calc(var(--font-size) * 1.25);
// border-left-width: 1.25em;
// border-right-width: 1.25em;

// 卡片容器
const Card = styled.div<{ $speed: number; $isExiting: boolean; $size: number }>`
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    color: #ededed;
    --font-size: ${(props) => props.$size}px;
    font-size: var(--font-size);
    text-align: center;
    text-transform: uppercase;
    text-wrap: balance;
    animation: 
     ${(props) => createInitAnimation(props.$size)} 0.5s
            ease-out,
        ${(props) =>
                props.$isExiting ? createExitAnimation(props.$size) : "none"}
            0.3s ease-in forwards;

    &::before {
        position: absolute;
        z-index: -1;
        inset: -17px;
        border: solid 1.25em;
        border-image: conic-gradient(
                from var(--a),
                #00ffff,
                /* 电光蓝 */ #00d4ff,
                /* 亮青色 */ #00bfff,
                /* 深天蓝 */ #0066ff,
                /* 深蓝色 */ #0033cc,
                /* 深蓝紫 */ #6600ff,
                /* 紫色 */ #9900ff,
                /* 亮紫色 */ #cb55fe,
                /* 霓虹紫 */ #00ffff /* 回到电光蓝 */
            )
            1;
        filter: blur(17px);
        animation: ${rotate} ${(props) => props.$speed}ms linear infinite 0.3s;
        content: "";
    }
`;

export const ConicBorderEffect: React.FC<EffectComponentProps> = ({
    options,
    onComplete,
    onRegisterStop,
}) => {
    // 获取速度参数，默认 4000ms 完成一次旋转
    const speed = (options?.speed as number) || 4000;
    const [isExiting, setIsExiting] = useState(false);
    const exitDuration = 300; // 退出动画持续时间（毫秒）

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
            <EffectContainer>
                <Card
                    $speed={speed}
                    $isExiting={isExiting}
                    $size={options?.size as number}
                />
            </EffectContainer>
        </>
    );
};

// 注册特效
effectRegistry.register({
    type: "conicBorder",
    component: ConicBorderEffect,
    name: "彩色边框",
    description: "旋转的彩色圆锥渐变边框特效",
    defaultOptions: {
        duration: 0, // 默认持续播放
        speed: 4000, // 默认旋转速度（毫秒），值越小速度越快
        size: 16, // 默认字体大小
    },
});

export default ConicBorderEffect;
