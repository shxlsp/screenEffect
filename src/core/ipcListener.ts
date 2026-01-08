import { effectManager } from './effectManager';
import { parseJsonArg } from '../utils/parseJsonArg';

const LOG_TAG = '[IpcListener]';

/**
 * 初始化 IPC 监听器
 * 监听特效启动和停止事件
 */
export function initIpcListener(): void {
  const ipcRenderer = window.ipcRenderer;

  if (!ipcRenderer) {
    console.warn(`${LOG_TAG} window.ipcRenderer 不存在，跳过 IPC 监听初始化`);
    return;
  }

  console.log(`${LOG_TAG} 初始化 IPC 监听器`);

  // 监听启动动画消息
  ipcRenderer.on('effect-animation-start', (_event: unknown, ...args: unknown[]) => {
    console.log(LOG_TAG, 'Received effect-animation-start:', args);
    const { type, options } = parseJsonArg(args[0]);
    console.log(LOG_TAG, 'Parsed - type:', type, 'options:', options);
    effectManager.startEffect(type, options);
  });

  // 监听停止动画消息
  // 参数格式: JSON 字符串 '{"type": "confetti"}' 或 '{}' (停止全部)
  ipcRenderer.on('effect-animation-stop', async (_event: unknown, ...args: unknown[]) => {
    console.log(LOG_TAG, 'Received effect-animation-stop:', args);
    const { type } = parseJsonArg(args[0]);
    console.log(LOG_TAG, 'Parsed - type:', type);
    try {
      if (type && type !== 'default') {
        await effectManager.stopEffect(type);
      } else {
        await effectManager.stopAllEffects();
      }
    } catch (error) {
      console.error(`${LOG_TAG} 停止特效时出错:`, error);
    }
  });

  console.log(`${LOG_TAG} IPC 监听器初始化完成`);
}

