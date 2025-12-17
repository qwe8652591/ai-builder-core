/**
 * DSL Modeler 主应用组件
 * 
 * 三栏布局：
 * - 左侧：元数据资源目录（树形导航）
 * - 中间：预览/编辑器区域
 * - 右侧：属性面板
 */

import React, { useState, useEffect } from 'react';
import { Input, Button, Tag, Tooltip, Collapse, Table, Empty, Spin, Modal } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  ExpandOutlined,
  CompressOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ApiOutlined,
  SettingOutlined,
  CodeOutlined,
  RightOutlined,
  DownOutlined,
  FullscreenOutlined,
  CopyOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { ERDiagram, EntityRelation } from './ERDiagram';
import type { 
  ASTMetadata, 
  TreeNode, 
  AnyMetadata, 
  EntityMetadata, 
  DTOMetadata, 
  EnumMetadata,
  PageMetadata,
  ComponentMetadata,
  ServiceMetadata,
  ExtensionMetadata,
  ComponentNode,
} from './types';
import { layerConfig, typeColors, typeLabels, typeIcons } from './types';

// ==================== 样式常量（OutSystems 风格：明亮主题）====================
const SIDER_WIDTH = 280;
const PANEL_WIDTH = 320;

// OutSystems 风格的颜色
const colors = {
  primary: '#cc0000',        // OutSystems 红色
  primaryHover: '#a30000',
  bg: '#f5f5f5',             // 浅灰背景
  bgWhite: '#ffffff',
  bgHover: '#e8e8e8',
  bgSelected: '#e6f4ff',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: colors.bg,
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  sider: {
    width: SIDER_WIDTH,
    background: colors.bgWhite,
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  panel: {
    width: PANEL_WIDTH,
    background: colors.bgWhite,
    borderLeft: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
  },
  header: {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: colors.textSecondary,
    background: colors.bgWhite,
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
};

// ==================== JSON 语法高亮 ====================
interface JsonToken {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';
  value: string;
}

function syntaxHighlightJson(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  
  const getTokenStyle = (type: JsonToken['type']): React.CSSProperties => {
    switch (type) {
      case 'key':
        return { color: '#0451a5' }; // 蓝色 - 键名
      case 'string':
        return { color: '#a31515' }; // 红色 - 字符串值
      case 'number':
        return { color: '#098658' }; // 绿色 - 数字
      case 'boolean':
        return { color: '#0000ff' }; // 深蓝色 - 布尔值
      case 'null':
        return { color: '#0000ff' }; // 深蓝色 - null
      case 'punctuation':
        return { color: '#333333' }; // 黑色 - 标点符号
      default:
        return {};
    }
  };
  
  const highlightLine = (line: string, lineIndex: number): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // 匹配各种 JSON 元素
    const regex = /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([\[\]{}:,])/g;
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      // 添加匹配前的空白
      if (match.index > currentIndex) {
        elements.push(line.substring(currentIndex, match.index));
      }
      
      if (match[1]) {
        // 键名（带冒号）
        const key = match[1];
        elements.push(
          <span key={`${lineIndex}-${match.index}-key`} style={getTokenStyle('key')}>
            {key}
          </span>
        );
        // 找到冒号的位置并单独渲染
        const colonPos = match[0].indexOf(':');
        if (colonPos > key.length - 1) {
          elements.push(match[0].substring(key.length, colonPos));
        }
        elements.push(
          <span key={`${lineIndex}-${match.index}-colon`} style={getTokenStyle('punctuation')}>
            :
          </span>
        );
      } else if (match[2]) {
        // 字符串值
        elements.push(
          <span key={`${lineIndex}-${match.index}-str`} style={getTokenStyle('string')}>
            {match[2]}
          </span>
        );
      } else if (match[3]) {
        // 数字
        elements.push(
          <span key={`${lineIndex}-${match.index}-num`} style={getTokenStyle('number')}>
            {match[3]}
          </span>
        );
      } else if (match[4]) {
        // 布尔值
        elements.push(
          <span key={`${lineIndex}-${match.index}-bool`} style={getTokenStyle('boolean')}>
            {match[4]}
          </span>
        );
      } else if (match[5]) {
        // null
        elements.push(
          <span key={`${lineIndex}-${match.index}-null`} style={getTokenStyle('null')}>
            {match[5]}
          </span>
        );
      } else if (match[6]) {
        // 标点符号
        elements.push(
          <span key={`${lineIndex}-${match.index}-punc`} style={getTokenStyle('punctuation')}>
            {match[6]}
          </span>
        );
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // 添加剩余的内容
    if (currentIndex < line.length) {
      elements.push(line.substring(currentIndex));
    }
    
    return elements.length > 0 ? elements : line;
  };
  
  return lines.map((line, index) => (
    <div key={index} style={{ display: 'flex' }}>
      <span style={{ 
        color: '#999', 
        minWidth: 40, 
        textAlign: 'right', 
        paddingRight: 16,
        userSelect: 'none',
        borderRight: '1px solid #e0e0e0',
        marginRight: 16,
      }}>
        {index + 1}
      </span>
      <span style={{ flex: 1 }}>{highlightLine(line, index)}</span>
    </div>
  ));
}

// ==================== 工具函数 ====================

/** 实体关系图谱的特殊元数据类型 */
interface ERDiagramMetadata {
  __type: 'erDiagram' | 'tableERDiagram';
  name: string;
  relationCount: number;
  entityCount: number;
  // 表关系图谱特有
  tableCount?: number;
}

function buildTreeData(data: ASTMetadata, entityRelations?: EntityRelation[]): TreeNode[] {
  const tree: TreeNode[] = [];
  
  Object.entries(layerConfig).forEach(([layerKey, layerInfo]) => {
    const layerNode: TreeNode = {
      key: layerKey,
      title: layerInfo.title,
      icon: layerInfo.icon,
      type: 'layer',
      children: [],
      count: 0,
    };
    
    Object.entries(layerInfo.subLayers).forEach(([subLayerKey, subLayerInfo]) => {
      const subLayerNode: TreeNode = {
        key: `${layerKey}-${subLayerKey}`,
        title: subLayerInfo.title,
        icon: subLayerInfo.icon,
        type: 'subLayer',
        children: [],
        count: 0,
        badge: (subLayerInfo as any).badge,  // 自定义类型标识
      };
      
      const items = (data[subLayerInfo.dataKey] || []) as AnyMetadata[];
      
      items.forEach((item) => {
        // 根据元数据类型获取图标
        const itemIcon = typeIcons[item.__type] || '📝';
        
        subLayerNode.children!.push({
          key: `${layerKey}-${subLayerKey}-${item.name}`,
          title: item.name,
          icon: itemIcon,
          type: 'item',
          metadata: item,
        });
      });
      
      subLayerNode.count = items.length;
      layerNode.children!.push(subLayerNode);
      layerNode.count! += items.length;
    });
    
    // 🎯 在领域层添加"实体关系图谱"节点
    if (layerKey === 'domain' && entityRelations && entityRelations.length > 0) {
      const entityCount = new Set(entityRelations.flatMap(r => [r.source, r.target])).size;
      const erDiagramNode: TreeNode = {
        key: 'domain-erDiagram',
        title: '实体关系图谱',
        icon: '🔗',
        type: 'item',
        metadata: {
          __type: 'erDiagram',
          name: '实体关系图谱',
          relationCount: entityRelations.length,
          entityCount,
        } as ERDiagramMetadata,
      };
      // 插入到领域层的第一个位置
      layerNode.children!.unshift(erDiagramNode);
      layerNode.count! += 1;
    }
    
    // 🎯 在基础设施层添加数据库表相关节点
    if (layerKey === 'infrastructure') {
      const entities = (data.entities || []) as EntityMetadata[];
      const tablesWithName = entities.filter(e => e.table);
      
      if (tablesWithName.length > 0) {
        // 添加"数据库表"子层（从实体自动派生）
        const tablesSubLayer: TreeNode = {
          key: 'infrastructure-tables',
          title: '数据库表',
          icon: '📋',
          type: 'subLayer',
          children: [],
          count: 0,
          badge: '派生',  // 从实体定义自动生成
        };
        
        // 添加每个表作为子节点
        for (const entity of tablesWithName) {
          tablesSubLayer.children!.push({
            key: `infrastructure-tables-${entity.table}`,
            title: entity.table!,
            icon: '📊',
            type: 'item',
            metadata: {
              ...entity,
              __type: 'databaseTable',
              tableName: entity.table,
              entityName: entity.name,
            } as AnyMetadata,
          });
        }
        tablesSubLayer.count = tablesWithName.length;
        layerNode.children!.push(tablesSubLayer);
        layerNode.count! += tablesWithName.length;
        
        // 添加表关系图（如果有关系）
        if (entityRelations && entityRelations.length > 0) {
          const tableERNode: TreeNode = {
            key: 'infrastructure-tableERDiagram',
            title: '表关系图',
            icon: '🔗',
            type: 'item',
            metadata: {
              __type: 'tableERDiagram',
              name: '表关系图',
              relationCount: entityRelations.length,
              entityCount: new Set(entityRelations.flatMap(r => [r.source, r.target])).size,
              tableCount: tablesWithName.length,
            } as ERDiagramMetadata,
          };
          // 插入到"数据库表"子层的第一个位置
          tablesSubLayer.children!.unshift(tableERNode);
          tablesSubLayer.count! += 1;
          layerNode.count! += 1;
        }
      }
    }
    
    if (layerNode.count! > 0) {
      tree.push(layerNode);
    }
  });
  
  return tree;
}

function filterTree(nodes: TreeNode[], search: string): TreeNode[] {
  if (!search) return nodes;
  
  return nodes.map(node => {
    if (node.type === 'item') {
      const match = node.title.toLowerCase().includes(search);
      return match ? node : null;
    }
    
    const filteredChildren = node.children ? filterTree(node.children, search).filter(Boolean) as TreeNode[] : [];
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren, count: filteredChildren.length };
    }
    return null;
  }).filter(Boolean) as TreeNode[];
}

// ==================== 子组件 ====================

/** 资源树节点 */
function TreeNodeItem({ 
  node, 
  level, 
  expanded, 
  selected,
  onToggle, 
  onSelect,
}: { 
  node: TreeNode; 
  level: number;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 16;
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px',
        paddingLeft: indent + 8,
        cursor: 'pointer',
        background: selected ? colors.bgSelected : 'transparent',
        color: colors.text,
        fontSize: 13,
        borderLeft: selected ? `3px solid ${colors.primary}` : '3px solid transparent',
      }}
      onClick={() => {
        if (hasChildren) onToggle();
        onSelect();
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = colors.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {hasChildren ? (
        <span style={{ width: 16, fontSize: 10, color: colors.textMuted }}>
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
      ) : (
        <span style={{ width: 16 }} />
      )}
      
      <span style={{ marginRight: 6, fontSize: 14 }}>{node.icon}</span>
      
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {node.title}
      </span>
      
      {node.badge && (
        <span style={{ 
          fontSize: 10, 
          color: '#fff',
          background: node.badge === '派生' ? '#722ed1' : '#eb2f96',  // 派生=紫色，自定义=粉色
          padding: '1px 6px',
          borderRadius: 4,
          marginRight: 4,
        }}>
          {node.badge}
        </span>
      )}
      
      {node.count !== undefined && node.count > 0 && (
        <span style={{ 
          fontSize: 11, 
          color: colors.textMuted,
          background: colors.bg,
          padding: '2px 8px',
          borderRadius: 10,
        }}>
          {node.count}
        </span>
      )}
    </div>
  );
}

/** 实体预览 */
function EntityPreview({ entity }: { entity: EntityMetadata }) {
  const columns = [
    { title: '字段名', dataIndex: 'name', key: 'name', render: (t: string) => <code style={{ color: colors.primary }}>{t}</code> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '标签', dataIndex: 'label', key: 'label' },
    { title: '必填', dataIndex: 'required', key: 'required', render: (v: boolean) => v ? '✓' : '-', align: 'center' as const },
    { title: '主键', dataIndex: 'primaryKey', key: 'primaryKey', render: (v: boolean) => v ? '🔑' : '-', align: 'center' as const },
  ];
  
  const dataSource = Object.values(entity.fields || {});
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DatabaseOutlined style={{ color: typeColors.entity }} />
          {entity.name}
        </h2>
        {entity.comment && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>{entity.comment}</p>}
        {entity.table && <p style={{ color: colors.textSecondary, margin: '4px 0 0', fontSize: 12 }}>表名: {entity.table}</p>}
      </div>
      
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="name"
        pagination={false}
        size="small"
        style={{ background: colors.bg }}
      />
      
      {entity.extensions && entity.extensions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>🔗 扩展</h4>
          {entity.extensions.map((ext, i) => (
            <div key={i} style={{ background: colors.bg, padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>{ext.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ext.methods.map((m, j) => (
                  <Tag key={j} color="purple">{m}()</Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** DTO 预览 */
function DTOPreview({ dto }: { dto: DTOMetadata }) {
  const columns = [
    { title: '字段名', dataIndex: 'name', key: 'name', render: (t: string) => <code style={{ color: '#0078d4' }}>{t}</code> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '标签', dataIndex: 'label', key: 'label' },
    { title: '必填', dataIndex: 'required', key: 'required', render: (v: boolean) => v ? '✓' : '-', align: 'center' as const },
  ];
  
  const dataSource = Object.values(dto.fields || {});
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileTextOutlined style={{ color: typeColors.dto }} />
          {dto.name}
        </h2>
        {dto.comment && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>{dto.comment}</p>}
      </div>
      
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="name"
        pagination={false}
        size="small"
        style={{ background: colors.bg }}
      />
    </div>
  );
}

/** 枚举预览 */
function EnumPreview({ enumMeta }: { enumMeta: EnumMetadata }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppstoreOutlined style={{ color: typeColors.enum }} />
          {enumMeta.name}
        </h2>
        {enumMeta.comment && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>{enumMeta.comment}</p>}
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {enumMeta.values.map((v, i) => (
          <div key={i} style={{ 
            background: v.color || colors.border, 
            padding: '8px 16px', 
            borderRadius: 6,
            minWidth: 100,
          }}>
            <div style={{ fontWeight: 500, color: colors.text }}>{v.label || v.key}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{v.key} = {v.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 页面结构树 */
function StructureTree({ node, depth = 0 }: { node: ComponentNode; depth?: number }) {
  const indent = depth * 20;
  
  return (
    <div>
      <div style={{ 
        padding: '4px 8px',
        paddingLeft: indent + 8,
        color: '#0078d4',
        fontSize: 13,
      }}>
        {'<'}{node.component}
        {node.props && Object.keys(node.props).length > 0 && (
          <span style={{ color: '#0078d4' }}>
            {Object.entries(node.props).slice(0, 3).map(([k, v]) => (
              <span key={k}> {k}={typeof v === 'string' ? `"${v}"` : '{...}'}</span>
            ))}
          </span>
        )}
        {(!node.children || node.children.length === 0) && ' /'}
        {'>'}
      </div>
      
      {node.children && node.children.map((child, i) => (
        <StructureTree key={i} node={child} depth={depth + 1} />
      ))}
      
      {node.children && node.children.length > 0 && (
        <div style={{ paddingLeft: indent + 8, color: '#0078d4', fontSize: 13 }}>
          {'</'}{node.component}{'>'}
        </div>
      )}
    </div>
  );
}

/** 页面预览 */
function PagePreview({ page }: { page: PageMetadata }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileTextOutlined style={{ color: typeColors.page }} />
          {page.name}
        </h2>
        {page.route && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>路由: {page.route}</p>}
        {page.permission && <p style={{ color: colors.textSecondary, margin: '4px 0 0', fontSize: 12 }}>权限: {page.permission}</p>}
      </div>
      
      {/* 依赖 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {page.components && page.components.length > 0 && (
          <div>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>使用的组件</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {page.components.map((c, i) => <Tag key={i} color="blue">{c}</Tag>)}
            </div>
          </div>
        )}
        
        {page.hooks && page.hooks.length > 0 && (
          <div>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>使用的 Hooks</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {page.hooks.map((h, i) => <Tag key={i} color="green">{h}</Tag>)}
            </div>
          </div>
        )}
        
        {page.services && page.services.length > 0 && (
          <div>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>调用的服务</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {page.services.map((s, i) => <Tag key={i} color="orange">{s}</Tag>)}
            </div>
          </div>
        )}
      </div>
      
      {/* 页面结构 */}
      {page.structure && (
        <div style={{ background: colors.bgWhite, padding: 16, borderRadius: 6, fontFamily: 'Consolas, Monaco, monospace' }}>
          <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>📐 页面结构</div>
          <StructureTree node={page.structure} />
        </div>
      )}
    </div>
  );
}

/** 组件预览 */
function ComponentPreview({ component }: { component: ComponentMetadata }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppstoreOutlined style={{ color: typeColors.component }} />
          {component.name}
        </h2>
        {component.description && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>{component.description}</p>}
        {component.category && <Tag style={{ marginTop: 8 }}>{component.category}</Tag>}
      </div>
      
      {component.props && component.props.length > 0 && (
        <div>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>Props</h4>
          <Table
            columns={[
              { title: '属性', dataIndex: 'name', key: 'name', render: (t: string) => <code style={{ color: '#0078d4' }}>{t}</code> },
              { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
              { title: '必填', dataIndex: 'required', key: 'required', render: (v: boolean) => v ? '✓' : '-', align: 'center' as const },
              { title: '描述', dataIndex: 'description', key: 'description' },
            ]}
            dataSource={component.props}
            rowKey="name"
            pagination={false}
            size="small"
          />
        </div>
      )}
      
      {component.usedComponents && component.usedComponents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>使用的子组件</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {component.usedComponents.map((c, i) => <Tag key={i} color="cyan">{c}</Tag>)}
          </div>
        </div>
      )}
    </div>
  );
}

/** 服务预览 */
function ServicePreview({ service }: { service: ServiceMetadata }) {
  const isAppService = service.__type === 'appService';
  const serviceColor = isAppService ? typeColors.appService : typeColors.service;
  const serviceLabel = isAppService ? '应用服务' : '业务服务';
  
  // 格式化参数显示
  const formatParams = (method: any) => {
    // 优先使用 parameters（带类型信息）
    if (method.parameters && method.parameters.length > 0) {
      return method.parameters.map((p: any) => `${p.name}: ${p.type}`).join(', ');
    }
    // 兼容旧格式 params
    if (method.params && method.params.length > 0) {
      return method.params.join(', ');
    }
    return '';
  };
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ApiOutlined style={{ color: serviceColor }} />
          {service.name}
        </h2>
        <Tag color={serviceColor} style={{ marginTop: 8 }}>{serviceLabel}</Tag>
        {(service.comment || service.description) && (
          <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>
            {service.comment || service.description}
          </p>
        )}
      </div>
      
      {service.methods && service.methods.length > 0 && (
        <div>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>方法 ({service.methods.length})</h4>
          {service.methods.map((m, i) => (
            <div key={i} style={{ 
              background: colors.bg, 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 8,
            }}>
              {/* 方法头部：描述 + 类型标签 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {m.description && (
                  <span style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>
                    {m.description}
                  </span>
                )}
                {/* Query/Command 标签 */}
                {(m as any).isQuery && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Query</Tag>
                )}
                {(m as any).isCommand && (
                  <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Command</Tag>
                )}
              </div>
              
              {/* 方法签名 */}
              <div style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: 13 }}>
                <span style={{ color: '#b35900', fontWeight: 500 }}>{m.name}</span>
                <span style={{ color: '#333333' }}>(</span>
                <span style={{ color: '#0078d4' }}>{formatParams(m)}</span>
                <span style={{ color: '#333333' }}>)</span>
                {m.returnType && (
                  <>
                    <span style={{ color: '#333333' }}>: </span>
                    <span style={{ color: '#008000' }}>{m.returnType}</span>
                  </>
                )}
              </div>
              
              {/* 参数详情（如果有多个参数） */}
              {m.parameters && m.parameters.length > 1 && (
                <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: `2px solid ${colors.border}` }}>
                  {m.parameters.map((p: any, pi: number) => (
                    <div key={pi} style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
                      <span style={{ color: '#0078d4' }}>{p.name}</span>
                      <span style={{ color: colors.textMuted }}> : {p.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 通用预览（自定义类型和派生类型） */
function GenericPreview({ metadata }: { metadata: AnyMetadata }) {
  const typeColor = typeColors[metadata.__type] || '#999';
  const typeLabel = typeLabels[metadata.__type] || metadata.__type;
  const typeIcon = typeIcons[metadata.__type] || '📦';
  
  // 分类属性
  const systemKeys = ['__type', 'name', 'sourceFile'];
  const entries = Object.entries(metadata).filter(([k]) => !systemKeys.includes(k));
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{typeIcon}</span>
          {metadata.name}
        </h2>
        <Tag color={typeColor} style={{ marginTop: 8 }}>{typeLabel}</Tag>
      </div>
      
      {/* 属性列表 */}
      <div style={{ display: 'grid', gap: 16 }}>
        {entries.map(([key, value]) => (
          <div key={key} style={{ background: colors.bg, padding: 12, borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>{key}</div>
            <div style={{ fontSize: 13 }}>
              {typeof value === 'object' ? (
                <pre style={{ 
                  margin: 0, 
                  fontSize: 12, 
                  background: colors.bgWhite, 
                  padding: 8, 
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : typeof value === 'boolean' ? (
                <Tag color={value ? 'green' : 'red'}>{value ? '是' : '否'}</Tag>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 扩展预览 */
function ExtensionPreview({ extension }: { extension: ExtensionMetadata }) {
  // 支持 members 或 methods 字段
  const members = (extension as any).members || extension.methods || [];
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SettingOutlined style={{ color: typeColors.extension }} />
          {extension.name}
        </h2>
        {extension.description && <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>{extension.description}</p>}
        {extension.target && (
          <p style={{ color: colors.textSecondary, margin: '4px 0 0', fontSize: 12 }}>
            🎯 扩展目标: <code style={{ color: '#0078d4' }}>{extension.target}</code>
          </p>
        )}
      </div>
      
      {members.length > 0 && (
        <div>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>🔧 扩展方法 ({members.length})</h4>
          {members.map((m: any, i: number) => (
            <div key={i} style={{ 
              background: colors.bg, 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 8,
            }}>
              <div style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
                <span style={{ color: '#b35900' }}>{m.name}</span>
                <span style={{ color: '#333333' }}>()</span>
                {m.returnType && (
                  <>
                    <span style={{ color: '#333333' }}>: </span>
                    <span style={{ color: '#008000' }}>{m.returnType}</span>
                  </>
                )}
              </div>
              {m.description && <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{m.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 数据库表结构预览 */
function TablePreview({ metadata, entityRelations, entities }: { 
  metadata: AnyMetadata; 
  entityRelations?: EntityRelation[];
  entities?: EntityMetadata[];
}) {
  const tableName = (metadata as any).tableName || (metadata as any).table || metadata.name;
  const entityName = (metadata as any).entityName || metadata.name;
  const fields = (metadata as any).fields || {};
  const comment = (metadata as any).comment || '';
  
  // 找出该表相关的关系
  const outgoingRelations = (entityRelations || []).filter(r => r.source === entityName);
  const incomingRelations = (entityRelations || []).filter(r => r.target === entityName);
  
  // 从字段定义中直接识别嵌入字段和关系字段
  const embeddedFieldNames: string[] = [];
  const oneToManyFieldNames: string[] = [];
  const embeddedFieldInfos: { fieldName: string; targetName: string }[] = [];
  
  for (const [fieldName, field] of Object.entries(fields) as [string, any][]) {
    // 检查字段是否是嵌入类型
    if (field.embedded === true || field.type === 'embedded' || field.relation === 'embedded') {
      embeddedFieldNames.push(fieldName);
      // 获取目标类型名称
      let targetName = '';
      if (field.target) {
        if (typeof field.target === 'function') {
          try { targetName = field.target()?.name || ''; } catch { }
        } else if (typeof field.target === 'object' && field.target.name) {
          targetName = field.target.name;
        } else if (typeof field.target === 'string') {
          targetName = field.target;
        }
      }
      if (targetName) {
        embeddedFieldInfos.push({ fieldName, targetName });
      }
    }
    // 检查字段是否是 OneToMany 关系
    if (field.relation === 'OneToMany' || field.type === 'relation') {
      oneToManyFieldNames.push(fieldName);
    }
  }
  
  // 也从 entityRelations 中补充
  for (const rel of outgoingRelations) {
    if (rel.relationType === 'Embedded' || rel.embedded) {
      if (!embeddedFieldNames.includes(rel.fieldName)) {
        embeddedFieldNames.push(rel.fieldName);
      }
      if (!embeddedFieldInfos.some(e => e.fieldName === rel.fieldName)) {
        embeddedFieldInfos.push({ fieldName: rel.fieldName, targetName: rel.target });
      }
    }
    if (rel.relationType === 'OneToMany') {
      if (!oneToManyFieldNames.includes(rel.fieldName)) {
        oneToManyFieldNames.push(rel.fieldName);
      }
    }
  }
  
  // 真正的外键关系（非嵌入，非 OneToMany）
  const fkRelations = outgoingRelations.filter(r => 
    r.relationType !== 'Embedded' && 
    r.relationType !== 'OneToMany' && 
    !r.embedded
  );
  const oneToManyRelations = outgoingRelations.filter(r => r.relationType === 'OneToMany');
  
  // 查找嵌入对象的字段定义
  const getEmbeddedFields = (targetName: string): Record<string, any> => {
    if (!entities) return {};
    // 尝试多种匹配方式
    const targetEntity = entities.find(e => 
      e.name === targetName || 
      e.name.toLowerCase() === targetName.toLowerCase()
    );
    return targetEntity?.fields || {};
  };
  
  // 驼峰转下划线（camelCase -> snake_case）
  const toSnakeCase = (str: string): string => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  };
  
  // 转换字段类型为数据库类型
  const getDbType = (type: string): string => {
    const t = (type || 'string').toLowerCase();
    if (t === 'string') return 'VARCHAR(255)';
    if (t === 'number') return 'DECIMAL(18,2)';
    if (t === 'boolean') return 'BOOLEAN';
    if (t === 'datetime' || t === 'date') return 'TIMESTAMP';
    return t.toUpperCase();
  };
  
  // 构建表列数据
  interface ColumnData {
    name: string;
    dbType: string;
    constraints: string[];
    label: string;
    source?: string;  // 标记来源（如嵌入对象名称）
  }
  
  const dataSource: ColumnData[] = [];
  
  // 处理普通字段
  for (const [name, field] of Object.entries(fields) as [string, any][]) {
    // 跳过嵌入字段和 OneToMany 字段（它们不是直接的数据库列）
    const isEmbedded = embeddedFieldNames.includes(name);
    const isOneToMany = oneToManyFieldNames.includes(name);
    
    if (isEmbedded || isOneToMany) continue;
    
    dataSource.push({
      name: toSnakeCase(name),  // 转换为下划线格式
      dbType: getDbType(field.type),
      constraints: [
        field.primaryKey && 'PK',
        field.required && 'NOT NULL',
      ].filter(Boolean) as string[],
      label: field.label || '',
    });
  }
  
  // 处理嵌入字段 - 平铺展开
  for (const info of embeddedFieldInfos) {
    const embeddedFields = getEmbeddedFields(info.targetName);
    if (Object.keys(embeddedFields).length > 0) {
      for (const [subName, subField] of Object.entries(embeddedFields) as [string, any][]) {
        dataSource.push({
          name: `${toSnakeCase(info.fieldName)}_${toSnakeCase(subName)}`,  // 转换为下划线格式
          dbType: getDbType(subField.type),
          constraints: subField.required ? ['NOT NULL'] : [],
          label: subField.label || '',
          source: `嵌入自 ${info.targetName}`,
        });
      }
    } else {
      // 如果找不到嵌入对象的字段定义，显示占位信息
      dataSource.push({
        name: `${toSnakeCase(info.fieldName)}_*`,
        dbType: 'JSON',
        constraints: [],
        label: `嵌入对象 ${info.targetName}`,
        source: `嵌入自 ${info.targetName}`,
      });
    }
  }
  
  // 处理 ManyToOne / OneToOne 外键
  for (const rel of fkRelations) {
    dataSource.push({
      name: `${toSnakeCase(rel.fieldName)}_id`,  // 外键列名（下划线格式）
      dbType: 'BIGINT',
      constraints: ['FK'],
      label: `外键 → ${rel.target}`,
      source: `FK → ${rel.target}`,
    });
  }
  
  // 如果是被其他表 OneToMany 引用，添加外键列
  for (const rel of incomingRelations.filter(r => r.relationType === 'OneToMany')) {
    const parentTableName = entities?.find(e => e.name === rel.source)?.table || rel.source.toLowerCase();
    dataSource.push({
      name: `${parentTableName}_id`,
      dbType: 'BIGINT',
      constraints: ['FK', 'NOT NULL'],
      label: `外键 ← ${rel.source}`,
      source: `FK ← ${rel.source}`,
    });
  }
  
  const columns = [
    { title: '列名', dataIndex: 'name', key: 'name', render: (t: string) => <code style={{ color: '#0078d4' }}>{t}</code> },
    { title: '数据类型', dataIndex: 'dbType', key: 'dbType', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '约束', dataIndex: 'constraints', key: 'constraints', render: (v: string[]) => v.map((c, i) => <Tag key={i} color={c === 'PK' ? 'red' : c === 'FK' ? 'purple' : c === 'NOT NULL' ? 'orange' : 'default'}>{c}</Tag>) },
    { title: '说明', dataIndex: 'label', key: 'label' },
    { title: '来源', dataIndex: 'source', key: 'source', render: (t: string) => t ? <Tag color="geekblue">{t}</Tag> : null },
  ];
  
  // 生成 DDL
  const generateDDL = () => {
    const lines: string[] = [`CREATE TABLE ${tableName} (`];
    
    dataSource.forEach((col, i) => {
      let constraint = '';
      if (col.constraints.includes('PK')) constraint = ' PRIMARY KEY';
      else if (col.constraints.includes('NOT NULL')) constraint = ' NOT NULL';
      
      const comma = i < dataSource.length - 1 ? ',' : '';
      const comment = col.label ? `  -- ${col.label}` : '';
      lines.push(`  ${col.name} ${col.dbType}${constraint}${comma}${comment}`);
    });
    
    lines.push(');');
    
    // 添加外键约束
    const fkCols = dataSource.filter(c => c.constraints.includes('FK'));
    if (fkCols.length > 0) {
      lines.push('');
      lines.push('-- 外键约束');
      for (const col of fkCols) {
        if (col.source?.startsWith('FK → ')) {
          const target = col.source.replace('FK → ', '');
          const targetTable = entities?.find(e => e.name === target)?.table || target.toLowerCase();
          lines.push(`ALTER TABLE ${tableName} ADD CONSTRAINT fk_${col.name} FOREIGN KEY (${col.name}) REFERENCES ${targetTable}(id);`);
        } else if (col.source?.startsWith('FK ← ')) {
          const source = col.source.replace('FK ← ', '');
          const sourceTable = entities?.find(e => e.name === source)?.table || source.toLowerCase();
          lines.push(`ALTER TABLE ${tableName} ADD CONSTRAINT fk_${col.name} FOREIGN KEY (${col.name}) REFERENCES ${sourceTable}(id);`);
        }
      }
    }
    
    return lines.join('\n');
  };
  
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          {tableName}
        </h2>
        <p style={{ color: colors.textSecondary, margin: '8px 0 0' }}>
          对应实体: <code style={{ color: colors.primary }}>{entityName}</code>
        </p>
        {comment && <p style={{ color: colors.textSecondary, margin: '4px 0 0', fontSize: 12 }}>{comment}</p>}
      </div>
      
      {/* 表结构 */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: colors.text, marginBottom: 12 }}>📋 表结构 ({dataSource.length} 列)</h4>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="name"
          pagination={false}
          size="small"
          style={{ background: colors.bg }}
        />
      </div>
      
      {/* 子表关系 (OneToMany) */}
      {oneToManyRelations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>📦 子表 (1:N)</h4>
          {oneToManyRelations.map((rel, i) => {
            const childTable = entities?.find(e => e.name === rel.target)?.table || rel.target.toLowerCase();
            return (
              <div key={i} style={{ 
                background: colors.bg, 
                padding: 12, 
                borderRadius: 6, 
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <code style={{ color: '#0078d4' }}>{rel.fieldName}</code>
                <span>→</span>
                <Tag color="green">{childTable}</Tag>
                <span style={{ color: colors.textSecondary, fontSize: 12 }}>
                  (子表 {childTable} 包含外键 {tableName}_id)
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 嵌入对象说明 */}
      {embeddedFieldInfos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: colors.text, marginBottom: 12 }}>📎 嵌入对象</h4>
          {embeddedFieldInfos.map((info, i) => (
            <div key={i} style={{ 
              background: colors.bg, 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ color: '#0078d4' }}>{info.fieldName}</code>
                <span>←</span>
                <Tag color="cyan">{info.targetName}</Tag>
              </div>
              <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                嵌入对象的字段会以 <code>{info.fieldName}_*</code> 前缀平铺到表中
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* DDL 预览 */}
      <div>
        <h4 style={{ color: colors.text, marginBottom: 12 }}>📝 DDL 语句</h4>
        <pre style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, monospace",
          overflow: 'auto',
        }}>
          {generateDDL()}
        </pre>
      </div>
    </div>
  );
}

/** 预览区域 Props */
interface PreviewAreaProps {
  metadata: AnyMetadata | null;
  entityRelations?: EntityRelation[];
  entities?: EntityMetadata[];
  onEntityClick?: (entityName: string) => void;
}

/** 预览区域 */
function PreviewArea({ metadata, entityRelations, entities, onEntityClick }: PreviewAreaProps) {
  if (!metadata) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: colors.textSecondary,
      }}>
        <CodeOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 14 }}>选择一个元数据对象</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>在左侧资源目录中点击查看详情</div>
      </div>
    );
  }
  
  switch (metadata.__type) {
    case 'entity':
      return <EntityPreview entity={metadata as EntityMetadata} />;
    case 'dto':
      return <DTOPreview dto={metadata as DTOMetadata} />;
    case 'enum':
      return <EnumPreview enumMeta={metadata as EnumMetadata} />;
    case 'page':
      return <PagePreview page={metadata as PageMetadata} />;
    case 'component':
      return <ComponentPreview component={metadata as ComponentMetadata} />;
    case 'appService':
    case 'service':
      return <ServicePreview service={metadata as ServiceMetadata} />;
    case 'extension':
      return <ExtensionPreview extension={metadata as ExtensionMetadata} />;
    case 'erDiagram':
      // 🎯 实体关系图谱
      return (
        <ERDiagram 
          relations={entityRelations || []} 
          entities={entities}
          onEntityClick={onEntityClick}
          mode="entity"
        />
      );
    case 'tableERDiagram':
      // 🎯 数据库表关系图谱
      return (
        <ERDiagram 
          relations={entityRelations || []} 
          entities={entities}
          onEntityClick={onEntityClick}
          mode="table"
        />
      );
    case 'databaseTable':
      // 🎯 数据库表结构预览
      return <TablePreview metadata={metadata} entityRelations={entityRelations} entities={entities} />;
    default:
      // 自定义类型和派生类型使用通用 JSON 预览
      return <GenericPreview metadata={metadata} />;
  }
}

/** 属性面板 */
interface PropertyPanelProps {
  metadata: AnyMetadata | null;
  entityRelations?: EntityRelation[];
  entities?: EntityMetadata[];
}

function PropertyPanel({ metadata, entityRelations, entities }: PropertyPanelProps) {
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!metadata) {
    return (
      <div style={{ padding: 20, color: colors.textSecondary, textAlign: 'center' }}>
        <div style={{ marginTop: 40 }}>暂无选中项</div>
      </div>
    );
  }
  
  // 驼峰转下划线
  const toSnakeCase = (str: string): string => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  };
  
  // 转换为数据库类型
  const getDbType = (type: string): string => {
    const t = (type || 'string').toLowerCase();
    if (t === 'string') return 'VARCHAR(255)';
    if (t === 'number') return 'DECIMAL(18,2)';
    if (t === 'boolean') return 'BOOLEAN';
    if (t === 'datetime' || t === 'date') return 'TIMESTAMP';
    return t.toUpperCase();
  };
  
  // 如果是实体关系图谱，显示完整的关系数据
  let jsonData: unknown = metadata;
  if (metadata.__type === 'erDiagram' && entityRelations) {
    // 收集涉及的实体
    const involvedEntities = new Set(entityRelations.flatMap(r => [r.source, r.target]));
    
    jsonData = {
      __type: 'erDiagram',
      name: metadata.name,
      summary: {
        relationCount: entityRelations.length,
        entityCount: involvedEntities.size,
      },
      relations: entityRelations.map(r => ({
        source: r.source,
        target: r.target,
        fieldName: r.fieldName,
        relationType: r.relationType,
      })),
      entities: entities?.filter(e => involvedEntities.has(e.name)).map(e => {
        const entityRelationFields = entityRelations
          .filter(r => r.source === e.name)
          .map(r => r.fieldName);
        
        const relevantFields = Object.entries(e.fields || {}).filter(([name, f]) => 
          f.primaryKey || entityRelationFields.includes(name)
        );
        
        return {
          name: e.name,
          table: e.table,
          fields: relevantFields.map(([name, f]) => ({
            name,
            type: f.type,
            label: f.label,
            primaryKey: f.primaryKey || undefined,
            isRelation: entityRelationFields.includes(name) || undefined,
          })),
        };
      }),
    };
  }
  
  // 如果是表关系图谱，显示完整的数据库表结构
  if (metadata.__type === 'tableERDiagram' && entities) {
    const tablesWithName = entities.filter(e => e.table);
    
    // 构建关系映射
    const relationMap = new Map<string, { outgoing: EntityRelation[]; incoming: EntityRelation[] }>();
    for (const e of tablesWithName) {
      relationMap.set(e.name, { outgoing: [], incoming: [] });
    }
    for (const r of (entityRelations || [])) {
      if (relationMap.has(r.source)) {
        relationMap.get(r.source)!.outgoing.push(r);
      }
      if (relationMap.has(r.target)) {
        relationMap.get(r.target)!.incoming.push(r);
      }
    }
    
    // 查找嵌入对象的字段定义
    const getEmbeddedFields = (targetName: string): Record<string, any> => {
      const targetEntity = entities.find(te => 
        te.name === targetName || te.name.toLowerCase() === targetName.toLowerCase()
      );
      return targetEntity?.fields || {};
    };
    
    jsonData = {
      __type: 'tableERDiagram',
      name: metadata.name,
      summary: {
        tableCount: tablesWithName.length,
        relationCount: (entityRelations || []).filter(r => r.relationType !== 'Embedded').length,
      },
      tables: tablesWithName.map(e => {
        const rels = relationMap.get(e.name) || { outgoing: [], incoming: [] };
        
        // 从字段属性直接检测嵌入和关系
        const embeddedFieldInfos: { fieldName: string; targetName: string }[] = [];
        const oneToManyFieldNames: string[] = [];
        
        for (const [fieldName, field] of Object.entries(e.fields || {})) {
          // 检查嵌入类型
          if (field.embedded === true || field.type === 'embedded' || field.relation === 'embedded') {
            let targetName = '';
            if (field.target) {
              if (typeof field.target === 'function') {
                try { targetName = field.target()?.name || ''; } catch {}
              } else if (typeof field.target === 'object' && field.target.name) {
                targetName = field.target.name;
              } else if (typeof field.target === 'string') {
                targetName = field.target;
              }
            }
            if (targetName) {
              embeddedFieldInfos.push({ fieldName, targetName });
            }
          }
          // 检查 OneToMany
          if (field.relation === 'OneToMany' || field.type === 'relation') {
            oneToManyFieldNames.push(fieldName);
          }
        }
        
        // 也从 entityRelations 补充
        for (const rel of rels.outgoing) {
          if (rel.relationType === 'Embedded') {
            if (!embeddedFieldInfos.some(e => e.fieldName === rel.fieldName)) {
              embeddedFieldInfos.push({ fieldName: rel.fieldName, targetName: rel.target });
            }
          }
          if (rel.relationType === 'OneToMany') {
            if (!oneToManyFieldNames.includes(rel.fieldName)) {
              oneToManyFieldNames.push(rel.fieldName);
            }
          }
        }
        
        const embeddedFieldNames = embeddedFieldInfos.map(i => i.fieldName);
        
        // 构建列信息
        const columns: any[] = [];
        
        // 普通字段
        for (const [fieldName, field] of Object.entries(e.fields || {})) {
          const isEmbedded = embeddedFieldNames.includes(fieldName);
          const isOneToMany = oneToManyFieldNames.includes(fieldName);
          
          if (isEmbedded || isOneToMany) continue;
          
          columns.push({
            column: toSnakeCase(fieldName),
            type: getDbType(field.type),
            constraints: [
              field.primaryKey && 'PK',
              field.required && 'NOT NULL',
            ].filter(Boolean),
            label: field.label,
          });
        }
        
        // 嵌入字段（平铺）
        for (const info of embeddedFieldInfos) {
          const embeddedFields = getEmbeddedFields(info.targetName);
          for (const [subName, subField] of Object.entries(embeddedFields) as [string, any][]) {
            columns.push({
              column: `${toSnakeCase(info.fieldName)}_${toSnakeCase(subName)}`,
              type: getDbType(subField.type),
              constraints: subField.required ? ['NOT NULL'] : [],
              label: subField.label,
              source: `嵌入自 ${info.targetName}`,
            });
          }
        }
        
        // 外键列
        for (const rel of rels.outgoing.filter(r => r.relationType === 'ManyToOne' || r.relationType === 'OneToOne')) {
          columns.push({
            column: `${toSnakeCase(rel.fieldName)}_id`,
            type: 'BIGINT',
            constraints: ['FK'],
            references: rel.target,
          });
        }
        
        // 被引用的外键
        for (const rel of rels.incoming.filter(r => r.relationType === 'OneToMany')) {
          const parentTable = entities.find(pe => pe.name === rel.source)?.table || toSnakeCase(rel.source);
          columns.push({
            column: `${parentTable}_id`,
            type: 'BIGINT',
            constraints: ['FK', 'NOT NULL'],
            references: rel.source,
          });
        }
        
        return {
          table: e.table,
          entity: e.name,
          comment: e.comment,
          columns,
          relations: {
            outgoing: rels.outgoing.filter(r => r.relationType !== 'Embedded').map(r => ({
              field: r.fieldName,
              target: r.target,
              type: r.relationType,
            })),
            incoming: rels.incoming.map(r => ({
              from: r.source,
              field: r.fieldName,
              type: r.relationType,
            })),
          },
        };
      }),
    };
  }
  
  // 如果是单个数据库表，显示转换后的表结构
  if (metadata.__type === 'databaseTable') {
    const entityName = (metadata as any).entityName || metadata.name;
    const tableName = (metadata as any).tableName || (metadata as any).table || toSnakeCase(metadata.name);
    const fields = (metadata as any).fields || {};
    
    // 找出该实体的关系
    const outgoingRels = (entityRelations || []).filter(r => r.source === entityName);
    const incomingRels = (entityRelations || []).filter(r => r.target === entityName);
    
    // 从字段属性检测嵌入和关系
    const embeddedFieldInfos: { fieldName: string; targetName: string }[] = [];
    const oneToManyFieldNames: string[] = [];
    
    for (const [fieldName, field] of Object.entries(fields) as [string, any][]) {
      if (field.embedded === true || field.type === 'EMBEDDED' || field.type === 'embedded') {
        const targetName = field.target || '';
        if (targetName) {
          embeddedFieldInfos.push({ fieldName, targetName });
        }
      }
      if (field.relation === 'OneToMany' || field.type === 'RELATION') {
        oneToManyFieldNames.push(fieldName);
      }
    }
    
    // 也从 entityRelations 补充
    for (const rel of outgoingRels) {
      if (rel.relationType === 'Embedded') {
        if (!embeddedFieldInfos.some(e => e.fieldName === rel.fieldName)) {
          embeddedFieldInfos.push({ fieldName: rel.fieldName, targetName: rel.target });
        }
      }
      if (rel.relationType === 'OneToMany') {
        if (!oneToManyFieldNames.includes(rel.fieldName)) {
          oneToManyFieldNames.push(rel.fieldName);
        }
      }
    }
    
    const embeddedFieldNames = embeddedFieldInfos.map(i => i.fieldName);
    
    // 查找嵌入对象的字段定义
    const getEmbeddedFieldsForTable = (targetName: string): Record<string, any> => {
      if (!entities) return {};
      const targetEntity = entities.find(te => 
        te.name === targetName || te.name.toLowerCase() === targetName.toLowerCase()
      );
      return targetEntity?.fields || {};
    };
    
    // 构建列信息
    const columns: any[] = [];
    
    // 普通字段
    for (const [fieldName, field] of Object.entries(fields) as [string, any][]) {
      if (embeddedFieldNames.includes(fieldName) || oneToManyFieldNames.includes(fieldName)) continue;
      
      columns.push({
        column: toSnakeCase(fieldName),
        type: getDbType(field.type),
        constraints: [
          field.primaryKey && 'PK',
          field.required && 'NOT NULL',
        ].filter(Boolean),
        label: field.label,
      });
    }
    
    // 嵌入字段（平铺）
    for (const info of embeddedFieldInfos) {
      const embeddedFields = getEmbeddedFieldsForTable(info.targetName);
      for (const [subName, subField] of Object.entries(embeddedFields) as [string, any][]) {
        columns.push({
          column: `${toSnakeCase(info.fieldName)}_${toSnakeCase(subName)}`,
          type: getDbType(subField.type),
          constraints: subField.required ? ['NOT NULL'] : [],
          label: subField.label,
          source: `嵌入自 ${info.targetName}`,
        });
      }
    }
    
    // 外键列
    for (const rel of outgoingRels.filter(r => r.relationType === 'ManyToOne' || r.relationType === 'OneToOne')) {
      columns.push({
        column: `${toSnakeCase(rel.fieldName)}_id`,
        type: 'BIGINT',
        constraints: ['FK'],
        references: rel.target,
      });
    }
    
    // 被引用的外键
    for (const rel of incomingRels.filter(r => r.relationType === 'OneToMany')) {
      const parentTable = entities?.find(pe => pe.name === rel.source)?.table || toSnakeCase(rel.source);
      columns.push({
        column: `${parentTable}_id`,
        type: 'BIGINT',
        constraints: ['FK', 'NOT NULL'],
        references: rel.source,
      });
    }
    
    jsonData = {
      table: tableName,
      entity: entityName,
      comment: (metadata as any).comment,
      columns,
      childTables: oneToManyFieldNames.map(fn => {
        const rel = outgoingRels.find(r => r.fieldName === fn);
        return {
          field: fn,
          target: rel?.target,
          foreignKey: `${tableName}_id`,
        };
      }),
      embeddedObjects: embeddedFieldInfos.map(info => ({
        field: info.fieldName,
        source: info.targetName,
        prefix: `${toSnakeCase(info.fieldName)}_`,
      })),
    };
  }
  
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 基本信息 */}
      <div style={{ padding: 16, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag color={typeColors[metadata.__type as keyof typeof typeColors]}>
            {typeLabels[metadata.__type as keyof typeof typeLabels]}
          </Tag>
        </div>
        
        <div style={{ fontSize: 16, fontWeight: 500, color: colors.text, marginBottom: 8 }}>
          {metadata.name}
        </div>
        
        {'comment' in metadata && metadata.comment && (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>{metadata.comment}</div>
        )}
      </div>
      
      {/* 属性列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>属性</div>
          
          <div style={{ fontSize: 13 }}>
            {'sourceFile' in metadata && metadata.sourceFile && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: colors.textSecondary, fontSize: 11 }}>源文件</div>
                <div style={{ color: '#0078d4', fontSize: 12, wordBreak: 'break-all' }}>
                  {metadata.sourceFile.split('/').slice(-3).join('/')}
                </div>
              </div>
            )}
            
            {'route' in metadata && metadata.route && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: colors.textSecondary, fontSize: 11 }}>路由</div>
                <div>{metadata.route}</div>
              </div>
            )}
            
            {'permission' in metadata && metadata.permission && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: colors.textSecondary, fontSize: 11 }}>权限</div>
                <div>{metadata.permission}</div>
              </div>
            )}
            
            {'table' in metadata && metadata.table && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: colors.textSecondary, fontSize: 11 }}>数据表</div>
                <div>{metadata.table}</div>
              </div>
            )}
            
            {'target' in metadata && metadata.target && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: colors.textSecondary, fontSize: 11 }}>目标</div>
                <div>{metadata.target}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* 查看 JSON 按钮 */}
        <div style={{ marginTop: 16 }}>
          <Button
            type="default"
            icon={<FullscreenOutlined />}
            onClick={() => setJsonModalOpen(true)}
            style={{ 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            查看原始 JSON
          </Button>
        </div>
      </div>
      
      {/* JSON 全屏弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CodeOutlined />
            <span>{metadata.name}</span>
            <Tag color={typeColors[metadata.__type as keyof typeof typeColors]} style={{ marginLeft: 8 }}>
              {typeLabels[metadata.__type as keyof typeof typeLabels]}
            </Tag>
          </div>
        }
        open={jsonModalOpen}
        onCancel={() => setJsonModalOpen(false)}
        width="80vw"
        style={{ top: 20 }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: colors.textSecondary, fontSize: 12 }}>
              共 {jsonString.split('\n').length} 行
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyJson}
              >
                {copySuccess ? '已复制！' : '复制 JSON'}
              </Button>
              <Button type="primary" onClick={() => setJsonModalOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        }
      >
        <div style={{
          background: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          overflow: 'auto',
          maxHeight: 'calc(80vh - 150px)',
        }}>
          <pre style={{
            margin: 0,
            padding: 16,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, Consolas, 'Courier New', monospace",
            lineHeight: 1.6,
          }}>
            {syntaxHighlightJson(jsonString)}
          </pre>
        </div>
      </Modal>
    </div>
  );
}

// ==================== 主组件 ====================
export function ModelerApp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<AnyMetadata | null>(null);
  const [searchText, setSearchText] = useState('');
  const [entityRelations, setEntityRelations] = useState<EntityRelation[]>([]);
  const [entities, setEntities] = useState<EntityMetadata[]>([]);
  
  // 加载元数据（包括自定义类型和派生类型）
  const loadMetadata = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行加载：AST 元数据、动态类型配置、扩展元数据
      const [metadataRes, typesRes, extendedRes] = await Promise.all([
        fetch('/__ai-builder/metadata'),
        fetch('/__ai-builder/types').catch(() => null),
        fetch('/__ai-builder/extended').catch(() => null),
      ]);
      
      if (!metadataRes.ok) throw new Error(`HTTP ${metadataRes.status}`);
      
      let result: ASTMetadata = await metadataRes.json();
      
      // 获取动态类型配置并更新 layerConfig
      if (typesRes && typesRes.ok) {
        const types = await typesRes.json();
        console.log('[ModelerApp] 加载动态类型配置:', types.length, '个');
        
        // 动态添加自定义类型到 layerConfig
        types.forEach((typeConfig: any) => {
          const layer = typeConfig.isDerived ? 'derived' : (typeConfig.layer || 'custom');
          
          // 确保层存在
          if (!layerConfig[layer]) {
            layerConfig[layer] = {
              title: layer === 'derived' ? '派生元数据 (Derived)' : '自定义层 (Custom)',
              icon: layer === 'derived' ? '🔮' : '🎯',
              subLayers: {},
            };
          }
          
          // 添加子层（自定义/派生类型添加标识）
          const isDerived = typeConfig.isDerived || typeConfig.defineMethod === 'derived';
          let badge: string | undefined;
          if (isDerived) {
            badge = '派生';  // 从现有元数据自动分析生成
          } else {
            badge = '自定义';  // 用户定义的扩展类型
          }
          
          layerConfig[layer].subLayers[typeConfig.type] = {
            title: typeConfig.label,
            icon: typeConfig.icon,
            dataKey: typeConfig.type,
            badge,
          };
          
          // 添加到 typeColors 和 typeLabels
          if (!typeColors[typeConfig.type]) {
            const colorPool = ['#eb2f96', '#faad14', '#a0d911', '#13c2c2', '#722ed1'];
            typeColors[typeConfig.type] = colorPool[Object.keys(typeColors).length % colorPool.length];
          }
          if (!typeLabels[typeConfig.type]) {
            typeLabels[typeConfig.type] = typeConfig.label;
          }
          if (!typeIcons[typeConfig.type]) {
            typeIcons[typeConfig.type] = typeConfig.icon;
          }
        });
      }
      
      // 合并扩展元数据
      if (extendedRes && extendedRes.ok) {
        const extended = await extendedRes.json();
        console.log('[ModelerApp] 加载扩展元数据:', Object.keys(extended));
        
        // 保存实体关系数据用于关系图谱
        if (extended.entityRelation) {
          setEntityRelations(extended.entityRelation as EntityRelation[]);
        }
        
        result = { ...result, ...extended };
      }
      
      // 保存实体数据用于关系图谱
      if (result.entities) {
        setEntities(result.entities as EntityMetadata[]);
      }
      
      // 🆕 分离服务类型：应用服务 vs 业务服务
      const allServices = (result.services || []) as ServiceMetadata[];
      const appServices = allServices.filter(s => s.__type === 'appService');
      const domainServices = allServices.filter(s => s.__type === 'service');
      
      // 更新 result，使用分离后的服务
      result = {
        ...result,
        services: appServices,  // 应用服务保留在原位置
        domainServices: domainServices,  // 业务服务放到领域层
      };
      
      console.log('[ModelerApp] 服务分离: 应用服务', appServices.length, '个, 业务服务', domainServices.length, '个');
      
      // 获取实体关系（从 extended 或 result 中）
      const relations = (result.entityRelation || []) as EntityRelation[];
      
      console.log('[ModelerApp] 最终数据 keys:', Object.keys(result));
      const tree = buildTreeData(result, relations);
      setTreeData(tree);
      
      // 默认收起所有节点
      setExpandedKeys(new Set());
    } catch (e) {
      setError(`加载失败: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadMetadata();
  }, []);
  
  const filteredTree = filterTree(treeData, searchText.toLowerCase());
  
  // 递归渲染树
  const renderTree = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node.key}>
        <TreeNodeItem
          node={node}
          level={level}
          expanded={expandedKeys.has(node.key)}
          selected={selectedKey === node.key}
          onToggle={() => {
            const newKeys = new Set(expandedKeys);
            if (newKeys.has(node.key)) {
              newKeys.delete(node.key);
            } else {
              newKeys.add(node.key);
            }
            setExpandedKeys(newKeys);
          }}
          onSelect={() => {
            setSelectedKey(node.key);
            setSelectedMetadata(node.metadata || null);
          }}
        />
        {node.children && expandedKeys.has(node.key) && renderTree(node.children, level + 1)}
      </React.Fragment>
    ));
  };
  
  return (
    <div style={styles.container}>
      {/* 左侧：资源目录 */}
      <div style={styles.sider}>
        <div style={styles.header}>
          <span style={{ marginRight: 8 }}>📂</span>
          资源管理器
        </div>
        
        {/* 搜索 */}
        <div style={{ padding: 8, borderBottom: `1px solid ${colors.border}` }}>
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            style={{ background: colors.border, border: 'none', color: '#333333' }}
          />
        </div>
        
        {/* 工具栏 */}
        <div style={{ 
          padding: '4px 8px', 
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 4,
        }}>
          <Tooltip title="全部展开">
            <Button 
              type="text" 
              size="small" 
              icon={<ExpandOutlined />}
              style={{ color: colors.textSecondary }}
              onClick={() => {
                const keys = new Set<string>();
                const addKeys = (nodes: TreeNode[]) => {
                  nodes.forEach(n => {
                    keys.add(n.key);
                    if (n.children) addKeys(n.children);
                  });
                };
                addKeys(treeData);
                setExpandedKeys(keys);
              }}
            />
          </Tooltip>
          <Tooltip title="全部收起">
            <Button 
              type="text" 
              size="small" 
              icon={<CompressOutlined />}
              style={{ color: colors.textSecondary }}
              onClick={() => setExpandedKeys(new Set())}
            />
          </Tooltip>
          <Tooltip title="刷新">
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              style={{ color: colors.textSecondary }}
              loading={loading}
              onClick={loadMetadata}
            />
          </Tooltip>
        </div>
        
        {/* 树 */}
        <div style={styles.content}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : error ? (
            <div style={{ padding: 20, color: '#f14c4c' }}>{error}</div>
          ) : filteredTree.length === 0 ? (
            <div style={{ padding: 20, color: colors.textSecondary, textAlign: 'center' }}>
              {searchText ? '无匹配结果' : '暂无数据'}
            </div>
          ) : (
            renderTree(filteredTree)
          )}
        </div>
      </div>
      
      {/* 中间：预览区 */}
      <div style={styles.main}>
        <div style={{ ...styles.header, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CodeOutlined />
          预览
          {selectedMetadata && (
            <Tag color={typeColors[selectedMetadata.__type as keyof typeof typeColors]} style={{ marginLeft: 8 }}>
              {selectedMetadata.name}
            </Tag>
          )}
        </div>
        <div style={{ ...styles.content, background: colors.bgWhite }}>
          <PreviewArea 
            metadata={selectedMetadata} 
            entityRelations={entityRelations}
            entities={entities}
            onEntityClick={(entityName) => {
              const entity = entities.find(e => e.name === entityName);
              if (entity) {
                setSelectedMetadata(entity);
                setSelectedKey(`domain-model-${entityName}`);
                setExpandedKeys(new Set([...expandedKeys, 'domain', 'domain-model']));
              }
            }}
          />
        </div>
      </div>
      
      {/* 右侧：属性面板 */}
      <div style={styles.panel}>
        <div style={styles.header}>
          <SettingOutlined style={{ marginRight: 8 }} />
          属性
        </div>
        <div style={styles.content}>
          <PropertyPanel 
            metadata={selectedMetadata} 
            entityRelations={entityRelations}
            entities={entities}
          />
        </div>
      </div>
    </div>
  );
}

export default ModelerApp;
