/**
 * 属性面板 - 右侧显示元数据的基本信息和原始 JSON
 */

import { useState } from '@qwe8652591/dsl-core';
import { Card, Tag } from '@qwe8652591/std-ui';
import type { PropertyPanelProps, AnyMetadata } from '../../types';
import { defaultTheme } from '../../types';

export function PropertyPanel(props: PropertyPanelProps) {
  const { metadata, node } = props;
  const [jsonExpanded, setJsonExpanded] = useState(false);
  
  // 空状态
  if (!metadata && !node) {
    return (
      <Card style={{ height: '100%' }}>
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#999',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>📋</span>
          <div>选择一个元数据对象</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>查看详细属性</div>
        </div>
      </Card>
    );
  }
  
  // 如果是分组节点（没有 metadata）
  if (!metadata && node) {
    return (
      <Card style={{ height: '100%' }} title="📋 属性">
        <div style={{ padding: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0' }}>
            <span>{node.icon}</span>
            <span>{node.title}</span>
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            这是一个分组节点，包含 {node.count || 0} 个子项目。
          </p>
        </div>
      </Card>
    );
  }
  
  const meta = metadata as AnyMetadata;
  
  // 获取基本信息字段
  const getInfoFields = () => {
    const fields: Array<{ label: string; value: React.ReactNode }> = [
      { label: '名称', value: meta.name },
      { 
        label: '类型', 
        value: (
          <Tag style={{ 
            background: defaultTheme.colors[meta.__type as keyof typeof defaultTheme.colors] || '#999',
            color: '#fff',
            border: 'none',
          }}>
            {defaultTheme.labels[meta.__type as keyof typeof defaultTheme.labels] || meta.__type}
          </Tag>
        ),
      },
    ];
    
    // 根据类型添加特定字段
    if ('comment' in meta && meta.comment) {
      fields.push({ label: '描述', value: meta.comment });
    }
    if ('description' in meta && meta.description) {
      fields.push({ label: '描述', value: meta.description });
    }
    if ('table' in meta && meta.table) {
      fields.push({ 
        label: '数据库表', 
        value: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{meta.table}</code>,
      });
    }
    if ('route' in meta && meta.route) {
      fields.push({ 
        label: '路由', 
        value: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{meta.route}</code>,
      });
    }
    if ('permission' in meta && meta.permission) {
      fields.push({ 
        label: '权限', 
        value: <code style={{ background: '#fff7e6', padding: '2px 6px', borderRadius: 4, color: '#fa8c16' }}>{meta.permission}</code>,
      });
    }
    if ('target' in meta && meta.target) {
      fields.push({ 
        label: '扩展目标', 
        value: <Tag style={{ background: '#1890ff', color: '#fff', border: 'none' }}>{meta.target}</Tag>,
      });
    }
    if ('category' in meta && meta.category) {
      fields.push({ 
        label: '分类', 
        value: <Tag color="green">{meta.category}</Tag>,
      });
    }
    if ('sourceFile' in meta && meta.sourceFile) {
      fields.push({ 
        label: '源文件', 
        value: (
          <span style={{ fontSize: 11, color: '#666', wordBreak: 'break-all' }}>
            {meta.sourceFile.split('/').slice(-3).join('/')}
          </span>
        ),
      });
    }
    
    return fields;
  };
  
  const infoFields = getInfoFields();
  
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }} title="📋 属性">
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* 基本信息 */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#666',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            基本信息
          </h4>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              {infoFields.map((field, index) => (
                <tr key={index}>
                  <td style={{ 
                    padding: '8px 0', 
                    width: 80, 
                    color: '#999',
                    verticalAlign: 'top',
                  }}>
                    {field.label}
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 统计信息 */}
        {'fields' in meta && meta.fields && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: '#666',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              统计
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 8,
            }}>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                  {Object.keys(meta.fields).length}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>字段数</div>
              </div>
              {'extensions' in meta && meta.extensions && (
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>
                    {meta.extensions.length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>扩展数</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {'values' in meta && meta.values && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: '#666',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              统计
            </h4>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>
                {meta.values.length}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>枚举值数量</div>
            </div>
          </div>
        )}
        
        {'components' in meta && meta.components && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: '#666',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              依赖统计
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 8,
            }}>
              <div style={{ 
                background: '#f6ffed', 
                padding: '12px', 
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                  {meta.components.length}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>组件</div>
              </div>
              {'hooks' in meta && (
                <div style={{ 
                  background: '#e6f7ff', 
                  padding: '12px', 
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                    {(meta.hooks || []).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>Hooks</div>
                </div>
              )}
              {'services' in meta && (
                <div style={{ 
                  background: '#fff1f0', 
                  padding: '12px', 
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>
                    {(meta.services || []).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>服务</div>
                </div>
              )}
              {'serviceCalls' in meta && meta.serviceCalls && (
                <div style={{ 
                  background: '#fff7e6', 
                  padding: '12px', 
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>
                    {meta.serviceCalls.length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>调用</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 原始 JSON */}
        <div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: jsonExpanded ? 12 : 0,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setJsonExpanded(!jsonExpanded)}
          >
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: 4,
              background: '#f0f0f0',
              color: '#666',
              fontSize: 10,
              transition: 'transform 0.2s',
              transform: jsonExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              ▶
            </span>
            <h4 style={{ 
              margin: 0, 
              color: '#666',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              原始 JSON
            </h4>
          </div>
          {jsonExpanded && (
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 11,
              lineHeight: 1.5,
              margin: 0,
              maxHeight: 300,
            }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}

export default PropertyPanel;

