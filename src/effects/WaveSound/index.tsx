import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { EffectComponentProps } from "../../types";
import { effectRegistry } from "../../core";

const CanvasContainer = styled.div<{ $isVisible: boolean; $isExiting: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 99999;
    background: transparent;
    overflow: hidden;
    filter: blur(15px);
    opacity: ${props => props.$isExiting ? 0 : (props.$isVisible ? 1 : 0)};
    transition: opacity 0.3s ease-in-out;
`;

const Canvas = styled.canvas`
    width: 100%;
    height: 100%;
    background: transparent;
`;

interface WaveBand {
    amplitude: number; // 当前振幅（0-1）
    targetAmplitude: number; // 目标振幅（0-1）
    frequency: number; // 频率（用于波形）
    phase: number; // 相位
    speed: number; // 流动速度
    color: string; // 颜色
    amplitudeDirection: number; // 振幅变化方向：1 表示增加，-1 表示减少
}

interface WavePoint {
    x: number;
    y: number;
}

/**
 * 音波动效
 * - 在屏幕左右两侧纵向展示音波效果
 * - 一条连续的波纹从屏幕底部到顶部持续波动
 * - 使用模糊效果增强视觉效果
 */
export const WaveSoundEffect: React.FC<EffectComponentProps> = ({
    options,
    onComplete,
    onRegisterStop,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const exitStartTimeRef = useRef<number>(0);
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // 获取配置参数
    const duration = (options?.duration as number) || 0; // 0 表示持续播放
    const speed = (options?.speed as number) || 0.3; // 波动速度，默认 0.3（更平缓）
    const sideOffset = (options?.sideOffset as number) || 30; // 距离屏幕边缘的距离，默认 30px
    const color = (options?.color as string) || "#667eea"; // 音波颜色（保留兼容性，但会使用彩色渐变）
    const maxAmplitude = (options?.maxAmplitude as number) || 100; // 最大振幅（px），默认 100px
    const wavePoints = (options?.wavePoints as number) || 300; // 波形点的数量，默认 300（更多点使波纹更平滑）
    const amplitudeStep = (options?.amplitudeStep as number) || 0.02; // 振幅变化固定增量，默认 0.02
    const amplitudeMin = (options?.amplitudeMin as number) || 0.3; // 最小振幅，默认 0.3
    const amplitudeMax = (options?.amplitudeMax as number) || 0.7; // 最大振幅，默认 0.7

    const exitDuration = 300; // 退出动画持续时间（毫秒）
    const leftBandRef = useRef<WaveBand | null>(null);
    const rightBandRef = useRef<WaveBand | null>(null);

    // 初始化渐入效果
    useEffect(() => {
        // 延迟一帧后触发渐入，确保 DOM 已渲染
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

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
                }, exitDuration);
            });
        };

        onRegisterStop(stopHandler);
    }, [onRegisterStop, exitDuration]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        // 生成彩虹色渐变的辅助函数
        const getRainbowColor = (hue: number): string => {
            // hue: 0-360，返回HSL颜色
            // 提高饱和度和亮度，让低透明度下也能看到
            const saturation = 100;
            const lightness = 70; // 提高亮度
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        };

        // 初始化音波频带（只有一条）
        const initWaveBands = () => {
            const frequency = 0.02; // 波动频率（降低，使波动更平缓）
            const hue = 240; // 蓝色系
            const rainbowColor = getRainbowColor(hue);
            
            // 初始振幅随机（在最小值和最大值之间）
            const leftInitialAmplitude = Math.random() * (amplitudeMax - amplitudeMin) + amplitudeMin;
            const rightInitialAmplitude = Math.random() * (amplitudeMax - amplitudeMin) + amplitudeMin;
            
            // 初始目标振幅也随机
            const leftInitialTarget = Math.random() * (amplitudeMax - amplitudeMin) + amplitudeMin;
            const rightInitialTarget = Math.random() * (amplitudeMax - amplitudeMin) + amplitudeMin;
            
            // 初始方向随机（1 或 -1）
            const leftDirection = Math.random() > 0.5 ? 1 : -1;
            const rightDirection = Math.random() > 0.5 ? 1 : -1;
            
            // 左侧频带
            leftBandRef.current = {
                amplitude: leftInitialAmplitude,
                targetAmplitude: leftInitialTarget,
                frequency: frequency,
                phase: 0,
                speed: speed,
                color: rainbowColor,
                amplitudeDirection: leftDirection,
            };

            // 右侧频带（相位略有差异）
            rightBandRef.current = {
                amplitude: rightInitialAmplitude,
                targetAmplitude: rightInitialTarget,
                frequency: frequency * 0.95,
                phase: Math.PI * 0.2,
                speed: speed * 0.98,
                color: rainbowColor,
                amplitudeDirection: rightDirection,
            };
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        initWaveBands();

        // 绘制纵向波纹（带渐变效果）- 从底部到顶部连续的一条波纹
        const drawWaveWithGradient = (
            ctx: CanvasRenderingContext2D,
            isLeft: boolean,
            band: WaveBand,
            time: number,
            alpha: number,
            canvasWidth: number,
            canvasHeight: number
        ) => {
            // 生成纵向波形点（从屏幕底部到顶部）
            const points: WavePoint[] = [];
            const waveCenterX = isLeft ? sideOffset : canvasWidth - sideOffset;
            
            // 从底部到顶部生成点
            // 使用更平滑的波形，确保连续性
            const waveCycles = 2.5; // 纵向波动周期数（减少到2.5个，使波纹更平缓）
            const timeSpeed = 15; // 时间驱动的波动速度（降低，使抖动更慢）
            
            for (let i = 0; i <= wavePoints; i++) {
                const normalizedY = i / wavePoints; // 0 到 1（从下到上，0是底部，1是顶部）
                const y = normalizedY * canvasHeight; // 实际的Y坐标
                
                // 计算波形的X坐标（纵向正弦波，持续波动）
                // 使用平滑的单一频率，确保波形连续衔接
                // 相位计算确保每个波都能平滑衔接
                const waveX = Math.sin(
                    normalizedY * Math.PI * waveCycles + // 纵向波动（平缓的周期数）
                    band.frequency * time * timeSpeed + // 时间驱动的波动（降低速度）
                    band.phase // 初始相位
                ) * band.amplitude * maxAmplitude;
                
                const x = waveCenterX + waveX;
                points.push({ x, y });
            }

            // 绘制渐变区域（从波形到屏幕边缘）
            const edgeX = isLeft ? 0 : canvasWidth;
            const gradientCenterX = waveCenterX;

            // 创建水平渐变（从波形位置到屏幕边缘）
            const gradient = ctx.createLinearGradient(
                gradientCenterX, 0,
                edgeX, 0
            );

            // 解析颜色（支持HSL和HEX格式）
            let r = 0, g = 0, b = 0;
            const hslMatch = band.color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/i);
            if (hslMatch) {
                // HSL颜色转换为RGB
                const h = parseInt(hslMatch[1]) / 360;
                const s = parseInt(hslMatch[2]) / 100;
                const l = parseInt(hslMatch[3]) / 100;
                
                const c = (1 - Math.abs(2 * l - 1)) * s;
                const x = c * (1 - Math.abs((h * 6) % 2 - 1));
                const m = l - c / 2;
                
                let tempR = 0, tempG = 0, tempB = 0;
                if (h < 1/6) { tempR = c; tempG = x; tempB = 0; }
                else if (h < 2/6) { tempR = x; tempG = c; tempB = 0; }
                else if (h < 3/6) { tempR = 0; tempG = c; tempB = x; }
                else if (h < 4/6) { tempR = 0; tempG = x; tempB = c; }
                else if (h < 5/6) { tempR = x; tempG = 0; tempB = c; }
                else { tempR = c; tempG = 0; tempB = x; }
                
                r = Math.round((tempR + m) * 255);
                g = Math.round((tempG + m) * 255);
                b = Math.round((tempB + m) * 255);
            } else {
                const colorMatch = band.color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                if (colorMatch) {
                    r = parseInt(colorMatch[1], 16);
                    g = parseInt(colorMatch[2], 16);
                    b = parseInt(colorMatch[3], 16);
                }
            }
            
            // 渐变：从波形位置的不透明度到边缘的完全透明
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
            gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            // 绘制渐变填充区域（从波形线到屏幕边缘）
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = gradient;
            
            // 找出波形的X和Y范围
            let minX = points[0].x;
            let maxX = points[0].x;
            let minY = points[0].y;
            let maxY = points[0].y;
            points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            
            // 扩展边界以形成渐变区域
            const horizontalPadding = maxAmplitude * 0.5;
            const rightBound = Math.max(maxX + horizontalPadding, gradientCenterX);
            
            // 创建跟随波形的渐变路径
            ctx.beginPath();
            if (isLeft) {
                // 左侧：从屏幕左边缘开始，沿波形路径，到波形右侧
                ctx.moveTo(edgeX, minY);
                
                // 沿波形路径（从下到上）
                for (let i = 0; i < points.length; i++) {
                    const p = points[i];
                    if (i === 0) {
                        ctx.lineTo(p.x, p.y);
                    } else if (i < points.length - 1) {
                        const next = points[i + 1];
                        const midX = (p.x + next.x) / 2;
                        const midY = (p.y + next.y) / 2;
                        ctx.quadraticCurveTo(p.x, p.y, midX, midY);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                
                // 从波形终点到边缘（从上到下，闭合路径）
                ctx.lineTo(rightBound, maxY);
                ctx.lineTo(edgeX, maxY);
                ctx.lineTo(edgeX, minY);
            } else {
                // 右侧：从波形左侧开始，沿波形路径，到屏幕右边缘
                const leftBound = Math.min(minX - horizontalPadding, gradientCenterX);
                ctx.moveTo(leftBound, minY);
                
                // 沿波形路径（从下到上）
                for (let i = 0; i < points.length; i++) {
                    const p = points[i];
                    if (i === 0) {
                        ctx.lineTo(p.x, p.y);
                    } else if (i < points.length - 1) {
                        const next = points[i + 1];
                        const midX = (p.x + next.x) / 2;
                        const midY = (p.y + next.y) / 2;
                        ctx.quadraticCurveTo(p.x, p.y, midX, midY);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                
                // 从波形终点到边缘（从上到下，闭合路径）
                ctx.lineTo(edgeX, maxY);
                ctx.lineTo(edgeX, minY);
                ctx.lineTo(leftBound, minY);
            }
            
            ctx.closePath();
            ctx.fill();
            
            // 绘制波形线本身（更清晰）
            ctx.strokeStyle = band.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                } else if (i < points.length - 1) {
                    const next = points[i + 1];
                    const midX = (p.x + next.x) / 2;
                    const midY = (p.y + next.y) / 2;
                    ctx.quadraticCurveTo(p.x, p.y, midX, midY);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
            
            ctx.restore();
        };

        const animate = (currentTime: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = currentTime;
            }

            const elapsed = currentTime - startTimeRef.current;
            const time = elapsed / 1000; // 转换为秒

            // 检查是否需要自动结束
            if (duration > 0 && elapsed >= duration - exitDuration) {
                if (!isExiting) {
                    exitStartTimeRef.current = currentTime;
                    setIsExiting(true);
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;

            // 更新振幅（基于固定增量，规则变化）
            // 定期更新目标振幅：基于当前目标振幅加上或减去固定增量
            if (Math.random() < 0.02) { // 更新频率
                if (leftBandRef.current) {
                    // 根据方向更新目标振幅
                    let newTarget = leftBandRef.current.targetAmplitude + 
                        leftBandRef.current.amplitudeDirection * amplitudeStep;
                    
                    // 如果超出边界，反转方向并限制在边界内
                    if (newTarget >= amplitudeMax) {
                        newTarget = amplitudeMax;
                        leftBandRef.current.amplitudeDirection = -1;
                    } else if (newTarget <= amplitudeMin) {
                        newTarget = amplitudeMin;
                        leftBandRef.current.amplitudeDirection = 1;
                    }
                    
                    leftBandRef.current.targetAmplitude = newTarget;
                }
                
                if (rightBandRef.current) {
                    // 根据方向更新目标振幅
                    let newTarget = rightBandRef.current.targetAmplitude + 
                        rightBandRef.current.amplitudeDirection * amplitudeStep;
                    
                    // 如果超出边界，反转方向并限制在边界内
                    if (newTarget >= amplitudeMax) {
                        newTarget = amplitudeMax;
                        rightBandRef.current.amplitudeDirection = -1;
                    } else if (newTarget <= amplitudeMin) {
                        newTarget = amplitudeMin;
                        rightBandRef.current.amplitudeDirection = 1;
                    }
                    
                    rightBandRef.current.targetAmplitude = newTarget;
                }
            }

            // 平滑过渡振幅（降低过渡速度，使变化更平缓）
            if (leftBandRef.current) {
                leftBandRef.current.amplitude += (leftBandRef.current.targetAmplitude - leftBandRef.current.amplitude) * 0.03;
            }
            if (rightBandRef.current) {
                rightBandRef.current.amplitude += (rightBandRef.current.targetAmplitude - rightBandRef.current.amplitude) * 0.03;
            }

            // 绘制左侧波形（从底部到顶部连续波动）
            if (leftBandRef.current) {
                drawWaveWithGradient(ctx, true, leftBandRef.current, time, 0.5, width, height);
            }

            // 绘制右侧波形（从底部到顶部连续波动）
            if (rightBandRef.current) {
                drawWaveWithGradient(ctx, false, rightBandRef.current, time, 0.5, width, height);
            }

            // 继续动画
            if (duration === 0 || elapsed < duration) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else if (!isExiting) {
                exitStartTimeRef.current = currentTime;
                setIsExiting(true);
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [
        duration,
        speed,
        sideOffset,
        color,
        maxAmplitude,
        wavePoints,
        amplitudeStep,
        amplitudeMin,
        amplitudeMax,
        onComplete,
    ]);

    return (
        <CanvasContainer $isVisible={isVisible} $isExiting={isExiting}>
            <Canvas ref={canvasRef} />
        </CanvasContainer>
    );
};

// 注册特效
effectRegistry.register({
    type: "waveSound",
    component: WaveSoundEffect,
    name: "音波动效",
    description: "在屏幕左右两侧纵向展示一条连续的波纹，从底部到顶部持续波动",
    defaultOptions: {
        duration: 0, // 默认持续播放
        speed: 5, // 波动速度（更平缓）
        sideOffset: 30, // 距离屏幕边缘的距离（px）
        color: "#667eea", // 音波颜色（保留兼容性，实际使用彩色渐变）
        maxAmplitude: 50, // 最大振幅（px）
        wavePoints: 300, // 波形点的数量（更多点使波纹更平滑）
        amplitudeStep: 0.02, // 振幅变化固定增量
        amplitudeMin: 0.3, // 最小振幅（0-1）
        amplitudeMax: 0.7, // 最大振幅（0-1）
    },
});

export default WaveSoundEffect;

