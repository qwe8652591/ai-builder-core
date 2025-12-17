/**
 * 通用元数据查看器
 * 
 * 用于显示自定义类型和派生类型的元数据
 * 自动根据数据结构渲染属性列表
 */

import { Card, Tag, Space } from '@qwe8652591/std-ui';
import type { CustomMetadata, DynamicTheme } from '../../types';
import { defaultTheme } from '../../types';

export interface GenericViewerProps {
  metadata: CustomMetadata;
  theme?: DynamicTheme;
}

/** 判断值是否为对象 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 判断值是否为数组 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** 渲染值 */
function renderValue(value: unknown, depth: number = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
  }
  
  if (typeof value === 'boolean') {
    return (
      <Tag style={{ 
        background: value ? '#52c41a' : '#ff4d4f',
        color: '#fff',
        border: 'none',
      }}>
        {value ? '是' : '否'}
      </Tag>
    );
  }
  
  if (typeof value === 'number') {
    return <span style={{ color: '#1890ff', fontWeight: 500 }}>{value}</span>;
  }
  
  if (typeof value === 'string') {
    // 长字符串截断显示
    if (value.length > 100) {
      return (
        <span style={{ color: '#52c41a' }}>
          "{value.substring(0, 100)}..."
        </span>
      );
    }
    return <span style={{ color: '#52c41a' }}>"{value}"</span>;
  }
  
  if (isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: '#999' }}>[]</span>;
    }
    
    // 简单数组直接展示
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <Space style={{ flexWrap: 'wrap', gap: 4 }}>
          {value.map((item, i) => (
            <Tag key={i} style={{ margin: 0 }}>
              {String(item)}
            </Tag>
          ))}
        </Space>
      );
    }
    
    // 复杂数组展示数量
    return (
      <span style={{ color: '#999' }}>
        [{value.length} 项]
      </span>
    );
  }
  
  if (isObject(value)) {
    if (depth > 2) {
      return <span style={{ color: '#999' }}>{'{...}'}</span>;
    }
    
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span style={{ color: '#999' }}>{'{}'}</span>;
    }
    
    return (
      <div style={{ 
        background: '#fafafa', 
        borderRadius: 4, 
        padding: 8, 
        marginTop: 4,
        fontSize: 12,
      }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ marginBottom: 4 }}>
            <span style={{ color: '#722ed1' }}>{k}: </span>
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  
  return <span>{String(value)}</span>;
}

/** 获取属性分类 */
function categorizeProperties(metadata: CustomMetadata): {
  system: [string, unknown][];
  primary: [string, unknown][];
  relations: [string, unknown][];
  config: [string, unknown][];
  other: [string, unknown][];
} {
  const result = {
    system: [] as [string, unknown][],
    primary: [] as [string, unknown][],
    relations: [] as [string, unknown][],
    config: [] as [string, unknown][],
    other: [] as [string, unknown][],
  };
  
  for (const [key, value] of Object.entries(metadata)) {
    // 系统属性
    if (key.startsWith('__') || key === 'sourceFile') {
      result.system.push([key, value]);
    }
    // 主要属性
    else if (['name', 'label', 'title', 'description', 'comment'].includes(key)) {
      result.primary.push([key, value]);
    }
    // 关系属性
    else if (key.includes('source') || key.includes('target') || 
             key.includes('from') || key.includes('to') ||
             key.includes('relation') || key.includes('dependency')) {
      result.relations.push([key, value]);
    }
    // 配置属性
    else if (typeof value === 'object' && value !== null) {
      result.config.push([key, value]);
    }
    // 其他
    else {
      result.other.push([key, value]);
    }
  }
  
  return result;
}

/** 属性名映射 */
const propertyLabels: Record<string, string> = {
  name: '名称',
  label: '标签',
  title: '标题',
  description: '描述',
  comment: '注释',
  __type: '类型',
  sourceFile: '源文件',
  sourceEntity: '源实体',
  targetEntity: '目标实体',
  relationType: '关系类型',
  sourceField: '源字段',
  targetField: '目标字段',
};

export function GenericViewer(props: GenericViewerProps) {
  const { metadata, theme = defaultTheme } = props;
  const categories = categorizeProperties(metadata);
  
  const typeColor = theme.colors[metadata.__type] || '#999';
  const typeLabel = theme.labels[metadata.__type] || metadata.__type;
  
  const renderSection = (title: string, icon: string, entries: [string, unknown][]) => {
    if (entries.length === 0) return null;
    
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 500, color: '#333' }}>{title}</span>
        </div>
        
        <div style={{ display: 'grid', gap: 12 }}>
          {entries.map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ 
                color: '#666', 
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span>{propertyLabels[key] || key}</span>
                {key !== (propertyLabels[key] || key) && (
                  <span style={{ color: '#999', fontSize: 11 }}>({key})</span>
                )}
              </div>
              <div style={{ fontSize: 14 }}>
                {renderValue(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ padding: 24 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '2px solid #f0f0f0',
      }}>
        <Tag style={{ 
          background: typeColor, 
          color: '#fff', 
          border: 'none',
          fontSize: 12,
          padding: '4px 12px',
        }}>
          {typeLabel}
        </Tag>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {metadata.name}
        </h2>
      </div>
      
      {/* 主要属性 */}
      {renderSection('基本信息', '📋', categories.primary)}
      
      {/* 关系属性 */}
      {renderSection('关系信息', '🔗', categories.relations)}
      
      {/* 配置属性 */}
      {renderSection('配置详情', '⚙️', categories.config)}
      
      {/* 其他属性 */}
      {renderSection('其他属性', '📦', categories.other)}
      
      {/* 系统属性（折叠） */}
      <details style={{ marginTop: 24 }}>
        <summary style={{ 
          cursor: 'pointer', 
          color: '#999', 
          fontSize: 12,
          userSelect: 'none',
        }}>
          🔧 系统属性
        </summary>
        <div style={{ marginTop: 12 }}>
          {categories.system.map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 8,
              fontSize: 12,
              color: '#666',
            }}>
              <span style={{ color: '#999' }}>{key}:</span>
              <span>{renderValue(value)}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default GenericViewer;
