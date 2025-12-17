/**
 * 服务查看器 - 展示应用服务的方法列表
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { ServiceMetadata, ViewerProps } from '../../types';

export function ServiceViewer(props: ViewerProps<ServiceMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个服务查看
      </div>
    );
  }
  
  const methods = metadata.methods || [];
  
  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 24 }}>🎯</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#f5222d', color: '#fff', border: 'none' }}>应用服务</Tag>
      </div>
      
      {/* 描述 */}
      {metadata.comment && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.comment}</p>
      )}
      
      {/* 方法列表 */}
      <Card title="📋 服务方法">
        {methods.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  方法名
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  参数
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  返回类型
                </th>
              </tr>
            </thead>
            <tbody>
              {methods.map((method, index) => (
                <tr 
                  key={method.name} 
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    background: index % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#f5222d' }}>
                    {method.name}()
                  </td>
                  <td style={{ padding: '12px' }}>
                    {method.params && method.params.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {method.params.map((param, i) => (
                          <Tag key={i} style={{ 
                            background: '#f0f0f0', 
                            color: '#666',
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: 11,
                          }}>
                            {param}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#d9d9d9' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {method.returnType ? (
                      <Tag style={{ 
                        background: '#e6f7ff', 
                        color: '#1890ff', 
                        border: '1px solid #91d5ff',
                        fontFamily: 'Monaco, Consolas, monospace',
                        fontSize: 11,
                      }}>
                        {method.returnType}
                      </Tag>
                    ) : (
                      <span style={{ color: '#d9d9d9' }}>void</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            padding: 40, 
            textAlign: 'center', 
            color: '#999',
            background: '#fafafa',
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>📭</span>
            <div>暂无方法定义</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              服务方法将在后续版本中完善分析
            </div>
          </div>
        )}
      </Card>
      
      {/* 使用示例 */}
      <Card title="💡 使用示例" style={{ marginTop: 16 }}>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 12,
          margin: 0,
        }}>
{`// 在页面中使用服务
import { ${metadata.name} } from '@/dsl/services';

// 调用服务方法
${methods.length > 0 ? `const result = await ${metadata.name}.${methods[0].name}();` : `const result = await ${metadata.name}.someMethod();`}`}
        </pre>
      </Card>
    </div>
  );
}

export default ServiceViewer;

