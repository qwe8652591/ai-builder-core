/**
 * 页面查看器 - 展示页面结构和依赖关系
 */

import { useState, type VNode } from '@qwe8652591/dsl-core';
import { Card, Tag, Space } from '@qwe8652591/std-ui';
import type { PageMetadata, ViewerProps, ComponentNode, TabItem } from '../../types';

// 组件颜色映射
const getComponentColor = (name: string) => {
  if (name === 'Page' || name === 'Card') return '#1890ff';
  if (name === 'Form' || name === 'FormSection' || name === 'SmartField' || name === 'FormField') return '#52c41a';
  if (name === 'Table' || name === 'MasterDetailForm') return '#722ed1';
  if (name === 'Tabs' || name === 'Tab' || name === 'TabPane') return '#fa8c16';
  if (name === 'Button' || name === 'Space') return '#13c2c2';
  if (name === 'Conditional' || name === 'Loop') return '#eb2f96';
  if (name === 'Fragment') return '#999';
  if (name === 'DisplayValue' || name === 'Tag') return '#faad14';
  return '#666';
};

// 格式化简单 props
const formatSimpleProps = (props: Record<string, unknown> | undefined): string => {
  if (!props || Object.keys(props).length === 0) return '';
  const simpleEntries = Object.entries(props).filter(([, v]) => 
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  ).slice(0, 3);
  
  return simpleEntries.map(([k, v]) => {
    if (typeof v === 'string' && v.length > 20) return `${k}="${v.slice(0, 20)}..."`;
    if (typeof v === 'string') return `${k}="${v}"`;
    return `${k}={${v}}`;
  }).join(' ');
};

// 渲染 Tabs 数组
function renderTabsArray(tabs: TabItem[], depth: number, renderTree: (node: ComponentNode, depth: number) => VNode): VNode {
  const indent = depth * 16;
  return (
    <div>
      {tabs.map((tab, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ paddingLeft: indent, lineHeight: 1.8 }}>
            <span style={{ color: '#fa8c16' }}>&lt;TabPane</span>
            <span style={{ color: '#999' }}> key="{tab.key}" tab="{tab.tab}"</span>
            <span style={{ color: '#fa8c16' }}>&gt;</span>
          </div>
          {tab.children && renderTree(tab.children, depth + 1)}
          <div style={{ paddingLeft: indent }}>
            <span style={{ color: '#fa8c16' }}>&lt;/TabPane&gt;</span>
          </div>
        </div>
      ))}
    </div>
  ) as VNode;
}

export function PageViewer(props: ViewerProps<PageMetadata>) {
  const { metadata } = props;
  const [structureExpanded, setStructureExpanded] = useState(true);
  
  if (!metadata) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请选择一个页面查看
      </div>
    );
  }
  
  // 渲染结构树
  const renderStructureTree = (node: ComponentNode, depth: number): VNode => {
    const indent = depth * 16;
    
    // 文本节点
    if (node.component === 'Text' && node.text) {
      return (
        <div key={`text-${depth}`} style={{ paddingLeft: indent, color: '#999', fontStyle: 'italic' }}>
          "{node.text.slice(0, 30)}{node.text.length > 30 ? '...' : ''}"
        </div>
      ) as VNode;
    }
    
    const color = getComponentColor(node.component);
    const propsStr = formatSimpleProps(node.props);
    
    // 检查复杂 props
    const tabsProps = node.props ? Object.entries(node.props).filter(
      ([, v]) => Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && 'tab' in v[0]
    ) : [];
    
    const componentProps = node.props ? Object.entries(node.props).filter(
      ([, v]) => v && typeof v === 'object' && !Array.isArray(v) && 'component' in v
    ) : [];
    
    const hasComplexProps = tabsProps.length > 0 || componentProps.length > 0;
    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !hasChildren && !hasComplexProps;
    
    return (
      <div key={`${node.component}-${depth}`}>
        <div style={{ paddingLeft: indent, lineHeight: 1.8 }}>
          <span style={{ color }}>&lt;{node.component}</span>
          {propsStr && <span style={{ color: '#999' }}> {propsStr}</span>}
          {isLeaf ? (
            <span style={{ color }}> /&gt;</span>
          ) : (
            <span style={{ color }}>&gt;</span>
          )}
        </div>
        
        {/* 渲染嵌套组件 props */}
        {componentProps.map(([propName, propValue]) => {
          const nestedNode = renderStructureTree(propValue as ComponentNode, depth + 1);
          return (
            <div key={propName} style={{ paddingLeft: indent + 8 }}>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>/* {propName}: */</div>
              {nestedNode as unknown as null}
            </div>
          );
        })}
        
        {/* 渲染 Tabs */}
        {tabsProps.map(([propName, propValue]) => {
          const tabsNode = renderTabsArray(propValue as TabItem[], depth + 1, renderStructureTree);
          return (
            <div key={propName} style={{ paddingLeft: indent + 8 }}>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>/* {propName}: */</div>
              {tabsNode as unknown as null}
            </div>
          );
        })}
        
        {/* 渲染子节点 */}
        {node.children && node.children.map((child, i) => {
          const childNode = renderStructureTree(child, depth + 1);
          return <div key={i}>{childNode as unknown as null}</div>;
        })}
        
        {!isLeaf && (
          <div style={{ paddingLeft: indent }}>
            <span style={{ color }}>&lt;/{node.component}&gt;</span>
          </div>
        )}
      </div>
    ) as VNode;
  };
  
  return (
    <div style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 24 }}>📄</span>
        <h2 style={{ margin: 0 }}>{metadata.name}</h2>
        <Tag style={{ background: '#13c2c2', color: '#fff', border: 'none' }}>页面</Tag>
      </div>
      
      {/* 路由和权限 */}
      <Space style={{ marginBottom: 20 }}>
        {metadata.route && (
          <Tag style={{ background: '#f0f0f0', color: '#666' }}>
            🔗 {metadata.route}
          </Tag>
        )}
        {metadata.permission && (
          <Tag style={{ background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591' }}>
            🔐 {metadata.permission}
          </Tag>
        )}
      </Space>
      
      {/* 依赖分析 */}
      <Card title="📦 依赖分析" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {/* 组件 */}
          <div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>🧩 使用的组件</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(metadata.components || []).map((comp, i) => (
                <Tag key={i} style={{ background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f' }}>
                  {comp}
                </Tag>
              ))}
              {(!metadata.components || metadata.components.length === 0) && (
                <span style={{ color: '#d9d9d9' }}>-</span>
              )}
            </div>
          </div>
          
          {/* Hooks */}
          <div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>🪝 使用的 Hooks</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(metadata.hooks || []).map((hook, i) => (
                <Tag key={i} style={{ background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}>
                  {hook}
                </Tag>
              ))}
              {(!metadata.hooks || metadata.hooks.length === 0) && (
                <span style={{ color: '#d9d9d9' }}>-</span>
              )}
            </div>
          </div>
          
          {/* 服务 */}
          <div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>🎯 导入的服务</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(metadata.services || []).map((svc, i) => (
                <Tag key={i} style={{ background: '#fff1f0', color: '#f5222d', border: '1px solid #ffa39e' }}>
                  {svc}
                </Tag>
              ))}
              {(!metadata.services || metadata.services.length === 0) && (
                <span style={{ color: '#d9d9d9' }}>-</span>
              )}
            </div>
          </div>
          
          {/* 类型 */}
          <div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>📦 引用的类型</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(metadata.types || []).map((type, i) => (
                <Tag key={i} style={{ background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591' }}>
                  {type}
                </Tag>
              ))}
              {(!metadata.types || metadata.types.length === 0) && (
                <span style={{ color: '#d9d9d9' }}>-</span>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* 服务调用明细 */}
      {metadata.serviceCalls && metadata.serviceCalls.length > 0 && (
        <Card title="🔌 服务方法调用" style={{ marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>服务</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>方法</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 80 }}>行号</th>
              </tr>
            </thead>
            <tbody>
              {metadata.serviceCalls.map((call, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px' }}>
                    <Tag color="red">{call.service}</Tag>
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'Monaco, Consolas, monospace', color: '#1890ff' }}>
                    {call.method}()
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: 12 }}>
                    {call.line || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      
      {/* 页面结构 */}
      {metadata.structure && (
        <Card style={{ marginBottom: 16 }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: structureExpanded ? 12 : 0,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setStructureExpanded(!structureExpanded)}
          >
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 4,
              background: '#f0f0f0',
              color: '#666',
              fontSize: 12,
              transition: 'transform 0.2s',
              transform: structureExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              ▶
            </span>
            <span style={{ fontWeight: 500 }}>🏗️ 页面结构</span>
            <span style={{ color: '#999', fontSize: 12 }}>
              {structureExpanded ? '点击收起' : '点击展开'}
            </span>
          </div>
          {structureExpanded && (() => {
            const structureNode = renderStructureTree(metadata.structure!, 0);
            return (
              <div style={{ 
                background: '#fafafa', 
                border: '1px solid #f0f0f0',
                borderRadius: 8, 
                padding: 12,
                fontSize: 13,
                fontFamily: 'Monaco, Consolas, monospace',
                overflow: 'auto',
                maxHeight: 500,
              }}>
                {structureNode as unknown as null}
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
}

export default PageViewer;

