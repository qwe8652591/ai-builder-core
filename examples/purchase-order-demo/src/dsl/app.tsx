/**
 * 应用配置
 * 
 * 🎯 使用 defineApp 定义应用级别的配置和可扩展组件
 * 
 * 使用简洁语法定义组件（与 definePage 一致）
 */

import { defineApp, defineComponent } from '@qwe8652591/dsl-core';
import { Space, Button, Icon, Tag } from '@qwe8652591/std-ui';

// ==================== 自定义头部右侧组件 ====================

const CustomHeaderRight = defineComponent(
  { name: 'CustomHeaderRight', category: 'layou' },
  () => (
    <Space size="middle">
      {/* 帮助按钮 */}
      <Button type="text">
        <Icon name="QuestionCircleOutlined" />
      </Button>
      
      {/* 通知按钮 */}
      <Button type="text">
        <Icon name="BellOutlined" />
      </Button>
      
      {/* 用户标签 */}
      <Tag color="blue">管理员</Tag>
    </Space>
  )
);

// ==================== 自定义侧边栏底部组件 ====================

const CustomSidebarFooter = defineComponent(
  { name: 'CustomSidebarFooter', category: 'layout' },
  () => (
    <div style={{ 
      padding: '12px 16px', 
      borderTop: '1px solid #f0f0f0',
      textAlign: 'center',
      color: '#999',
      fontSize: '12px',
    }}>
      <div>AI Builder DSL</div>
      <div>v1.0.0</div>
    </div>
  )
);

// ==================== 应用配置 ====================

export const app = defineApp({
  // 基础信息
  name: '采购管理系统',
  logo: '📦',
  description: '企业采购订单管理系统',
  version: '1.0.0',
  
  // 布局
  layout: 'sidebar',
  
  // 主题
  theme: {
    primaryColor: '#1890ff',
    borderRadius: 6,
  },
  
  // 菜单
  menu: {
    width: 220,
  },
  
  // 头部
  header: {
    height: 56,
    showUser: true,
  },
  
  // 🎯 扩展插槽
  slots: {
    headerRight: CustomHeaderRight,
    sidebarFooter: CustomSidebarFooter,
  },
});
