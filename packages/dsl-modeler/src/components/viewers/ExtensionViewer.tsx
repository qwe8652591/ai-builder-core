/**
 * 扩展查看器 - 展示 DSL 扩展的方法
 */

import { Card, Tag } from '@qwe8652591/std-ui';
import type { ExtensionMetadata, ViewerProps } from '../../types';

export function ExtensionViewer(props: ViewerProps<ExtensionMetadata>) {
  const { metadata } = props;
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个扩展查看
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
        <span style={{ fontSize: 24 }}>🔗</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#9254de', color: '#fff', border: 'none' }}>DSL 扩展</Tag>
      </div>
      
      {/* 扩展目标 */}
      {metadata.target && (
        <div style={{ 
          marginBottom: 20,
          padding: 12,
          background: '#f9f0ff',
          borderRadius: 8,
          border: '1px solid #d3adf7',
        }}>
          <span style={{ color: '#999', marginRight: 8 }}>扩展目标：</span>
          <Tag style={{ background: '#1890ff', color: '#fff', border: 'none' }}>
            📦 {metadata.target}
          </Tag>
        </div>
      )}
      
      {/* 描述 */}
      {metadata.description && (
        <p style={{ color: '#666', marginBottom: 20 }}>{metadata.description}</p>
      )}
      
      {/* 扩展方法 */}
      <Card title="🔗 扩展方法">
        {methods.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  方法名
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontWeight: 600 }}>
                  描述
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
                  <td style={{ padding: '12px', fontFamily: 'Monaco, Consolas, monospace', color: '#9254de' }}>
                    {method.name}()
                  </td>
                  <td style={{ padding: '12px', color: '#666' }}>
                    {method.description || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {method.returnType ? (
                      <Tag style={{ 
                        background: '#f9f0ff', 
                        color: '#722ed1', 
                        border: '1px solid #d3adf7',
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
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无扩展方法
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
{`// 扩展会自动挂载到目标实体上
// 在实体实例上调用扩展方法

${metadata.target ? `const ${metadata.target.toLowerCase()} = await ${metadata.target}Repository.findById(id);` : '// const entity = await EntityRepository.findById(id);'}

// 调用扩展方法
${methods.length > 0 
  ? `const result = ${metadata.target?.toLowerCase() || 'entity'}.${methods[0].name}();`
  : '// const result = entity.extensionMethod();'
}`}
        </pre>
      </Card>
    </div>
  );
}

export default ExtensionViewer;

