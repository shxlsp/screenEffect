# 屏幕特效接口文档

## 概述

本文档描述了通过 IPC 通信调用屏幕特效的接口规范。外部应用可以通过 `ipcRenderer.send` 方法发送消息来启动和停止特效。

## 调用方式

### 启动特效

```javascript
const payload = JSON.stringify({ 
  type: effectType, 
  options: effectOptions 
});
window.ipcRenderer.send('effect-start', payload);
```

### 停止特效

```javascript
// 停止指定特效
const payload = JSON.stringify({ type: 'effectType' });
window.ipcRenderer.send('effect-stop', payload);

// 停止所有特效
const payload = JSON.stringify({});
window.ipcRenderer.send('effect-stop', payload);
```

## 事件名称说明

**当前代码实现**: 前端监听器当前监听的事件名称为：
- `effect-animation-start` (启动特效)
- `effect-animation-stop` (停止特效)

**文档推荐使用**: 本文档使用简化的事件名称：
- `effect-start` (启动特效)
- `effect-stop` (停止特效)

如需使用文档中推荐的事件名称，请确保：
1. 后端 IPC 处理程序将 `effect-start` 转发到 `effect-animation-start`
2. 或者修改前端监听器 (`src/core/ipcListener.ts`) 以监听 `effect-start` 和 `effect-stop`

## 支持的特效类型

### 1. riseArc - 圆弧升起

**描述**: 从屏幕底部升起3个透明圆弧，铺满屏幕后消失

**特效类型**: `riseArc`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `riseDuration` | `number` | `2000` | 升起动画时长（毫秒） |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'riseArc',
  options: {
    riseDuration: 2000
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 2. crossScan - 对向粒子扫描

**描述**: 粒子从左上与右下同时向中间汇聚并在中心爆散消散的特效

**特效类型**: `crossScan`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `duration` | `number` | `2200` | 动画总时长（毫秒） |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'crossScan',
  options: {
    duration: 2200
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 3. scan - 扫描

**描述**: 页面粒子扫描动效，适用于截图前的视觉提示

**特效类型**: `scan`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `duration` | `number` | `2000` | 扫描持续时间（毫秒） |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'scan',
  options: {
    duration: 2000
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 4. confetti - 五彩纸屑

**描述**: 庆祝时刻的五彩纸屑特效

**特效类型**: `confetti`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `particleCount` | `number` | `150` | 粒子数量 |
| `gravity` | `number` | `0.3` | 重力系数 |
| `spread` | `number` | `70` | 扩散范围 |
| `duration` | `number` | `undefined` | 持续时间（毫秒），不设置则持续播放 |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'confetti',
  options: {
    particleCount: 150,
    gravity: 0.3,
    spread: 70,
    duration: 5000  // 可选，5秒后自动停止
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 5. fireworks - 烟花

**描述**: 绚丽的烟花绽放特效

**特效类型**: `fireworks`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `launchInterval` | `number` | `500` | 烟花发射间隔（毫秒） |
| `particleCount` | `number` | `80` | 每个烟花的粒子数量 |
| `gravity` | `number` | `0.05` | 重力系数 |
| `duration` | `number` | `undefined` | 持续时间（毫秒），不设置则持续播放 |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'fireworks',
  options: {
    launchInterval: 500,
    particleCount: 80,
    gravity: 0.05,
    duration: 10000  // 可选，10秒后自动停止
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 6. glow - 发光边框

**描述**: 炫彩旋转发光边框特效

**特效类型**: `glow`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `speed` | `number` | `5000` | 旋转速度（毫秒），值越小速度越快 |
| `duration` | `number` | `0` | 持续时间（毫秒），0 表示持续播放 |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'glow',
  options: {
    speed: 5000,
    duration: 3000  // 3秒后自动停止
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

### 7. snow - 飘雪

**描述**: 冬日浪漫的雪花飘落特效

**特效类型**: `snow`

**Options 参数**:

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `snowflakeCount` | `number` | `200` | 雪花数量 |
| `windSpeed` | `number` | `0.5` | 风速系数 |
| `color` | `string` | `'#FFFFFF'` | 雪花颜色（CSS 颜色值） |
| `duration` | `number` | `undefined` | 持续时间（毫秒），不设置则持续播放 |

**示例**:

```javascript
const payload = JSON.stringify({
  type: 'snow',
  options: {
    snowflakeCount: 200,
    windSpeed: 0.5,
    color: '#FFFFFF',
    duration: 8000  // 可选，8秒后自动停止
  }
});
window.ipcRenderer.send('effect-start', payload);
```

---

## 通用 Options 参数

所有特效都支持以下通用参数：

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `exclusive` | `boolean` | `false` | 是否仅播放当前特效（停止其他特效） |
| `duration` | `number` | `undefined` | 特效持续时间（毫秒），0 或未设置表示持续播放 |

## 完整调用示例

### 示例 1: 启动扫描特效（使用默认参数）

```javascript
const payload = JSON.stringify({
  type: 'scan'
});
window.ipcRenderer.send('effect-start', payload);
```

### 示例 2: 启动烟花特效（自定义参数）

```javascript
const payload = JSON.stringify({
  type: 'fireworks',
  options: {
    launchInterval: 300,
    particleCount: 100,
    gravity: 0.08,
    duration: 5000,
    exclusive: true  // 停止其他特效
  }
});
window.ipcRenderer.send('effect-start', payload);
```

### 示例 3: 启动五彩纸屑特效（持续播放）

```javascript
const payload = JSON.stringify({
  type: 'confetti',
  options: {
    particleCount: 200,
    gravity: 0.4,
    spread: 100
    // 不设置 duration，持续播放
  }
});
window.ipcRenderer.send('effect-start', payload);
```

### 示例 4: 停止指定特效

```javascript
const payload = JSON.stringify({
  type: 'confetti'
});
window.ipcRenderer.send('effect-stop', payload);
```

### 示例 5: 停止所有特效

```javascript
const payload = JSON.stringify({});
window.ipcRenderer.send('effect-stop', payload);
```

## 注意事项

1. **Payload 格式**: `payload` 必须是 JSON 字符串，包含 `type` 和可选的 `options` 字段
2. **参数类型**: 所有数值参数均为 `number` 类型，颜色参数为 `string` 类型（CSS 颜色值）
3. **持续时间**: 如果设置了 `duration`，特效会在指定时间后自动停止；如果不设置或设置为 0，特效将持续播放直到手动停止
4. **特效叠加**: 默认情况下，多个特效可以同时播放。设置 `exclusive: true` 可以停止其他特效
5. **停止特效**: 可以通过 `effect-stop` 事件停止指定特效或所有特效

## 特效列表汇总

| 特效类型 | 特效名称 | 默认持续时间 |
|---------|---------|------------|
| `riseArc` | 圆弧升起 | 2600ms（自动） |
| `crossScan` | 对向粒子扫描 | 2200ms |
| `scan` | 扫描 | 2000ms |
| `confetti` | 五彩纸屑 | 持续播放 |
| `fireworks` | 烟花 | 持续播放 |
| `glow` | 发光边框 | 持续播放 |
| `snow` | 飘雪 | 持续播放 |

