/**
 * 元数据资源目录树组件
 * 
 * 支持：
 * - 内置元数据类型（entity, enum, dto, page 等）
 * - 自定义元数据类型（通过 registerDSLType 注册）
 * - 派生元数据类型（如 entityRelation, serviceDependency 等）
 */

import { useState, useComputed } from '@qwe8652591/dsl-core';
import { Card, Input, Button, Tag, Space } from '@qwe8652591/std-ui';
import type { 
  TreeNode, 
  ASTMetadata, 
  AnyMetadata,
  ExplorerProps,
  LayerConfig,
  DynamicTheme,
} from '../../types';
import { defaultLayerConfig, defaultTheme, buildLayerConfig, buildTheme } from '../../types';
import type { DynamicTypeConfig } from '../../types';

/** 扩展的 Explorer Props，支持动态类型配置 */
export interface DynamicExplorerProps extends ExplorerProps {
  /** 动态类型配置列表 */
  dynamicTypes?: DynamicTypeConfig[];
}

/** 构建树形数据（支持动态类型） */
function buildTreeData(
  data: ASTMetadata, 
  layerConfigToUse: Record<string, LayerConfig>,
  themeToUse: DynamicTheme
): TreeNode[] {
  const tree: TreeNode[] = [];
  
  console.log('[MetadataTree] buildTreeData called');
  console.log('[MetadataTree] data keys:', Object.keys(data));
  console.log('[MetadataTree] layerConfig keys:', Object.keys(layerConfigToUse));
  console.log('[MetadataTree] layerConfig:', layerConfigToUse);
  
  Object.entries(layerConfigToUse).forEach(([layerKey, layerInfo]) => {
    // 跳过空的层
    if (Object.keys(layerInfo.subLayers).length === 0) return;
    
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
      
      // 支持动态类型的数据获取
      const dataKey = subLayerInfo.dataKey as string;
      const items = (data[dataKey] || []) as AnyMetadata[];
      
      items.forEach((item) => {
        subLayerNode.children!.push({
          key: `${layerKey}-${subLayerKey}-${item.name}`,
          title: item.name,
          type: 'item',
          metadata: item,
        });
      });
      
      subLayerNode.count = items.length;
      if (items.length > 0) {
        layerNode.children!.push(subLayerNode);
        layerNode.count! += items.length;
      }
    });
    
    // 只添加有内容的层
    if (layerNode.count! > 0) {
      tree.push(layerNode);
    }
  });
  
  return tree;
}

/** 获取所有节点 key */
function getAllKeys(nodes: TreeNode[]): string[] {
  return nodes.flatMap(n => [n.key, ...(n.children ? getAllKeys(n.children) : [])]);
}

/** 过滤树节点 */
function filterNodes(nodes: TreeNode[], search: string): TreeNode[] {
  return nodes.map(node => {
    if (node.type === 'item') {
      const meta = node.metadata;
      const match = node.title.toLowerCase().includes(search) ||
        (meta && 'comment' in meta && meta.comment?.toLowerCase().includes(search));
      return match ? node : null;
    }
    
    const filteredChildren = node.children ? filterNodes(node.children, search).filter(Boolean) as TreeNode[] : [];
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren, count: filteredChildren.length };
    }
    return null;
  }).filter(Boolean) as TreeNode[];
}

export function MetadataTree(props: DynamicExplorerProps) {
  const { data, loading, error, selectedKey, onSelect, onRefresh, dynamicTypes = [] } = props;
  
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  
  // 根据动态类型构建配置
  const layerConfigToUse = useComputed(() => {
    return buildLayerConfig(dynamicTypes);
  }, [dynamicTypes]);
  
  const themeToUse = useComputed(() => {
    return buildTheme(dynamicTypes);
  }, [dynamicTypes]);
  
  // 构建树数据
  const treeData = useComputed(() => {
    if (!data) return [];
    const tree = buildTreeData(data, layerConfigToUse, themeToUse);
    // 默认展开所有层
    if (expandedKeys.length === 0) {
      setExpandedKeys(tree.flatMap(n => [n.key, ...(n.children?.map(c => c.key) || [])]));
    }
    return tree;
  }, [data, layerConfigToUse]);
  
  // 过滤后的树
  const filteredTree = useComputed(() => {
    if (!searchText.trim()) return treeData;
    return filterNodes(treeData, searchText.toLowerCase());
  }, [treeData, searchText]);
  
  const toggleExpand = (key: string) => {
    setExpandedKeys((prev: string[]) => 
      prev.includes(key) 
        ? prev.filter((k: string) => k !== key)
        : [...prev, key]
    );
  };
  
  const expandAll = () => {
    setExpandedKeys(getAllKeys(treeData));
  };
  
  const collapseAll = () => {
    setExpandedKeys([]);
  };
  
  // 渲染树节点
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedKeys.includes(node.key);
    const isSelected = selectedKey === node.key;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.key}>
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
            onSelect?.(node);
          }}
        >
          <span style={{ width: 20, textAlign: 'center', color: '#999' }}>
            {hasChildren ? (isExpanded ? '▼' : '▶') : '  '}
          </span>
          
          <span style={{ marginRight: 8 }}>{node.icon || '📁'}</span>
          
          <span style={{ flex: 1, fontWeight: node.type !== 'item' ? 500 : 400 }}>
            {node.title}
          </span>
          
          {node.metadata && (
            <Tag style={{ 
              background: themeToUse.colors[node.metadata.__type] || '#999',
              color: '#fff',
              border: 'none',
              fontSize: 11,
              padding: '0 6px',
              marginRight: 8,
            }}>
              {themeToUse.labels[node.metadata.__type] || node.metadata.__type}
            </Tag>
          )}
          
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
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <span style={{ fontSize: 16 }}>📚</span>
        <span style={{ fontWeight: 500, flex: 1 }}>元数据资源目录</span>
      </div>
      
      {/* 工具栏 */}
      <Space style={{ marginBottom: 12 }}>
        <Input
          value={searchText}
          onChange={(v: unknown) => setSearchText(v as string)}
          placeholder="搜索..."
          style={{ flex: 1, minWidth: 120 }}
        />
        <Button size="small" onClick={expandAll}>⬇</Button>
        <Button size="small" onClick={collapseAll}>⬆</Button>
        {onRefresh && <Button size="small" onClick={onRefresh}>🔄</Button>}
      </Space>
      
      {/* 树形列表 */}
      <div style={{ 
        border: '1px solid #f0f0f0', 
        borderRadius: 8, 
        flex: 1,
        overflow: 'auto',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
            ⏳ 加载中...
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#f5222d' }}>
            ❌ {error}
          </div>
        ) : (
          filteredTree.map((node: TreeNode) => renderTreeNode(node))
        )}
      </div>
    </Card>
  );
}

export default MetadataTree;

