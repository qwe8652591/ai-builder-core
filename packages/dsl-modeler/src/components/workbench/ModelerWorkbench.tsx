/**
 * DSL Modeler 工作台 - 三栏布局主组件
 * 
 * 左侧：资源目录树
 * 中间：预览/渲染区域
 * 右侧：属性面板
 * 
 * 支持：
 * - 内置元数据类型
 * - 自定义元数据类型
 * - 派生元数据类型
 */

import { useState, useEffect, useComputed } from '@qwe8652591/dsl-core';
import { Page, Space } from '@qwe8652591/std-ui';
import type { 
  ModelerWorkbenchProps, 
  ASTMetadata, 
  TreeNode,
  AnyMetadata,
  DynamicTypeConfig,
  CustomMetadata,
  DynamicTheme,
} from '../../types';
import { buildTheme } from '../../types';
import { MetadataTree } from '../explorer/MetadataTree';
import { PropertyPanel } from '../panel/PropertyPanel';
import { 
  EntityViewer, 
  DTOViewer, 
  EnumViewer, 
  PageViewer, 
  ComponentViewer, 
  ServiceViewer,
  ExtensionViewer,
  GenericViewer,
} from '../viewers';

/** 内置类型列表 */
const BUILTIN_TYPES = ['entity', 'dto', 'enum', 'page', 'component', 'appService', 'extension'];

/** 获取对应类型的 Viewer 组件 */
function MetadataViewer(props: { metadata: AnyMetadata | null; theme?: DynamicTheme }) {
  const { metadata, theme } = props;
  
  if (!metadata) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#999',
        background: '#fafafa',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 64, marginBottom: 16 }}>🎨</span>
        <div style={{ fontSize: 16, marginBottom: 8 }}>选择一个元数据对象</div>
        <div style={{ fontSize: 12 }}>在左侧资源目录中选择要查看的内容</div>
      </div>
    );
  }
  
  // 内置类型使用专用 Viewer
  switch (metadata.__type) {
    case 'entity':
      return <EntityViewer metadata={metadata} />;
    case 'dto':
      return <DTOViewer metadata={metadata} />;
    case 'enum':
      return <EnumViewer metadata={metadata} />;
    case 'page':
      return <PageViewer metadata={metadata} />;
    case 'component':
      return <ComponentViewer metadata={metadata} />;
    case 'appService':
      return <ServiceViewer metadata={metadata} />;
    case 'extension':
      return <ExtensionViewer metadata={metadata} />;
    default:
      // 自定义类型和派生类型使用通用 Viewer
      return <GenericViewer metadata={metadata as CustomMetadata} theme={theme} />;
  }
}

export function ModelerWorkbench(props: ModelerWorkbenchProps) {
  const { 
    apiEndpoint = '/__ai-builder/metadata',
    typesEndpoint = '/__ai-builder/types',
    initialData,
    dynamicTypes: initialDynamicTypes,
    title = 'DSL Modeler',
  } = props;
  
  const [data, setData] = useState<ASTMetadata | null>(initialData || null);
  const [dynamicTypes, setDynamicTypes] = useState<DynamicTypeConfig[]>(initialDynamicTypes || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  
  // 构建动态主题
  const theme = useComputed(() => {
    return buildTheme(dynamicTypes);
  }, [dynamicTypes]);
  
  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行加载：AST 元数据、动态类型配置、扩展元数据
      const [metadataRes, typesRes, extendedRes] = await Promise.all([
        fetch(apiEndpoint),
        fetch(typesEndpoint).catch(() => null), // 类型配置可选
        fetch('/__ai-builder/extended').catch(() => null), // 扩展元数据可选
      ]);
      
      if (!metadataRes.ok) {
        throw new Error(`HTTP ${metadataRes.status}: ${metadataRes.statusText}`);
      }
      
      // AST 分析的内置类型元数据
      let result: ASTMetadata = await metadataRes.json();
      
      // 加载动态类型配置
      if (typesRes && typesRes.ok) {
        const types: DynamicTypeConfig[] = await typesRes.json();
        console.log('[ModelerWorkbench] 加载动态类型配置:', types.length, '个', types);
        setDynamicTypes(types);
      }
      
      // 合并扩展元数据（自定义 + 派生）
      if (extendedRes && extendedRes.ok) {
        const extended: Record<string, CustomMetadata[]> = await extendedRes.json();
        console.log('[ModelerWorkbench] 加载扩展元数据:', Object.keys(extended), extended);
        result = { ...result, ...extended };
      }
      
      console.log('[ModelerWorkbench] 最终数据:', Object.keys(result));
      setData(result);
    } catch (e) {
      setError(`加载元数据失败: ${(e as Error).message}`);
      console.error('[ModelerWorkbench] Failed to load metadata:', e);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, []);
  
  const handleSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };
  
  const handleRefresh = () => {
    loadData();
  };
  
  return (
    <Page>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <span style={{ fontSize: 24 }}>🏗️</span>
        <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
        <span style={{ 
          fontSize: 12, 
          color: '#999',
          background: '#f0f0f0',
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          元数据建模工作台
        </span>
      </div>
      
      {/* 三栏布局 */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        height: 'calc(100vh - 180px)',
        minHeight: 600,
      }}>
        {/* 左侧：资源目录 */}
        <MetadataTree
          data={data}
          loading={loading}
          error={error}
          selectedKey={selectedNode?.key}
          onSelect={handleSelect}
          onRefresh={handleRefresh}
          dynamicTypes={dynamicTypes}
        />
        
        {/* 中间：预览区域 */}
        <div style={{ 
          flex: 1, 
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
          overflow: 'auto',
        }}>
          <MetadataViewer metadata={selectedNode?.metadata || null} theme={theme} />
        </div>
        
        {/* 右侧：属性面板 */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <PropertyPanel 
            metadata={selectedNode?.metadata || null}
            node={selectedNode}
          />
        </div>
      </div>
    </Page>
  );
}

export default ModelerWorkbench;

