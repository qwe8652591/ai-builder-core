/**
 * 组件查看器 - 展示业务组件的 Props 和使用的基础组件
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { ComponentMetadata, ViewerProps } from '../../types';

export function ComponentViewer(props: ViewerProps<ComponentMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个组件查看
      </div>
    );
  }
  
  const componentProps = metadata.props || [];
  const usedComponents = metadata.usedComponents || [];
  
  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 24 }}>🧩</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#52c41a', color: '#fff', border: 'none' }}>业务组件</Tag>
        {metadata.category && (
          <Tag style={{ background: '#f0f0f0', color: '#666' }}>{metadata.category}</Tag>
        )}
      </div>
      
      {/* 描述 */}
      {metadata.description && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.description}</p>
      )}
      
      {/* Props 表格 */}
      <Card title="📝 Props 定义" style={{ marginBottom: 16 }}>
        {componentProps.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  属性名
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  类型
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', fontWeight: 600, width: 80 }}>
                  必填
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  描述
                </th>
              </tr>
            </thead>
            <tbody>
              {componentProps.map((prop, index) => (
                <tr 
                  key={prop.name} 
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    background: index % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#52c41a' }}>
                    {prop.name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Tag style={{ 
                      background: '#fff7e6', 
                      color: '#fa8c16', 
                      border: '1px solid #ffd591',
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: 11,
                    }}>
                      {prop.type}
                    </Tag>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {prop.required ? (
                      <Tag style={{ background: '#fff1f0', color: '#f5222d', border: '1px solid #ffa39e' }}>
                        是
                      </Tag>
                    ) : (
                      <Tag style={{ background: '#f0f0f0', color: '#999' }}>否</Tag>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#666' }}>
                    {prop.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无 Props 定义
          </div>
        )}
      </Card>
      
      {/* 使用的基础组件 */}
      <Card title="🧱 使用的基础组件" style={{ marginBottom: 16 }}>
        {usedComponents.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
            {usedComponents.map((comp, index) => (
              <Tag 
                key={index} 
                style={{ 
                  background: '#e6fffb', 
                  color: '#13c2c2', 
                  border: '1px solid #87e8de',
                  padding: '4px 12px',
                  fontSize: 13,
                }}
              >
                {comp}
              </Tag>
            ))}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无使用的基础组件
          </div>
        )}
      </Card>
      
      {/* 组件预览（占位） */}
      <Card title="👁️ 组件预览" style={{ marginBottom: 16 }}>
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#999',
          background: '#fafafa',
          borderRadius: 8,
          border: '2px dashed #d9d9d9',
        }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🎨</span>
          <div>组件预览功能开发中...</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            未来将支持在此区域实时预览组件效果
          </div>
        </div>
      </Card>
      
      {/* 使用示例 */}
      <Card title="💡 使用示例">
        <pre style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 12,
          margin: 0,
        }}>
{`import { ${metadata.name} } from '@/dsl/components';

// 基本用法
<${metadata.name}${componentProps.filter(p => p.required).length > 0 ? '\n  ' + componentProps.filter(p => p.required).map(p => `${p.name}={/* ${p.type} */}`).join('\n  ') : ''}
/>`}
        </pre>
      </Card>
    </div>
  );
}

export default ComponentViewer;

