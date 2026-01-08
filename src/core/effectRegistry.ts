import { EffectRegistration, EffectComponentProps } from '../types';
import { ComponentType } from 'react';

/**
 * 特效注册表
 * 管理所有已注册的特效组件
 */
class EffectRegistry {
  private effects: Map<string, EffectRegistration> = new Map();

  /**
   * 注册特效
   * @param registration 特效注册配置
   */
  register(registration: EffectRegistration): void {
    if (this.effects.has(registration.type)) {
      console.warn(`[EffectRegistry] 特效 "${registration.type}" 已存在，将被覆盖`);
    }
    this.effects.set(registration.type, registration);
    console.log(`[EffectRegistry] 已注册特效: ${registration.type}`);
  }

  /**
   * 批量注册特效
   * @param registrations 特效注册配置数组
   */
  registerAll(registrations: EffectRegistration[]): void {
    registrations.forEach((reg) => this.register(reg));
  }

  /**
   * 获取特效
   * @param type 特效类型
   */
  get(type: string): EffectRegistration | undefined {
    return this.effects.get(type);
  }

  /**
   * 获取特效组件
   * @param type 特效类型
   */
  getComponent(type: string): ComponentType<EffectComponentProps> | undefined {
    return this.effects.get(type)?.component;
  }

  /**
   * 检查特效是否已注册
   * @param type 特效类型
   */
  has(type: string): boolean {
    return this.effects.has(type);
  }

  /**
   * 获取所有已注册的特效
   */
  getAll(): EffectRegistration[] {
    return Array.from(this.effects.values());
  }

  /**
   * 获取所有特效类型
   */
  getTypes(): string[] {
    return Array.from(this.effects.keys());
  }

  /**
   * 注销特效
   * @param type 特效类型
   */
  unregister(type: string): boolean {
    return this.effects.delete(type);
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.effects.clear();
  }
}

// 导出单例
export const effectRegistry = new EffectRegistry();

/**
 * 特效注册装饰器工厂函数
 * 用于简化特效组件的注册
 */
export function registerEffect(config: Omit<EffectRegistration, 'component'>) {
  return function <T extends ComponentType<EffectComponentProps>>(Component: T): T {
    effectRegistry.register({
      ...config,
      component: Component,
    });
    return Component;
  };
}

