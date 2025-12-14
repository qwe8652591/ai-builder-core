/**
 * 元数据浏览器页面
 * 
 * 类似 SAP GUI 的元数据管理器，按树形结构展示系统中所有 DSL 元数据对象
 */

import { 
  definePage, 
  useState, 
  useEffect,
  useComputed,
  getLayeredMetadata,
  type BaseDSLMetadata,
  type LayeredMetadata,
} from '@qwe8652591/dsl-core';

import { 
  Page, 
  Card, 
  Space, 
  Input,
  Button,
  Tag,
} from '@qwe8652591/std-ui';

// ==================== 类型定义 ====================

interface TreeNode {
  key: string;
  title: string;
  icon?: string;
  type?: 'layer' | 'subLayer' | 'item';
  metadata?: BaseDSLMetadata;
  children?: TreeNode[];
  count?: number;
}

/** 扩展元数据的额外字段 */
interface ExtensionMetadata extends BaseDSLMetadata {
  target?: string;
  extensionType?: 'method' | 'property' | 'metadata';
  members?: Array<{
    name: string;
    description?: string;
    returnType?: string;
  }>;
}

// ==================== 层级配置 ====================

const layerConfig = {
  domain: {
    title: '领域层 (Domain)',
    icon: '🏛️',
    subLayers: {
      model: { title: '领域模型', icon: '📦', types: ['entity', 'valueObject', 'enum'] },
      domain: { title: '领域规则', icon: '📋', types: ['rule', 'domainLogic'] },
      repository: { title: '数据访问', icon: '💾', types: ['repository'] },
      service: { title: '领域服务', icon: '⚙️', types: ['service'] },
    },
  },
  application: {
    title: '应用层 (Application)',
    icon: '🔧',
    subLayers: {
      dto: { title: '数据传输对象', icon: '📤', types: ['dto'] },
      appService: { title: '应用服务', icon: '🎯', types: ['appService'] },
    },
  },
  presentation: {
    title: '表现层 (Presentation)',
    icon: '🖥️',
    subLayers: {
      view: { title: '页面', icon: '📄', types: ['page'] },
      component: { title: '组件', icon: '🧩', types: ['component'] },
    },
  },
  // 🆕 基础设施层（扩展）
  infrastructure: {
    title: '基础设施层 (Infrastructure)',
    icon: '🔌',
    subLayers: {
      extension: { title: 'DSL 扩展', icon: '🔗', types: ['extension'] },
    },
  },
};

// 类型标签颜色映射
const typeColors: Record<string, string> = {
  entity: '#1890ff',
  valueObject: '#52c41a',
  enum: '#722ed1',
  dto: '#fa8c16',
  rule: '#eb2f96',
  domainLogic: '#13c2c2',
  repository: '#2f54eb',
  service: '#faad14',
  appService: '#f5222d',
  page: '#1890ff',
  component: '#52c41a',
  extension: '#9254de',  // 🆕 扩展
};

// 类型标签文本映射
const typeLabels: Record<string, string> = {
  entity: '实体',
  valueObject: '值对象',
  enum: '枚举',
  dto: 'DTO',
  constant: '常量',
  rule: '规则',
  domainLogic: '领域逻辑',
  repository: '仓储',
  service: '服务',
  appService: '应用服务',
  page: '页面',
  component: '组件',
  extension: '扩展',  // 🆕
};

/**
 * 元数据浏览器页面
 */
export default definePage({
  title: '元数据浏览器',
  route: '/system/metadata',
  permission: 'system:metadata:view',
  menu: {
    parent: 'SystemManagement',
    order: 10,
    icon: 'DatabaseOutlined',
  },
}, () => {
  // ==================== 状态 ====================
  
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchText, setSearchText] = useState('');
  const [definitionExpanded, setDefinitionExpanded] = useState(false);  // 定义详情默认收起
  
  // ==================== 加载数据 ====================
  
  const loadMetadata = () => {
    const layered = getLayeredMetadata();
    
    // 构建树形结构
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
        };
        
        // 获取该子层的元数据
        const layerData = layered[layerKey as keyof LayeredMetadata];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subLayerData = (layerData as any)?.[subLayerKey] as Map<string, BaseDSLMetadata> | undefined;
        
        if (subLayerData && subLayerData instanceof Map) {
          subLayerData.forEach((metadata: BaseDSLMetadata, name: string) => {
            subLayerNode.children!.push({
              key: `${layerKey}-${subLayerKey}-${name}`,
              title: name,
              type: 'item',
              metadata,
            });
          });
          subLayerNode.count = subLayerNode.children!.length;
        }
        
        layerNode.children!.push(subLayerNode);
        layerNode.count! += subLayerNode.count || 0;
      });
      
      tree.push(layerNode);
    });
    
    setTreeData(tree);
    
    // 默认展开第一层
    setExpandedKeys(tree.map(n => n.key));
  };
  
  useEffect(() => {
    loadMetadata();
  }, []);
  
  // ==================== 过滤 ====================
  
  const filteredTree = useComputed(() => {
    if (!searchText.trim()) return treeData;
    
    const search = searchText.toLowerCase();
    
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.type === 'item') {
          const match = node.title.toLowerCase().includes(search) ||
            node.metadata?.comment?.toLowerCase().includes(search) ||
            node.metadata?.__type?.toLowerCase().includes(search);
          return match ? node : null;
        }
        
        const filteredChildren = node.children ? filterNodes(node.children).filter(Boolean) as TreeNode[] : [];
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren, count: filteredChildren.length };
        }
        return null;
      }).filter(Boolean) as TreeNode[];
    };
    
    return filterNodes(treeData);
  }, [treeData, searchText]);
  
  // ==================== 事件处理 ====================
  
  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };
  
  const selectNode = (node: TreeNode) => {
    setSelectedNode(node);
  };
  
  const expandAll = () => {
    const getAllKeys = (nodes: TreeNode[]): string[] => {
      return nodes.flatMap(n => [n.key, ...(n.children ? getAllKeys(n.children) : [])]);
    };
    setExpandedKeys(getAllKeys(treeData));
  };
  
  const collapseAll = () => {
    setExpandedKeys([]);
  };
  
  // ==================== 渲染树节点 ====================
  
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedKeys.includes(node.key);
    const isSelected = selectedNode?.key === node.key;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.key}>
        {/* 节点本身 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            paddingLeft: level * 20 + 8,
            cursor: 'pointer',
            background: isSelected ? '#e6f7ff' : 'transparent',
            borderRadius: 4,
            transition: 'background 0.2s',
          }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.key);
            }
            selectNode(node);
          }}
        >
          {/* 展开/折叠图标 */}
          <span style={{ width: 20, textAlign: 'center', color: '#999' }}>
            {hasChildren ? (isExpanded ? '▼' : '▶') : '  '}
          </span>
          
          {/* 图标 */}
          <span style={{ marginRight: 8 }}>{node.icon || '📁'}</span>
          
          {/* 标题 */}
          <span style={{ flex: 1, fontWeight: node.type !== 'item' ? 500 : 400 }}>
            {node.title}
          </span>
          
          {/* 类型标签 */}
          {node.metadata && (
            <Tag style={{ 
              background: typeColors[node.metadata.__type] || '#999',
              color: '#fff',
              border: 'none',
              fontSize: 11,
              padding: '0 6px',
              marginRight: 8,
            }}>
              {typeLabels[node.metadata.__type] || node.metadata.__type}
            </Tag>
          )}
          
          {/* 数量 */}
          {node.count !== undefined && node.count > 0 && (
            <span style={{ 
              color: '#999', 
              fontSize: 12,
              background: '#f0f0f0',
              padding: '0 6px',
              borderRadius: 10,
            }}>
              {node.count}
            </span>
          )}
        </div>
        
        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // ==================== 渲染详情面板 ====================
  
  const renderDetailPanel = () => {
    if (!selectedNode) {
      return (
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#999' 
        }}>
          请选择一个元数据对象查看详情
        </div>
      );
    }
    
    const { metadata } = selectedNode;
    
    if (!metadata) {
      return (
        <div style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>{selectedNode.icon} {selectedNode.title}</h3>
          <p style={{ color: '#666' }}>
            这是一个分组节点，包含 {selectedNode.count || 0} 个子项目。
          </p>
        </div>
      );
    }
    
    // 格式化定义对象
    const formatDefinition = (def: unknown) => {
      try {
        // 移除循环引用和函数
        const seen = new WeakSet();
        return JSON.stringify(def, (key, value) => {
          if (key === '__class' || key === 'prototype') return undefined;
          if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
          }
          return value;
        }, 2);
      } catch {
        return String(def);
      }
    };
    
    return (
      <div style={{ padding: 20 }}>
        {/* 标题 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0 }}>{metadata.name}</h2>
          <Tag style={{ 
            background: typeColors[metadata.__type] || '#999',
            color: '#fff',
            border: 'none',
          }}>
            {typeLabels[metadata.__type] || metadata.__type}
          </Tag>
        </div>
        
        {/* 基本信息 */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: '#666' }}>📋 基本信息</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', width: 120, color: '#999' }}>名称</td>
                <td style={{ padding: '8px 0' }}>{metadata.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#999' }}>类型</td>
                <td style={{ padding: '8px 0' }}>{typeLabels[metadata.__type] || metadata.__type}</td>
              </tr>
              {(metadata.comment || metadata.description) && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#999' }}>描述</td>
                  <td style={{ padding: '8px 0' }}>{metadata.comment || metadata.description}</td>
                </tr>
              )}
              {/* 🆕 扩展特有信息 */}
              {metadata.__type === 'extension' && (metadata as ExtensionMetadata).target && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#999' }}>扩展目标</td>
                  <td style={{ padding: '8px 0' }}>
                    <Tag style={{ background: '#1890ff', color: '#fff', border: 'none' }}>
                      {(metadata as ExtensionMetadata).target}
                    </Tag>
                  </td>
                </tr>
              )}
              {metadata.__type === 'extension' && (metadata as ExtensionMetadata).extensionType && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#999' }}>扩展类型</td>
                  <td style={{ padding: '8px 0' }}>
                    {(metadata as ExtensionMetadata).extensionType === 'method' ? '方法扩展' : 
                     (metadata as ExtensionMetadata).extensionType === 'metadata' ? '元数据扩展' : 
                     (metadata as ExtensionMetadata).extensionType}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0', color: '#999' }}>注册时间</td>
                <td style={{ padding: '8px 0' }}>
                  {new Date(metadata.registeredAt).toLocaleString('zh-CN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 🆕 扩展方法列表 */}
        {metadata.__type === 'extension' && (metadata as ExtensionMetadata).members && (metadata as ExtensionMetadata).members!.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#666' }}>🔗 扩展成员</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>名称</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>描述</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>返回类型</th>
                </tr>
              </thead>
              <tbody>
                {(metadata as ExtensionMetadata).members!.map((member, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#1890ff' }}>
                      {member.name}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#666' }}>
                      {member.description || '-'}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#52c41a' }}>
                      {member.returnType || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 定义详情 - 可折叠 */}
        <div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: definitionExpanded ? 12 : 0,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setDefinitionExpanded(!definitionExpanded)}
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
              transform: definitionExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              ▶
            </span>
            <h4 style={{ margin: 0, color: '#666' }}>🔍 定义详情</h4>
            <span style={{ color: '#999', fontSize: 12 }}>
              {definitionExpanded ? '点击收起' : '点击展开'}
            </span>
          </div>
          {definitionExpanded && (
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: 400,
              fontSize: 12,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {formatDefinition(metadata.definition)}
            </pre>
          )}
        </div>
      </div>
    );
  };
  
  // ==================== 渲染 ====================
  
  return (
    <Page>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 主内容区 */}
        <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 150px)' }}>
          {/* 左侧树形导航 */}
          <Card style={{ width: 400, flexShrink: 0 }}>
            {/* 工具栏 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                value={searchText}
                onChange={(v) => setSearchText(v as string)}
                placeholder="搜索元数据..."
                style={{ width: 200 }}
              />
              <Button size="small" onClick={expandAll}>⬇</Button>
              <Button size="small" onClick={collapseAll}>⬆</Button>
              <Button size="small" onClick={loadMetadata}>🔄</Button>
            </div>
            
            {/* 树形列表 */}
            <div style={{ 
              border: '1px solid #f0f0f0', 
              borderRadius: 8, 
              maxHeight: 'calc(100vh - 200px)',  // 动态计算高度
              minHeight: 600,
              overflow: 'auto',
            }}>
              {filteredTree.map(node => renderTreeNode(node))}
            </div>
          </Card>
          
          {/* 右侧详情面板 */}
          <Card style={{ flex: 1 }} title="📄 详情">
            {renderDetailPanel()}
          </Card>
        </div>
      </Space>
    </Page>
  );
});

