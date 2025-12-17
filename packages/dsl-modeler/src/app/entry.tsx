/**
 * DSL Modeler 独立运行入口
 * 
 * 采用类似 OutSystems 的明亮风格
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ModelerApp } from './ModelerApp';

// 挂载应用
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#cc0000', // OutSystems 红色主题
            colorBgContainer: '#ffffff',
            colorBgElevated: '#ffffff',
            colorBorder: '#e0e0e0',
            colorText: '#333333',
            colorTextSecondary: '#666666',
            borderRadius: 4,
          },
          components: {
            Table: {
              headerBg: '#f5f5f5',
              headerColor: '#333333',
              rowHoverBg: '#f9f9f9',
              borderColor: '#e8e8e8',
            },
            Tree: {
              nodeHoverBg: '#f0f0f0',
              nodeSelectedBg: '#e6f7ff',
            },
          },
        }}
      >
        <AntdApp>
          <ModelerApp />
        </AntdApp>
      </ConfigProvider>
    </React.StrictMode>
  );
}

