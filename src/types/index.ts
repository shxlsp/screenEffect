import { ComponentType } from 'react';

/**
 * 特效参数接口
 */
export interface EffectParams {
  type: string;
  options?: EffectOptions;
}

/**
 * 特效配置选项
 */
export interface EffectOptions {
  /** 是否仅播放当前特效（停止其他特效） */
  exclusive?: boolean;
  /** 特效持续时间（毫秒），0 表示持续播放 */
  duration?: number;
  /** 其他自定义配置 */
  [key: string]: unknown;
}

/**
 * 特效组件 Props
 */
export interface EffectComponentProps {
  options?: EffectOptions;
  onComplete?: () => void;
  /** 注册停止回调函数，组件可以通过此回调注册自己的 onStop 方法 */
  onRegisterStop?: (onStop: () => Promise<void>) => void;
}

/**
 * 特效注册配置
 */
export interface EffectRegistration {
  /** 特效唯一标识 */
  type: string;
  /** 特效组件 */
  component: ComponentType<EffectComponentProps>;
  /** 特效名称（用于展示） */
  name: string;
  /** 特效描述 */
  description?: string;
  /** 默认配置 */
  defaultOptions?: EffectOptions;
}

/**
 * 活跃特效实例
 */
export interface ActiveEffect {
  id: string;
  type: string;
  options?: EffectOptions;
  startTime: number;
}

/**
 * IPC 渲染器接口
 */
export interface IpcRenderer {
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
  off?: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ipcRenderer?: IpcRenderer;
  }
}

