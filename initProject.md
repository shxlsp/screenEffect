## 项目技术栈
使用vite + react + styled-components 建设项目，要求打包后只生成一个js文件和html文件。打包产物名称应为effect.html,effect.js。
## 项目要求
项目的核心功能是提供屏幕级别特效，开启特效的方式为使用window.ipcRenderer.on监听，这个ipc会在运行时环境注入。
一共监听两个事件
`effect-animation-start` 和 `effect-animation-stop`
参数定义应为:
```ts
{
    type: string; // 特效类型
    options?: any; // 特效的配置信息
}
```
停止则不需要单独的配置信息，仅需传type
示例：
```js
window.ipcRenderer.on('effect-animation-start', (event, params) => {
    console.log(LOG_TAG, 'Received effect-animation-start:', args);
    const { type, options } = parseJsonArg(args[0]);
    console.log(LOG_TAG, 'Parsed - type:', type, 'options:', options);
    startEffect(type, options);
});

// 监听停止动画消息
// 参数格式: JSON 字符串 '{"type": "confetti"}' 或 '{}' (停止全部)
window.ipcRenderer.on('effect-animation-stop', (event, params) => {
    console.log(LOG_TAG, 'Received effect-animation-stop:', args);
    const { type } = parseJsonArg(args[0]);
    console.log(LOG_TAG, 'Parsed - type:', type);
    if (type && type !== 'default') {
        stopEffect(type);
    } else {
        stopAllEffects();
    }
});
```
- 每个特效独立运行，默认支持多特效同时run，支持通用配置，通过传入仅播放自己为true，把其他特效停止

## 架构设计
- 特效注册 - 所有组件应通过特效注册，实现
- 特效component
    - effect1
    - effect2
- root
- 特效监听分发逻辑
- 特效本地测试专用组件

### 测试组件
当环境信息配置IS_TEST为true时，模拟ipcRenderer方法注入，并注册测试组件，测试组件通过模拟出发ipcRenderer事件，达到开启or关闭各种特效的效果

## 开发规范文档生成
基于以上信息，生成完成代码后，需要生成一份开发准则，核心在于特效注册以及特效component实现