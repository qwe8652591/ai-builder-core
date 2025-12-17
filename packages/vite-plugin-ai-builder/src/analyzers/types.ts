/**
 * AST 分析器类型定义
 */

// ==================== 基础类型 ====================

/** DSL 类型 */
export type DSLType = 
  | 'entity' 
  | 'valueObject' 
  | 'enum' 
  | 'dto' 
  | 'page' 
  | 'component'
  | 'service' 
  | 'appService'
  | 'extension'
  | 'rule'
  | 'repository';

/** DSL 层级 */
export type DSLLayer = 'domain' | 'application' | 'presentation' | 'infrastructure';

// ==================== 字段定义 ====================

/** 字段验证规则 */
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

/** 字段定义 */
export interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: unknown;
  validation?: FieldValidation;
  primaryKey?: boolean;
  relation?: string;
  target?: string;
  embedded?: boolean;
}

// ==================== Entity 元数据 ====================

export interface EntityMetadata {
  __type: 'entity';
  name: string;
  table?: string;
  comment?: string;
  fields: Record<string, FieldDefinition>;
  /** 关联的扩展 */
  extensions?: ExtensionRef[];
  /** 源文件路径 */
  sourceFile?: string;
}

// ==================== DTO 元数据 ====================

export interface DTOMetadata {
  __type: 'dto';
  name: string;
  comment?: string;
  pagination?: boolean;
  fields: Record<string, FieldDefinition>;
  sourceFile?: string;
}

// ==================== Enum 元数据 ====================

export interface EnumValue {
  value: string;
  label: string;
}

export interface EnumMetadata {
  __type: 'enum';
  name: string;
  comment?: string;
  values: EnumValue[];
  sourceFile?: string;
}

// ==================== Component 元数据 ====================

/** 业务组件元数据 */
export interface ComponentMetadata {
  __type: 'component';
  name: string;
  description?: string;
  category?: string;
  /** Props 定义 */
  props?: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
  /** 使用的基础组件 */
  usedComponents?: string[];
  sourceFile?: string;
}

// ==================== Page 元数据 ====================

/** 组件属性 */
export interface ComponentProp {
  name: string;
  value: unknown;
}

/** 组件节点（内容结构树） */
export interface ComponentNode {
  /** 组件名称 */
  component: string;
  /** 关键属性 */
  props?: Record<string, unknown>;
  /** 子节点 */
  children?: ComponentNode[];
  /** 文本内容（如果是纯文本节点） */
  text?: string;
}

/** 服务方法调用 */
export interface ServiceMethodCall {
  /** 服务名称 */
  service: string;
  /** 方法名称 */
  method: string;
  /** 调用位置（行号） */
  line?: number;
}

export interface PageMetadata {
  __type: 'page';
  name: string;
  route?: string;
  permission?: string;
  description?: string;
  menu?: {
    parent?: string;
    order?: number;
    icon?: string;
  };
  /** 使用的组件列表 */
  components: string[];
  /** 使用的 Hook 列表 */
  hooks: string[];
  /** 导入的服务 */
  services: string[];
  /** 🆕 调用的服务方法 */
  serviceCalls: ServiceMethodCall[];
  /** 导入的实体/DTO */
  types: string[];
  /** 🆕 页面内容结构（JSX 树） */
  structure?: ComponentNode;
  sourceFile?: string;
}

// ==================== Service 元数据 ====================

export interface ServiceMethod {
  name: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: string;
  }>;
  returnType?: string;
  isQuery?: boolean;    // @Method({ query: true })
  isCommand?: boolean;  // @Method({ command: true })
}

export interface ServiceMetadata {
  __type: 'service' | 'appService';
  name: string;
  description?: string;
  methods: ServiceMethod[];
  sourceFile?: string;
}

// ==================== Extension 元数据 ====================

export interface ExtensionMember {
  name: string;
  description?: string;
  returnType?: string;
}

export interface ExtensionMetadata {
  __type: 'extension';
  name: string;
  description?: string;
  target: string;
  type: 'method' | 'property' | 'metadata';
  members: ExtensionMember[];
  sourceFile?: string;
}

/** 扩展引用（用于 Entity 中） */
export interface ExtensionRef {
  name: string;
  methods: string[];
}

// ==================== 分析结果 ====================

/** 项目分析结果 */
export interface AnalyzerResult {
  /** 实体列表 */
  entities: EntityMetadata[];
  /** DTO 列表 */
  dtos: DTOMetadata[];
  /** 枚举列表 */
  enums: EnumMetadata[];
  /** 页面列表 */
  pages: PageMetadata[];
  /** 业务组件列表 */
  components: ComponentMetadata[];
  /** 服务列表 */
  services: ServiceMetadata[];
  /** 扩展列表 */
  extensions: ExtensionMetadata[];
  /** 分析时间戳 */
  analyzedAt: string;
  /** 分析的文件数 */
  fileCount: number;
}

/** 分层元数据（兼容运行时格式） */
export interface LayeredMetadata {
  domain: {
    model: Map<string, EntityMetadata | EnumMetadata>;
    service: Map<string, ServiceMetadata>;
  };
  application: {
    dto: Map<string, DTOMetadata>;
    appService: Map<string, ServiceMetadata>;
  };
  presentation: {
    view: Map<string, PageMetadata>;
  };
  infrastructure: {
    extension: Map<string, ExtensionMetadata>;
  };
}

