import { IpcRenderer } from '../types';

type IpcListener = (event: unknown, ...args: unknown[]) => void;

/**
 * 模拟 IPC 渲染器
 * 用于测试环境模拟 Electron 的 ipcRenderer
 */
class MockIpcRenderer implements IpcRenderer {
  private listeners: Map<string, Set<IpcListener>> = new Map();

  /**
   * 注册事件监听器
   */
  on(channel: string, listener: IpcListener): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    console.log(`[MockIpcRenderer] 注册监听器: ${channel}`);
  }

  /**
   * 移除事件监听器
   */
  off(channel: string, listener: IpcListener): void {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.delete(listener);
    }
  }

  /**
   * 触发事件（用于测试）
   */
  emit(channel: string, ...args: unknown[]): void {
    console.log(`[MockIpcRenderer] 触发事件: ${channel}`, args);
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach((listener) => {
        listener(null, ...args);
      });
    }
  }

  /**
   * 发送启动特效事件
   */
  sendStart(type: string, options?: Record<string, unknown>): void {
    this.emit('effect-animation-start', JSON.stringify({ type, options }));
  }

  /**
   * 发送停止特效事件
   */
  sendStop(type?: string): void {
    this.emit('effect-animation-stop', JSON.stringify({ type: type || '' }));
  }
}

// 创建单例
export const mockIpcRenderer = new MockIpcRenderer();

/**
 * 注入模拟 IPC 渲染器到 window
 */
export function injectMockIpcRenderer(): void {
  if (!window.ipcRenderer) {
    (window as Window).ipcRenderer = mockIpcRenderer;
    console.log('[MockIpcRenderer] 已注入到 window.ipcRenderer');
  }
}

