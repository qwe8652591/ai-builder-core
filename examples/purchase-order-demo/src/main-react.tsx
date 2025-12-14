/** @jsxImportSource react */
/**
 * React 渲染模式入口 - 纯 DSL 版本
 * 
 * 通过 DSL Metadata 获取页面定义，使用 React 桥接器渲染
 * 所有服务实例化在此动态完成
 */

import 'reflect-metadata';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, Spin, Alert } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import { 
  DSLAppRenderer,
  registerComponents,
  getLayeredStats,
  vnodeToReactElement,
} from '@ai-builder/jsx-runtime';
import { 
  getAntdComponentMapping,
  Table as BaseTable,
} from '@ai-builder/runtime-renderer';

// 🎯 关键：导入 DSL 定义，自动注册到 Metadata Store 和 Page Registry
import './dsl';

// ==================== 注册 Ant Design 组件映射 ====================

const antdMapping = getAntdComponentMapping();

// 自定义 Page 组件（简化版）
const SimplePage: React.FC<{ title?: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="ant-page">
    {title && <h1 className="page-title">{title}</h1>}
    {children}
  </div>
);

// 增强版 Table：支持 VNode 到 React 的转换
const EnhancedTable: React.FC<Record<string, unknown>> = ({ columns, ...rest }) => {
  const enhancedColumns = (columns as Array<Record<string, unknown>>)?.map((col) => {
    if (col.formatter && typeof col.formatter === 'function') {
      const originalFormatter = col.formatter as (value: unknown, record: unknown, index: number) => unknown;
      return {
        ...col,
        formatter: (value: unknown, record: unknown, index: number) => {
          const result = originalFormatter(value, record, index);
          // 检查是否为 VNode（有 type 和 props 属性）
          if (result && typeof result === 'object' && 'type' in result && 'props' in result) {
            return vnodeToReactElement(result as Parameters<typeof vnodeToReactElement>[0]);
          }
          return result;
        },
      };
    }
    return col;
  });
  
  return <BaseTable columns={enhancedColumns} {...rest} />;
};

// 注册组件映射
registerComponents({
  ...antdMapping,
  Page: SimplePage,
  Table: EnhancedTable,
});

// ==================== 应用入口 ====================

const App: React.FC = () => {
  const [ready, setReady] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const init = async () => {
      try {
        console.log('=== AI Builder DSL Demo (Pure DSL Mode) ===');
        console.log('');
        
        // 打印统计信息
        const stats = getLayeredStats();
        console.log('[Init] DSL 统计:', JSON.stringify(stats, null, 2));
        console.log(`[Init] 总计: ${stats.total} 个 DSL 定义`);
        
        console.log('[Init] 初始化完成');
        setReady(true);
      } catch (e: unknown) {
        const error = e as Error;
        console.error('[Init] Error:', error);
        setInitError(error.message || '初始化失败');
      }
    };
    
    init();
  }, []);
  
  if (initError) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ padding: 24 }}>
          <Alert 
            type="error" 
            message="应用初始化失败" 
            description={initError}
            showIcon
          />
        </div>
      </ConfigProvider>
    );
  }
  
  if (!ready) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 16
        }}>
          <Spin size="large" />
          <span>初始化应用...</span>
        </div>
      </ConfigProvider>
    );
  }
  
  // 简单的 getService 实现（DSL 模式下不需要依赖注入）
  const getServiceFn = <T,>(): T => {
    throw new Error('Service not available in pure DSL mode');
  };
  
  return (
    <ConfigProvider locale={zhCN}>
      <div className="dsl-app">
        <DSLAppRenderer getService={getServiceFn} />
      </div>
    </ConfigProvider>
  );
};

// 渲染应用
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Cannot find #app element');
}
