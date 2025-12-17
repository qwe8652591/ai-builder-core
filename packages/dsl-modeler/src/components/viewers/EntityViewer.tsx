/**
 * 实体查看器 - 以表格形式展示实体字段
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { EntityMetadata, ViewerProps } from '../../types';

export function EntityViewer(props: ViewerProps<EntityMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个实体查看
      </div>
    );
  }
  
  const fields = Object.values(metadata.fields || {});
  
  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 24 }}>📦</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#1890ff', color: '#fff', border: 'none' }}>实体</Tag>
      </div>
      
      {/* 描述 */}
      {metadata.comment && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.comment}</p>
      )}
      
      {/* 表名 */}
      {metadata.table && (
        <div style={{ marginBottom: 20 }}>
          <span style={{ color: '#999', marginRight: 8 }}>数据库表：</span>
          <code style={{ 
            background: '#f5f5f5', 
            padding: '4px 8px', 
            borderRadius: 4,
            fontFamily: 'Monaco, Consolas, monospace',
          }}>
            {metadata.table}
          </code>
        </div>
      )}
      
      {/* 字段表格 */}
      <Card title="📋 字段列表" style={{ marginBottom: 20 }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                字段名
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                标签
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                类型
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                必填
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                主键
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr 
                key={field.name} 
                style={{ 
                  borderBottom: '1px solid #f0f0f0',
                  background: index % 2 === 0 ? '#fff' : '#fafafa',
                }}
              >
                <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#1890ff' }}>
                  {field.name}
                </td>
                <td style={{ padding: '12px', color: '#333' }}>
                  {field.label || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <Tag style={{ background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}>
                    {field.type}
                  </Tag>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {field.required ? (
                    <span style={{ color: '#f5222d', fontWeight: 600 }}>✓</span>
                  ) : (
                    <span style={{ color: '#d9d9d9' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {field.primaryKey ? (
                    <span style={{ color: '#722ed1' }}>🔑</span>
                  ) : (
                    <span style={{ color: '#d9d9d9' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fields.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无字段定义
          </div>
        )}
      </Card>
      
      {/* 扩展信息 */}
      {metadata.extensions && metadata.extensions.length > 0 && (
        <Card title="🔗 关联扩展">
          {metadata.extensions.map((ext, index) => (
            <div key={index} style={{ 
              marginBottom: index < metadata.extensions!.length - 1 ? 16 : 0,
              padding: 12, 
              background: '#f9f0ff', 
              borderRadius: 8,
              border: '1px solid #d3adf7',
            }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#722ed1' }}>
                {ext.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ext.methods.map((method, i) => (
                  <Tag key={i} style={{ 
                    background: '#fff', 
                    color: '#666', 
                    border: '1px solid #d9d9d9',
                    fontSize: 12,
                  }}>
                    {method}()
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default EntityViewer;

