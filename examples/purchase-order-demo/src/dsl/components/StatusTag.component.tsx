/**
 * 状态标签组件
 * 
 * 使用 defineComponent 简洁语法定义
 */

import { defineComponent } from '@ai-builder/jsx-runtime';
import { Tag } from '@ai-builder/std-ui';

/** 状态标签 Props */
export interface StatusTagProps {
  status: string;
  label?: string;
  colorMap?: Record<string, string>;
}

/** 默认状态颜色映射 */
const DEFAULT_COLOR_MAP: Record<string, string> = {
  DRAFT: 'default',
  PENDING: 'processing',
  APPROVED: 'success',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'default',
  ACTIVE: 'success',
  INACTIVE: 'default',
};

/**
 * 状态标签组件
 * 
 * 根据状态值自动匹配颜色
 */
export const StatusTag = defineComponent<StatusTagProps>(
  { 
    name: 'StatusTag', 
    description: '状态标签，根据状态自动匹配颜色',
    category: 'data',
  },
  (props) => {
    const colorMap = props.colorMap || DEFAULT_COLOR_MAP;
    const color = colorMap[props.status] || 'default';
    const label = props.label || props.status;
    
    return <Tag color={color}>{label}</Tag>;
  }
);

export default StatusTag;
