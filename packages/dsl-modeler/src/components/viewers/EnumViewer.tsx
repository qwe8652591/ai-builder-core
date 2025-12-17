/**
 * 枚举查看器 - 展示枚举值列表
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { EnumMetadata, ViewerProps } from '../../types';

export function EnumViewer(props: ViewerProps<EnumMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个枚举查看
      </div>
    );
  }
  
  const values = metadata.values || [];
  
  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 24 }}>🏷️</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#722ed1', color: '#fff', border: 'none' }}>枚举</Tag>
      </div>
      
      {/* 描述 */}
      {metadata.comment && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.comment}</p>
      )}
      
      {/* 枚举值表格 */}
      <Card title="🏷️ 枚举值">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                键
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                值
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                标签
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                颜色
              </th>
            </tr>
          </thead>
          <tbody>
            {values.map((item, index) => (
              <tr 
                key={item.key} 
                style={{ 
                  borderBottom: '1px solid #f0f0f0',
                  background: index % 2 === 0 ? '#fff' : '#fafafa',
                }}
              >
                <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#722ed1' }}>
                  {item.key}
                </td>
                <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace' }}>
                  {typeof item.value === 'string' ? `"${item.value}"` : item.value}
                </td>
                <td style={{ padding: '12px' }}>
                  {item.label ? (
                    <Tag style={{ 
                      background: item.color || '#f0f0f0', 
                      color: item.color ? '#fff' : '#666',
                      border: 'none',
                    }}>
                      {item.label}
                    </Tag>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {item.color ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: 20, 
                        height: 20, 
                        background: item.color, 
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                      }} />
                      <code style={{ fontSize: 12, color: '#666' }}>{item.color}</code>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {values.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无枚举值定义
          </div>
        )}
      </Card>
      
      {/* 快捷使用示例 */}
      <Card title="💡 使用示例" style={{ marginTop: 16 }}>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 12,
          margin: 0,
        }}>
{`// 获取枚举值
const status = ${metadata.name}.${values[0]?.key || 'EXAMPLE'};

// 获取标签
const label = ${metadata.name}.getLabel(status);

// 获取所有选项
const options = ${metadata.name}.toOptions();`}
        </pre>
      </Card>
    </div>
  );
}

export default EnumViewer;

