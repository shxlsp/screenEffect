import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { effectManager, effectRegistry } from '../core';
import { ActiveEffect } from '../types';

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
`;

/**
 * 特效容器组件
 * 负责渲染所有活跃的特效
 */
export const EffectContainer: React.FC = () => {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  // 存储每个特效的停止处理函数
  const stopHandlersRef = useRef<Map<string, () => Promise<void>>>(new Map());
  // 存储之前的 effects，用于比较
  const prevEffectsRef = useRef<ActiveEffect[]>([]);

  useEffect(() => {
    // 订阅特效变化
    const unsubscribe = effectManager.subscribe(async (effects) => {
      const prevEffectIds = new Set(prevEffectsRef.current.map(e => e.id));
      const newEffectIds = new Set(effects.map(e => e.id));
      
      // 找出被移除的特效（需要停止的）
      const removedEffectIds = Array.from(prevEffectIds).filter(id => !newEffectIds.has(id));
      
      // 找出被移除的 effect 对象，用于在等待期间保持渲染
      const removedEffects = prevEffectsRef.current.filter(e => removedEffectIds.includes(e.id));
      
      // 如果有被移除的特效，先保持它们在状态中（用于渲染退出动画）
      // 然后等待退出动画完成，最后真正移除
      if (removedEffectIds.length > 0) {
        // 先更新状态，但保留被移除的 effects（让组件继续渲染以播放退出动画）
        const effectsWithExiting = [...effects, ...removedEffects];
        setActiveEffects(effectsWithExiting);
        
        // 等待所有被移除的特效的退出动画完成
        const stopPromises = removedEffectIds.map(async (effectId) => {
          const stopHandler = stopHandlersRef.current.get(effectId);
          if (stopHandler) {
            try {
              await stopHandler();
            } catch (error) {
              console.error(`[EffectContainer] 停止特效 ${effectId} 时出错:`, error);
            }
            stopHandlersRef.current.delete(effectId);
          }
        });
        
        await Promise.all(stopPromises);
        
        // 退出动画完成后，真正移除这些特效
        prevEffectsRef.current = [...effects];
        setActiveEffects([...effects]);
      } else {
        // 没有需要停止的特效，直接更新
        prevEffectsRef.current = [...effects];
        setActiveEffects([...effects]);
      }
    });

    // 初始化时获取当前活跃特效
    const initialEffects = effectManager.getActiveEffects();
    prevEffectsRef.current = initialEffects;
    setActiveEffects(initialEffects);

    return unsubscribe;
  }, []);

  const handleEffectComplete = useCallback(async (effectId: string) => {
    await effectManager.stopEffectById(effectId);
  }, []);

  const handleRegisterStop = useCallback((effectId: string, onStop: () => Promise<void>) => {
    stopHandlersRef.current.set(effectId, onStop);
    // 返回清理函数
    return () => {
      stopHandlersRef.current.delete(effectId);
    };
  }, []);

  return (
    <Container>
      {activeEffects.map((effect) => {
        const registration = effectRegistry.get(effect.type);
        if (!registration) {
          console.warn(`[EffectContainer] 未找到特效组件: ${effect.type}`);
          return null;
        }

        const EffectComponent = registration.component;
        const mergedOptions = {
          ...registration.defaultOptions,
          ...effect.options,
        };

        return (
          <EffectComponent
            key={effect.id}
            options={mergedOptions}
            onComplete={() => handleEffectComplete(effect.id)}
            onRegisterStop={(onStop) => handleRegisterStop(effect.id, onStop)}
          />
        );
      })}
    </Container>
  );
};

export default EffectContainer;

