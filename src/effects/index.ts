/**
 * 特效组件导出
 * 所有特效组件在此统一导入，以触发自动注册
 */

// 五彩纸屑特效
import './Confetti';

// 雪花特效
import './Snow';

// 烟花特效
import './Fireworks';

// 发光边框特效
import './Glow';

// 扫描特效
import './Scan';

// 对向粒子扫描特效
import './CrossScan';

// 圆弧升起特效
import './RiseArc';

// 彩色边框特效
import './ConicBorder';

// 导出供外部使用（如有需要）
export { ConfettiEffect } from './Confetti';
export { SnowEffect } from './Snow';
export { FireworksEffect } from './Fireworks';
export { GlowEffect } from './Glow';
export { ScanEffect } from './Scan';
export { CrossScanEffect } from './CrossScan';
export { RiseArcEffect } from './RiseArc';
export { ConicBorderEffect } from './ConicBorder';

