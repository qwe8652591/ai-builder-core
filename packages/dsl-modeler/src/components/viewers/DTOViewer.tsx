/**
 * DTO 查看器 - 以表格形式展示 DTO 字段
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { DTOMetadata, ViewerProps } from '../../types';

export function DTOViewer(props: ViewerProps<DTOMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个 DTO 查看
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
        <span style={{ fontSize: 24 }}>📤</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#fa8c16', color: '#fff', border: 'none' }}>DTO</Tag>
      </div>
      
      {/* 描述 */}
      {metadata.comment && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.comment}</p>
      )}
      
      {/* 字段表格 */}
      <Card title="📋 字段列表">
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
                <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#fa8c16' }}>
                  {field.name}
                </td>
                <td style={{ padding: '12px', color: '#333' }}>
                  {field.label || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <Tag style={{ background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591' }}>
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
    </div>
  );
}

export default DTOViewer;

