/**
 * DSL Modeler 类型定义
 */

// ==================== 元数据类型 ====================

/** 字段元数据 */
export interface FieldMetadata {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  primaryKey?: boolean;
  default?: unknown;
}

/** 实体元数据 */
export interface EntityMetadata {
  __type: 'entity';
  name: string;
  table?: string;
  comment?: string;
  fields: Record<string, FieldMetadata>;
  extensions?: Array<{ name: string; methods: string[] }>;
  sourceFile?: string;
}

/** DTO 元数据 */
export interface DTOMetadata {
  __type: 'dto';
  name: string;
  comment?: string;
  fields: Record<string, FieldMetadata>;
  sourceFile?: string;
}

/** 枚举值 */
export interface EnumValue {
  key: string;
  value: string | number;
  label?: string;
  color?: string;
}

/** 枚举元数据 */
export interface EnumMetadata {
  __type: 'enum';
  name: string;
  comment?: string;
  values: EnumValue[];
  sourceFile?: string;
}

/** 组件节点（UI 结构） */
export interface ComponentNode {
  component: string;
  props?: Record<string, unknown>;
  children?: ComponentNode[];
  text?: string;
}

/** Tab 项结构 */
export interface TabItem {
  key: string;
  tab: string;
  children?: ComponentNode;
}

/** 服务方法调用 */
export interface ServiceMethodCall {
  service: string;
  method: string;
  line?: number;
}

/** 页面元数据 */
export interface PageMetadata {
  __type: 'page';
  name: string;
  route?: string;
  permission?: string;
  menu?: { parent?: string; order?: number; icon?: string };
  components?: string[];
  hooks?: string[];
  services?: string[];
  serviceCalls?: ServiceMethodCall[];
  types?: string[];
  structure?: ComponentNode;
  sourceFile?: string;
}

/** 服务方法 */
export interface ServiceMethod {
  name: string;
  params?: string[];
  returnType?: string;
}

/** 服务元数据 */
export interface ServiceMetadata {
  __type: 'appService';
  name: string;
  comment?: string;
  methods?: ServiceMethod[];
  sourceFile?: string;
}

/** 扩展方法 */
export interface ExtensionMethod {
  name: string;
  description?: string;
  returnType?: string;
}

/** 扩展元数据 */
export interface ExtensionMetadata {
  __type: 'extension';
  name: string;
  target?: string;
  description?: string;
  methods?: ExtensionMethod[];
  sourceFile?: string;
}

/** 组件 Prop 定义 */
export interface ComponentProp {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

/** 组件元数据 */
export interface ComponentMetadata {
  __type: 'component';
  name: string;
  description?: string;
  category?: string;
  props?: ComponentProp[];
  usedComponents?: string[];
  sourceFile?: string;
}

/** 所有元数据类型的联合 */
export type AnyMetadata = 
  | EntityMetadata 
  | DTOMetadata 
  | EnumMetadata 
  | PageMetadata 
  | ComponentMetadata 
  | ServiceMetadata 
  | ExtensionMetadata
  | CustomMetadata;

/** 自定义/派生元数据（通用结构） */
export interface CustomMetadata {
  __type: string;
  name: string;
  [key: string]: unknown;
}

/** AST 分析结果 - 支持动态类型 */
export interface ASTMetadata {
  // 内置类型
  entities: EntityMetadata[];
  dtos: DTOMetadata[];
  enums: EnumMetadata[];
  pages: PageMetadata[];
  components: ComponentMetadata[];
  services: ServiceMetadata[];
  extensions: ExtensionMetadata[];
  // 动态类型：key 为类型名，value 为该类型的所有元数据
  [customType: string]: unknown[] | undefined;
}

/** 动态类型配置（从 dsl-core 获取） */
export interface DynamicTypeConfig {
  type: string;
  layer: string;
  subLayer?: string;
  label: string;
  icon: string;
  isDerived?: boolean;
  derivedFrom?: string[];
}

// ==================== 树节点类型 ====================

export type TreeNodeType = 'layer' | 'subLayer' | 'item';

export interface TreeNode {
  key: string;
  title: string;
  icon?: string;
  type?: TreeNodeType;
  metadata?: AnyMetadata;
  children?: TreeNode[];
  count?: number;
}

// ==================== 层级配置 ====================

export interface SubLayerConfig {
  title: string;
  icon: string;
  dataKey: keyof ASTMetadata;
}

export interface LayerConfig {
  title: string;
  icon: string;
  subLayers: Record<string, SubLayerConfig>;
}

// ==================== 组件 Props ====================

/** Explorer 组件 Props */
export interface ExplorerProps {
  data: ASTMetadata | null;
  loading?: boolean;
  error?: string | null;
  selectedKey?: string | null;
  onSelect?: (node: TreeNode) => void;
  onRefresh?: () => void;
}

/** Viewer 组件通用 Props */
export interface ViewerProps<T extends AnyMetadata = AnyMetadata> {
  metadata: T | null;
}

/** PropertyPanel 组件 Props */
export interface PropertyPanelProps {
  metadata: AnyMetadata | null;
  node?: TreeNode | null;
}

/** ModelerWorkbench 组件 Props */
export interface ModelerWorkbenchProps {
  /** API 端点（获取元数据） */
  apiEndpoint?: string;
  /** 动态类型 API 端点（获取自定义类型配置） */
  typesEndpoint?: string;
  /** 初始数据（可选，不提供则从 API 加载） */
  initialData?: ASTMetadata;
  /** 动态类型配置列表（可选，不提供则从 API 加载） */
  dynamicTypes?: DynamicTypeConfig[];
  /** 标题 */
  title?: string;
}

// ==================== 样式主题 ====================

export interface ModelerTheme {
  colors: {
    entity: string;
    enum: string;
    dto: string;
    appService: string;
    page: string;
    component: string;
    extension: string;
  };
  labels: {
    entity: string;
    enum: string;
    dto: string;
    appService: string;
    page: string;
    component: string;
    extension: string;
  };
}

/** 默认主题（内置类型） */
export const defaultTheme: ModelerTheme = {
  colors: {
    entity: '#1890ff',
    enum: '#722ed1',
    dto: '#fa8c16',
    appService: '#f5222d',
    page: '#13c2c2',
    component: '#52c41a',
    extension: '#9254de',
  },
  labels: {
    entity: '实体',
    enum: '枚举',
    dto: 'DTO',
    appService: '应用服务',
    page: '页面',
    component: '业务组件',
    extension: '扩展',
  },
};

/** 动态主题（可扩展） */
export interface DynamicTheme extends ModelerTheme {
  colors: Record<string, string>;
  labels: Record<string, string>;
}

/** 预定义的颜色池（用于自定义类型） */
const colorPalette = [
  '#eb2f96', '#faad14', '#a0d911', '#1890ff', '#722ed1',
  '#13c2c2', '#52c41a', '#fa541c', '#2f54eb', '#fa8c16',
];

/**
 * 根据动态类型配置构建主题
 */
export function buildTheme(dynamicTypes: DynamicTypeConfig[]): DynamicTheme {
  const theme: DynamicTheme = {
    colors: { ...defaultTheme.colors },
    labels: { ...defaultTheme.labels },
  };
  
  dynamicTypes.forEach((typeConfig, index) => {
    // 使用颜色池循环分配颜色
    theme.colors[typeConfig.type] = colorPalette[index % colorPalette.length];
    theme.labels[typeConfig.type] = typeConfig.label;
  });
  
  return theme;
}

/** 默认层级配置（内置类型） */
export const defaultLayerConfig: Record<string, LayerConfig> = {
  domain: {
    title: '领域层 (Domain)',
    icon: '🏛️',
    subLayers: {
      entities: { title: '实体', icon: '📦', dataKey: 'entities' },
      enums: { title: '枚举', icon: '🏷️', dataKey: 'enums' },
    },
  },
  presentation: {
    title: '表现层 (Presentation)',
    icon: '🎨',
    subLayers: {
      pages: { title: '页面', icon: '📄', dataKey: 'pages' },
      components: { title: '组件', icon: '🧩', dataKey: 'components' },
    },
  },
  application: {
    title: '应用层 (Application)',
    icon: '🔧',
    subLayers: {
      dtos: { title: '数据传输对象', icon: '📤', dataKey: 'dtos' },
      services: { title: '应用服务', icon: '🎯', dataKey: 'services' },
    },
  },
  infrastructure: {
    title: '基础设施层 (Infrastructure)',
    icon: '🔌',
    subLayers: {
      extensions: { title: 'DSL 扩展', icon: '🔗', dataKey: 'extensions' },
    },
  },
};

/** 自定义层配置 */
export const customLayerConfig: LayerConfig = {
  title: '自定义层 (Custom)',
  icon: '🎯',
  subLayers: {},
};

/** 派生层配置 */
export const derivedLayerConfig: LayerConfig = {
  title: '派生元数据 (Derived)',
  icon: '🔮',
  subLayers: {},
};

/** 合并后的层级配置（向后兼容） */
export const layerConfig: Record<string, LayerConfig> = defaultLayerConfig;

/**
 * 根据动态类型配置构建完整的层级配置
 */
export function buildLayerConfig(dynamicTypes: DynamicTypeConfig[]): Record<string, LayerConfig> {
  const config = JSON.parse(JSON.stringify(defaultLayerConfig)) as Record<string, LayerConfig>;
  
  // 添加自定义层和派生层
  config.custom = JSON.parse(JSON.stringify(customLayerConfig));
  config.derived = JSON.parse(JSON.stringify(derivedLayerConfig));
  
  // 根据动态类型更新配置
  for (const typeConfig of dynamicTypes) {
    const layer = typeConfig.isDerived ? 'derived' : (typeConfig.layer || 'custom');
    
    // 确保层存在
    if (!config[layer]) {
      config[layer] = {
        title: `${layer} Layer`,
        icon: '📁',
        subLayers: {},
      };
    }
    
    // 添加子层（以类型名作为 dataKey）
    const subLayerKey = typeConfig.type;
    config[layer].subLayers[subLayerKey] = {
      title: typeConfig.label,
      icon: typeConfig.icon,
      dataKey: typeConfig.type as keyof ASTMetadata,
    };
  }
  
  return config;
}

