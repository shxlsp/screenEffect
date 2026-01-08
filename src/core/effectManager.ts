import { ActiveEffect, EffectOptions } from '../types';
import { effectRegistry } from './effectRegistry';

type EffectChangeListener = (effects: ActiveEffect[]) => void;

/**
 * 特效管理器
 * 负责管理特效的启动、停止和状态
 */
class EffectManager {
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private listeners: Set<EffectChangeListener> = new Set();
  private idCounter = 0;

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `effect-${Date.now()}-${++this.idCounter}`;
  }

  /**
   * 启动特效
   * @param type 特效类型
   * @param options 特效配置
   */
  startEffect(type: string, options?: EffectOptions): string | null {
    // 检查特效是否已注册
    if (!effectRegistry.has(type)) {
      console.error(`[EffectManager] 特效 "${type}" 未注册`);
      return null;
    }

    // 如果是独占模式，先停止其他特效
    if (options?.exclusive) {
      this.stopAllEffects();
    }

    // 检查同类型特效是否已在运行
    const existingEffect = Array.from(this.activeEffects.values()).find(
      (effect) => effect.type === type
    );
    if (existingEffect) {
      console.log(`[EffectManager] 特效 "${type}" 已在运行，更新配置`);
      // 更新配置
      existingEffect.options = options;
      this.notifyListeners();
      return existingEffect.id;
    }

    // 创建新的特效实例
    const id = this.generateId();
    const effect: ActiveEffect = {
      id,
      type,
      options,
      startTime: Date.now(),
    };

    this.activeEffects.set(id, effect);
    console.log(`[EffectManager] 启动特效: ${type} (${id})`);

    // 如果设置了持续时间，自动停止
    if (options?.duration && options.duration > 0) {
      setTimeout(() => {
        this.stopEffect(type).catch((error) => {
          console.error(`[EffectManager] 停止特效 ${type} 时出错:`, error);
        });
      }, options.duration);
    }

    this.notifyListeners();
    return id;
  }

  /**
   * 停止指定类型的特效
   * @param type 特效类型
   * @returns Promise，在停止操作完成后 resolve（EffectContainer 会等待退出动画完成）
   */
  stopEffect(type: string): Promise<void> {
    const effectsToRemove: string[] = [];

    this.activeEffects.forEach((effect, id) => {
      if (effect.type === type) {
        effectsToRemove.push(id);
      }
    });

    effectsToRemove.forEach((id) => {
      this.activeEffects.delete(id);
      console.log(`[EffectManager] 停止特效: ${type} (${id})`);
    });

    if (effectsToRemove.length > 0) {
      this.notifyListeners();
      // 返回 Promise，EffectContainer 会等待退出动画完成后再 resolve
      // 这里先立即 resolve，因为 EffectContainer 会处理等待逻辑
      return Promise.resolve();
    }

    return Promise.resolve();
  }

  /**
   * 通过ID停止特效
   * @param id 特效实例ID
   * @returns Promise，在停止操作完成后 resolve
   */
  stopEffectById(id: string): Promise<void> {
    if (this.activeEffects.has(id)) {
      const effect = this.activeEffects.get(id);
      this.activeEffects.delete(id);
      console.log(`[EffectManager] 停止特效: ${effect?.type} (${id})`);
      this.notifyListeners();
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  /**
   * 停止所有特效
   * @returns Promise，在停止操作完成后 resolve
   */
  stopAllEffects(): Promise<void> {
    if (this.activeEffects.size > 0) {
      console.log(`[EffectManager] 停止所有特效，共 ${this.activeEffects.size} 个`);
      this.activeEffects.clear();
      this.notifyListeners();
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  /**
   * 获取所有活跃的特效
   */
  getActiveEffects(): ActiveEffect[] {
    return Array.from(this.activeEffects.values());
  }

  /**
   * 检查特效是否正在运行
   * @param type 特效类型
   */
  isRunning(type: string): boolean {
    return Array.from(this.activeEffects.values()).some(
      (effect) => effect.type === type
    );
  }

  /**
   * 订阅特效变化
   * @param listener 监听函数
   */
  subscribe(listener: EffectChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const effects = this.getActiveEffects();
    this.listeners.forEach((listener) => listener(effects));
  }
}

// 导出单例
export const effectManager = new EffectManager();

