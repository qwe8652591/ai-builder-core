/**
 * DSL Modeler 独立应用的类型定义
 * （纯 TypeScript，不依赖 dsl-core）
 */

// ==================== 元数据类型 ====================

export interface FieldMetadata {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  primaryKey?: boolean;
  default?: unknown;
}

export interface EntityMetadata {
  __type: 'entity';
  name: string;
  table?: string;
  comment?: string;
  fields: Record<string, FieldMetadata>;
  extensions?: Array<{ name: string; methods: string[] }>;
  sourceFile?: string;
}

export interface DTOMetadata {
  __type: 'dto';
  name: string;
  comment?: string;
  fields: Record<string, FieldMetadata>;
  sourceFile?: string;
}

export interface EnumValue {
  key: string;
  value: string | number;
  label?: string;
  color?: string;
}

export interface EnumMetadata {
  __type: 'enum';
  name: string;
  comment?: string;
  values: EnumValue[];
  sourceFile?: string;
}

export interface ComponentNode {
  component: string;
  props?: Record<string, unknown>;
  children?: ComponentNode[];
  text?: string;
}

export interface ServiceMethodCall {
  service: string;
  method: string;
  line?: number;
}

export interface PageMetadata {
  __type: 'page';
  name: string;
  route?: string;
  permission?: string;
  components?: string[];
  hooks?: string[];
  services?: string[];
  serviceCalls?: ServiceMethodCall[];
  structure?: ComponentNode;
  sourceFile?: string;
}

export interface ServiceMethodParameter {
  name: string;
  type: string;
}

export interface ServiceMethod {
  name: string;
  description?: string;
  params?: string[];  // 兼容旧格式
  parameters?: ServiceMethodParameter[];  // 新格式：带类型的参数
  returnType?: string;
  isQuery?: boolean;    // 查询方法
  isCommand?: boolean;  // 命令方法
}

export interface ServiceMetadata {
  __type: 'appService' | 'service';  // 支持应用服务和业务服务
  name: string;
  comment?: string;
  description?: string;  // 描述
  methods?: ServiceMethod[];
  sourceFile?: string;
}

export interface ExtensionMethod {
  name: string;
  description?: string;
  returnType?: string;
}

export interface ExtensionMetadata {
  __type: 'extension';
  name: string;
  target?: string;
  description?: string;
  type?: string;
  methods?: ExtensionMethod[];
  members?: ExtensionMethod[]; // API 返回的字段名
  sourceFile?: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ComponentMetadata {
  __type: 'component';
  name: string;
  description?: string;
  category?: string;
  props?: ComponentProp[];
  usedComponents?: string[];
  sourceFile?: string;
}

export type AnyMetadata = 
  | EntityMetadata 
  | DTOMetadata 
  | EnumMetadata 
  | PageMetadata 
  | ComponentMetadata 
  | ServiceMetadata 
  | ExtensionMetadata;

export interface ASTMetadata {
  entities: EntityMetadata[];
  dtos: DTOMetadata[];
  enums: EnumMetadata[];
  pages: PageMetadata[];
  components: ComponentMetadata[];
  services: ServiceMetadata[];  // 应用服务（兼容）
  domainServices: ServiceMetadata[];  // 业务服务（领域层）
  extensions: ExtensionMetadata[];
}

// ==================== 树节点类型 ====================

export interface TreeNode {
  key: string;
  title: string;
  icon?: string;
  type?: 'layer' | 'subLayer' | 'item';
  metadata?: AnyMetadata;
  children?: TreeNode[];
  count?: number;
  badge?: string;  // 自定义类型标识
}

// ==================== 配置 ====================

export interface SubLayerConfig {
  title: string;
  icon: string;
  dataKey: keyof ASTMetadata;
  badge?: string;  // 类型标识（自定义/派生）
}

export interface LayerConfig {
  title: string;
  icon: string;
  subLayers: Record<string, SubLayerConfig>;
}

export const layerConfig: Record<string, LayerConfig> = {
  domain: {
    title: '领域层 (Domain)',
    icon: '🏛️',
    subLayers: {
      entities: { title: '实体', icon: '📦', dataKey: 'entities' },
      enums: { title: '枚举', icon: '🏷️', dataKey: 'enums' },
      domainServices: { title: '业务服务', icon: '⚙️', dataKey: 'domainServices' },
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
      extensions: { title: 'DSL 扩展', icon: '🔗', dataKey: 'extensions', badge: '自定义' },
    },
  },
};

export const typeColors: Record<string, string> = {
  entity: '#1890ff',
  enum: '#722ed1',
  dto: '#fa8c16',
  appService: '#f5222d',
  service: '#eb2f96',  // 业务服务（粉色）
  page: '#13c2c2',
  component: '#52c41a',
  extension: '#9254de',
};

export const typeLabels: Record<string, string> = {
  entity: '实体',
  enum: '枚举',
  dto: 'DTO',
  appService: '应用服务',
  service: '业务服务',
  page: '页面',
  component: '业务组件',
  extension: '扩展',
};

// 每个元数据类型的图标
export const typeIcons: Record<string, string> = {
  entity: '📦',
  enum: '🏷️',
  dto: '📤',
  appService: '🎯',
  service: '⚙️',  // 业务服务
  page: '📄',
  component: '🧩',
  extension: '🔗',
};

export const defaultTheme = {
  colors: typeColors,
  labels: typeLabels,
  icons: typeIcons,
};

