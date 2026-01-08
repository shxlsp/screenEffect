import { useEffect, useMemo } from 'react';
import { createGlobalStyle } from 'styled-components';
import { EffectContainer } from './components/EffectContainer';
import { TestPanel } from './components/TestPanel';
import { initIpcListener, injectMockIpcRenderer } from './core';

// 导入所有特效（触发自动注册）
import './effects';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }
`;

// 检查是否为测试模式
const isTestMode = (): boolean => {
  return import.meta.env.IS_TEST;
};

function App() {
  // 在模块加载时就确定测试模式状态
  const isTest = useMemo(() => isTestMode(), []);
  console.log('isTest', isTest);
  useEffect(() => {
    // 测试模式下注入模拟 IPC
    if (isTest) {
      console.log('[App] 测试模式已启用');
      injectMockIpcRenderer();
    }

    // 延迟初始化 IPC 监听器，确保 mockIpcRenderer 已注入
    setTimeout(() => {
      initIpcListener();
      console.log('[App] 特效系统初始化完成');
    }, 0);
  }, [isTest]);

  return (
    <>
      <GlobalStyle />
      <EffectContainer />
      {isTest && <TestPanel />}
    </>
  );
}

export default App;

