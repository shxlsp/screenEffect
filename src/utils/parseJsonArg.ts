import { EffectParams } from '../types';

/**
 * 解析 JSON 参数
 * @param arg 参数（可能是字符串或对象）
 * @returns 解析后的特效参数
 */
export function parseJsonArg(arg: unknown): EffectParams {
  if (!arg) {
    return { type: 'default' };
  }

  // 如果已经是对象，直接返回
  if (typeof arg === 'object' && arg !== null) {
    const obj = arg as Record<string, unknown>;
    return {
      type: (obj.type as string) || 'default',
      options: obj.options as EffectParams['options'],
    };
  }

  // 如果是字符串，尝试解析 JSON
  if (typeof arg === 'string') {
    try {
      const parsed = JSON.parse(arg);
      return {
        type: parsed.type || 'default',
        options: parsed.options,
      };
    } catch (e) {
      console.error('[parseJsonArg] JSON 解析失败:', e);
      return { type: 'default' };
    }
  }

  return { type: 'default' };
}

