# 屏幕特效系统开发指南

## 目录

- [项目概述](#项目概述)
- [快速开始](#快速开始)
- [项目架构](#项目架构)
- [特效开发指南](#特效开发指南)
- [API 参考](#api-参考)
- [测试指南](#测试指南)
- [构建部署](#构建部署)

---

## 项目概述

本项目是一个屏幕级别特效系统，基于 Vite + React + styled-components 构建。通过监听 IPC 事件来控制特效的启动和停止，支持多特效同时运行。

### 技术栈

- **Vite** - 构建工具
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **styled-components** - CSS-in-JS 样式方案

### 核心特性

- ✅ 特效组件化，易于扩展
- ✅ 支持多特效同时运行
- ✅ 支持独占模式（停止其他特效）
- ✅ 自动持续时间控制
- ✅ 开发模式测试面板
- ✅ 单文件打包输出

---

## 快速开始

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
yarn run dev
```

访问 `http://localhost:5173` 即可看到测试面板。

### 构建生产版本

```bash
yarn run build
```

构建产物位于 `dist/` 目录，包含 `effect.html` 和 `effect.js`。

---

## 项目架构

```
src/
├── main.tsx                 # 应用入口
├── App.tsx                  # 主应用组件
├── vite-env.d.ts           # Vite 环境类型
├── types/
│   └── index.ts            # 类型定义
├── core/
│   ├── index.ts            # 核心模块导出
│   ├── effectRegistry.ts   # 特效注册表
│   ├── effectManager.ts    # 特效管理器
│   ├── ipcListener.ts      # IPC 监听器
│   └── mockIpcRenderer.ts  # 模拟 IPC（测试用）
├── effects/
│   ├── index.ts            # 特效统一导出
│   ├── Confetti/           # 五彩纸屑特效
│   ├── Snow/               # 雪花特效
│   └── Fireworks/          # 烟花特效
├── components/
│   ├── EffectContainer.tsx # 特效容器
│   └── TestPanel.tsx       # 测试面板
└── utils/
    └── parseJsonArg.ts     # JSON 解析工具
```

### 核心模块说明

| 模块 | 说明 |
|------|------|
| `effectRegistry` | 管理所有已注册的特效组件 |
| `effectManager` | 控制特效的启动、停止和状态管理 |
| `ipcListener` | 监听 IPC 事件并分发到特效管理器 |
| `EffectContainer` | 渲染所有活跃的特效组件 |

---

## 特效开发指南

### 创建新特效

#### 1. 创建特效目录和组件

在 `src/effects/` 下创建新目录，如 `MyEffect/`：

```
src/effects/
└── MyEffect/
    └── index.tsx
```

#### 2. 实现特效组件

```tsx
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EffectComponentProps } from '../../types';
import { effectRegistry } from '../../core';

// 样式定义
const Canvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
`;

// 特效组件
export const MyEffect: React.FC<EffectComponentProps> = ({ options, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // 从 options 获取配置（带默认值）
  const speed = (options?.speed as number) || 1;
  const color = (options?.color as string) || '#ffffff';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 设置画布尺寸
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 动画逻辑
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // TODO: 实现你的特效动画逻辑
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 如果设置了持续时间，自动完成
    if (options?.duration && onComplete) {
      setTimeout(onComplete, options.duration);
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [options, onComplete, speed, color]);

  return <Canvas ref={canvasRef} />;
};

// 注册特效（关键步骤！）
effectRegistry.register({
  type: 'my-effect',        // 唯一标识，用于 IPC 调用
  component: MyEffect,       // 特效组件
  name: '我的特效',          // 显示名称
  description: '这是一个自定义特效', // 描述
  defaultOptions: {          // 默认配置
    speed: 1,
    color: '#ffffff',
  },
});

export default MyEffect;
```

#### 3. 在索引中导入

编辑 `src/effects/index.ts`，添加导入：

```ts
// 导入新特效（触发自动注册）
import './MyEffect';

// 导出供外部使用（可选）
export { MyEffect } from './MyEffect';
```

### 特效组件规范

#### Props 接口

```ts
interface EffectComponentProps {
  options?: EffectOptions;    // 特效配置
  onComplete?: () => void;    // 完成回调
}

interface EffectOptions {
  exclusive?: boolean;        // 是否独占模式
  duration?: number;          // 持续时间（毫秒）
  [key: string]: unknown;     // 自定义配置
}
```

#### 必须遵循的规范

1. **全屏覆盖**：使用 `position: fixed` 覆盖整个屏幕
2. **不阻挡交互**：设置 `pointer-events: none`
3. **高层级**：使用高 `z-index` 确保在最上层
4. **资源清理**：在 `useEffect` 返回函数中清理动画和事件监听
5. **响应式**：监听窗口 resize 事件调整尺寸

#### 性能优化建议

- 使用 `requestAnimationFrame` 进行动画
- 使用 `useRef` 存储非响应式数据（粒子数组等）
- 合理控制粒子数量
- 使用 Canvas 2D 或 WebGL 绑定高性能渲染

---

## API 参考

### effectRegistry

特效注册表，管理所有特效组件。

```ts
// 注册特效
effectRegistry.register({
  type: string;                           // 唯一标识
  component: ComponentType<EffectComponentProps>; // 组件
  name: string;                           // 名称
  description?: string;                   // 描述
  defaultOptions?: EffectOptions;         // 默认配置
});

// 获取特效
effectRegistry.get(type: string): EffectRegistration | undefined;

// 获取所有特效
effectRegistry.getAll(): EffectRegistration[];

// 检查是否存在
effectRegistry.has(type: string): boolean;
```

### effectManager

特效管理器，控制特效运行状态。

```ts
// 启动特效
effectManager.startEffect(type: string, options?: EffectOptions): string | null;

// 停止特效
effectManager.stopEffect(type: string): void;

// 停止所有特效
effectManager.stopAllEffects(): void;

// 检查是否运行中
effectManager.isRunning(type: string): boolean;

// 获取活跃特效
effectManager.getActiveEffects(): ActiveEffect[];

// 订阅变化
effectManager.subscribe(listener: (effects: ActiveEffect[]) => void): () => void;
```

### IPC 事件

#### effect-animation-start

启动特效事件。

```ts
// 参数格式
{
  type: string;       // 特效类型
  options?: {
    exclusive?: boolean;  // 独占模式
    duration?: number;    // 持续时间
    // ... 其他配置
  }
}

// 示例
window.ipcRenderer.emit('effect-animation-start', JSON.stringify({
  type: 'confetti',
  options: { exclusive: true, duration: 5000 }
}));
```

#### effect-animation-stop

停止特效事件。

```ts
// 停止指定特效
{ type: 'confetti' }

// 停止所有特效
{ type: '' } 或 {}
```

---

## 测试指南

### 开发环境测试

开发模式下自动启用测试面板，可以：

- 查看所有已注册的特效
- 启动/停止单个特效
- 独占模式启动（停止其他特效）
- 一键停止所有特效

### URL 参数

- `?test=true` - 强制启用测试模式
- `?IS_TEST=true` - 强制启用测试模式

### 模拟 IPC 调用

在控制台中手动触发：

```js
// 启动五彩纸屑
window.ipcRenderer.emit('effect-animation-start', JSON.stringify({
  type: 'confetti',
  options: { particleCount: 200 }
}));

// 停止五彩纸屑
window.ipcRenderer.emit('effect-animation-stop', JSON.stringify({
  type: 'confetti'
}));

// 停止所有特效
window.ipcRenderer.emit('effect-animation-stop', JSON.stringify({}));
```

---

## 构建部署

### 构建命令

```bash
npm run build
```

### 输出文件

- `dist/index.html` - HTML 入口（需手动重命名为 effect.html）
- `dist/effect.js` - JavaScript 包

### 使用方式

在 Electron 或其他环境中：

1. 加载 `effect.html`
2. 注入 `window.ipcRenderer`
3. 通过 IPC 事件控制特效

```js
// 主进程示例
const win = new BrowserWindow({ transparent: true, frame: false });
win.loadFile('effect.html');

// 发送特效命令
win.webContents.send('effect-animation-start', JSON.stringify({
  type: 'fireworks',
  options: { duration: 10000 }
}));
```

---

## 已有特效列表

| 类型 | 名称 | 描述 | 配置项 |
|------|------|------|--------|
| `confetti` | 五彩纸屑 | 庆祝时刻的五彩纸屑 | `particleCount`, `gravity`, `spread` |
| `snow` | 飘雪 | 冬日浪漫的雪花飘落 | `snowflakeCount`, `windSpeed`, `color` |
| `fireworks` | 烟花 | 绚丽的烟花绽放 | `launchInterval`, `particleCount`, `gravity` |

---

## 贡献指南

1. 新特效请遵循上述开发规范
2. 确保特效组件正确清理资源
3. 提供合理的默认配置
4. 添加中文名称和描述
5. 更新本文档的特效列表

