import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { effectRegistry, effectManager, mockIpcRenderer } from '../core';
import { EffectRegistration, ActiveEffect } from '../types';

const PanelContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 40px);
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #eee;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 10000;
  overflow: hidden;
  pointer-events: auto;
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const PanelContent = styled.div`
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  font-weight: 500;
`;

const EffectCard = styled.div<{ $active?: boolean }>`
  background: ${(props) =>
    props.$active
      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))'
      : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${(props) =>
      props.$active ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const EffectName = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const EffectType = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'SF Mono', Monaco, monospace;
  margin-bottom: 8px;
`;

const EffectDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  ${(props) => {
    switch (props.$variant) {
      case 'danger':
        return `
          background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
          color: white;
          &:hover { background: linear-gradient(135deg, #ff5252, #e74c4c); }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          &:hover { background: rgba(255, 255, 255, 0.15); }
        `;
      default:
        return `
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          &:hover { background: linear-gradient(135deg, #5a6fd6, #6b4094); }
        `;
    }
  }}

  &:active {
    transform: scale(0.98);
  }
`;

const StatusBadge = styled.span<{ $running?: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  margin-left: 8px;
  background: ${(props) =>
    props.$running ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${(props) => (props.$running ? '#81c784' : 'rgba(255, 255, 255, 0.5)')};
`;

const StopAllButton = styled(Button)`
  width: 100%;
  padding: 12px;
  margin-top: 8px;
`;

/**
 * 测试面板组件
 * 用于在开发环境中测试特效
 */
export const TestPanel: React.FC = () => {
  const [effects, setEffects] = useState<EffectRegistration[]>([]);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  useEffect(() => {
    // 获取所有已注册的特效
    setEffects(effectRegistry.getAll());

    // 订阅活跃特效变化
    const unsubscribe = effectManager.subscribe((active) => {
      setActiveEffects([...active]);
    });

    return unsubscribe;
  }, []);

  const handleStart = (type: string) => {
    mockIpcRenderer.sendStart(type);
  };

  const handleStartExclusive = (type: string) => {
    mockIpcRenderer.sendStart(type, { exclusive: true });
  };

  const handleStop = (type: string) => {
    mockIpcRenderer.sendStop(type);
  };

  const handleStopAll = () => {
    mockIpcRenderer.sendStop();
  };

  const isRunning = (type: string) => {
    return activeEffects.some((effect) => effect.type === type);
  };

  return (
    <PanelContainer>
      <PanelHeader>🎨 特效测试面板</PanelHeader>
      <PanelContent>
        <Section>
          <SectionTitle>已注册特效 ({effects.length})</SectionTitle>
          {effects.map((effect) => (
            <EffectCard key={effect.type} $active={isRunning(effect.type)}>
              <EffectName>
                {effect.name}
                <StatusBadge $running={isRunning(effect.type)}>
                  {isRunning(effect.type) ? '运行中' : '已停止'}
                </StatusBadge>
              </EffectName>
              <EffectType>type: "{effect.type}"</EffectType>
              {effect.description && (
                <EffectDescription>{effect.description}</EffectDescription>
              )}
              <ButtonGroup>
                {isRunning(effect.type) ? (
                  <Button $variant="danger" onClick={() => handleStop(effect.type)}>
                    停止
                  </Button>
                ) : (
                  <>
                    <Button $variant="primary" onClick={() => handleStart(effect.type)}>
                      启动
                    </Button>
                    <Button
                      $variant="secondary"
                      onClick={() => handleStartExclusive(effect.type)}
                    >
                      独占启动
                    </Button>
                  </>
                )}
              </ButtonGroup>
            </EffectCard>
          ))}
        </Section>

        {activeEffects.length > 0 && (
          <Section>
            <StopAllButton $variant="danger" onClick={handleStopAll}>
              🛑 停止所有特效
            </StopAllButton>
          </Section>
        )}
      </PanelContent>
    </PanelContainer>
  );
};

export default TestPanel;

