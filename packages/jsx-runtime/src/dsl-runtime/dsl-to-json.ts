/**
 * DSL 自动转 JSON 工具
 * 
 * 自动识别 DSL 定义类型并提取元数据，生成统一的 JSON 结构
 */

// ==================== 类型定义 ====================

export type DSLType = 
  | 'entity' 
  | 'valueObject' 
  | 'enum' 
  | 'dto' 
  | 'constant'
  | 'rule'
  | 'domainLogic'
  | 'repository'
  | 'service'
  | 'appService'
  | 'page'
  | 'unknown';

export interface FieldMetadata {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  primaryKey?: boolean;
  relation?: string;
  embedded?: boolean;
  target?: string;
  enumType?: string;
  default?: unknown;
  hasValidation?: boolean;
}

export interface DSLMetadata {
  /** DSL 类型 */
  __dslType: DSLType;
  /** 名称 */
  name: string;
  /** 描述/注释 */
  description?: string;
  /** 表名（如果有） */
  table?: string;
  /** 字段列表 */
  fields?: FieldMetadata[];
  /** 字段数量 */
  fieldCount?: number;
  /** 枚举值（如果是枚举） */
  values?: Record<string, unknown>;
  /** 方法列表（如果是服务） */
  methods?: string[];
  /** 验证规则（如果是领域逻辑） */
  validations?: string[];
  /** 计算规则（如果是领域逻辑） */
  computations?: string[];
  /** 状态检查（如果是领域逻辑） */
  checks?: string[];
  /** 状态转换动作（如果是领域逻辑） */
  actions?: string[];
  /** 常量值（如果是常量） */
  value?: unknown;
  /** 是否暴露 API */
  expose?: boolean;
  /** 关联实体 */
  entity?: string;
  /** 路由 */
  route?: string;
  /** 权限 */
  permission?: string;
  /** 原始定义（用于调试） */
  _raw?: unknown;
}

// ==================== 类型检测 ====================

/**
 * 检测 DSL 定义的类型
 */
export function detectDSLType(dsl: unknown): DSLType {
  if (!dsl || typeof dsl !== 'object') return 'unknown';
  
  const obj = dsl as Record<string, unknown>;
  
  // 检查 __type 标记（由 define* 函数添加）
  if (obj.__type) {
    const typeMap: Record<string, DSLType> = {
      'entity': 'entity',
      'valueObject': 'valueObject',
      'enum': 'enum',
      'dto': 'dto',
      'constant': 'constant',
      'rule': 'rule',
      'domainLogic': 'domainLogic',
      'repository': 'repository',
      'service': 'service',
      'appService': 'appService',
      'page': 'page',
    };
    return typeMap[obj.__type as string] || 'unknown';
  }
  
  // 根据结构推断类型
  if (obj.meta && typeof obj.methods === 'object') {
    if ((obj.meta as Record<string, unknown>).expose !== undefined) {
      return 'appService';
    }
    if ((obj.meta as Record<string, unknown>).entity !== undefined) {
      return 'repository';
    }
    return 'service';
  }
  
  if (obj.validations || obj.computations || obj.checks || obj.actions) {
    return 'domainLogic';
  }
  
  if (obj.validate || obj.compute || obj.action) {
    return 'rule';
  }
  
  if (obj.values && typeof obj.values === 'object' && obj.name) {
    return 'enum';
  }
  
  if (obj.value !== undefined && obj.type) {
    return 'constant';
  }
  
  if (obj.fields && typeof obj.fields === 'object') {
    if (obj.base || obj.extends || obj.pick || obj.omit || obj.pagination) {
      return 'dto';
    }
    if (obj.table) {
      return 'entity';
    }
    return 'valueObject';
  }
  
  if (obj.title && obj.route) {
    return 'page';
  }
  
  return 'unknown';
}

// ==================== 字段提取 ====================

/**
 * 提取字段元数据
 */
function extractFields(fields: Record<string, unknown>): FieldMetadata[] {
  return Object.entries(fields).map(([name, field]) => {
    const f = field as Record<string, unknown>;
    const metadata: FieldMetadata = {
      name,
      type: (f.type as string) || 'unknown',
    };
    
    if (f.label) metadata.label = f.label as string;
    if (f.required) metadata.required = true;
    if (f.primaryKey) metadata.primaryKey = true;
    
    // composition 类型
    if (f.type === 'composition') {
      if (f.relation) metadata.relation = f.relation as string;
      if (f.embedded) metadata.embedded = true;
      if (f.target && typeof f.target === 'object') {
        metadata.target = (f.target as Record<string, unknown>).name as string;
      }
    }
    
    // enum 类型
    if (f.type === 'enum') {
      if (f.enumType && typeof f.enumType === 'object') {
        metadata.enumType = (f.enumType as Record<string, unknown>).name as string;
      }
      if (f.default !== undefined) metadata.default = f.default;
    }
    
    // 验证规则
    if (f.validation) metadata.hasValidation = true;
    
    return metadata;
  });
}

// ==================== DSL 转 JSON ====================

/**
 * 将单个 DSL 定义转换为 JSON 元数据
 */
export function dslToJson(dsl: unknown, includeRaw = false): DSLMetadata {
  const type = detectDSLType(dsl);
  const obj = dsl as Record<string, unknown>;
  
  const metadata: DSLMetadata = {
    __dslType: type,
    name: 'Unknown',
  };
  
  // 基础信息
  if (obj.name) metadata.name = obj.name as string;
  if (obj.comment) metadata.description = obj.comment as string;
  if (obj.description) metadata.description = obj.description as string;
  if (obj.table) metadata.table = obj.table as string;
  
  // 根据类型提取不同的元数据
  switch (type) {
    case 'entity':
    case 'valueObject':
    case 'dto':
      if (obj.fields && typeof obj.fields === 'object') {
        const fields = obj.fields as Record<string, unknown>;
        metadata.fields = extractFields(fields);
        metadata.fieldCount = metadata.fields.length;
      }
      break;
      
    case 'enum':
      if (obj.values && typeof obj.values === 'object') {
        metadata.values = obj.values as Record<string, unknown>;
      }
      break;
      
    case 'constant':
      metadata.value = obj.value;
      break;
      
    case 'rule':
      if (obj.message) metadata.description = obj.message as string;
      break;
      
    case 'domainLogic':
      if (obj.validations) metadata.validations = Object.keys(obj.validations as object);
      if (obj.computations) metadata.computations = Object.keys(obj.computations as object);
      if (obj.checks) metadata.checks = Object.keys(obj.checks as object);
      if (obj.actions) metadata.actions = Object.keys(obj.actions as object);
      break;
      
    case 'repository':
    case 'service':
    case 'appService':
      if (obj.meta && typeof obj.meta === 'object') {
        const meta = obj.meta as Record<string, unknown>;
        if (meta.name) metadata.name = meta.name as string;
        if (meta.description) metadata.description = meta.description as string;
        if (meta.expose !== undefined) metadata.expose = meta.expose as boolean;
        if (meta.entity) metadata.entity = meta.entity as string;
        if (meta.table) metadata.table = meta.table as string;
      }
      if (obj.methods && typeof obj.methods === 'object') {
        metadata.methods = Object.keys(obj.methods as object);
      }
      break;
      
    case 'page':
      if (obj.title) metadata.name = obj.title as string;
      if (obj.route) metadata.route = obj.route as string;
      if (obj.permission) metadata.permission = obj.permission as string;
      break;
  }
  
  // 包含原始定义（用于调试）
  if (includeRaw) {
    metadata._raw = dsl;
  }
  
  return metadata;
}

/**
 * 批量将 DSL 定义转换为 JSON
 */
export function dslCollectionToJson(
  collection: Record<string, unknown>,
  includeRaw = false
): Record<string, DSLMetadata> {
  const result: Record<string, DSLMetadata> = {};
  
  for (const [key, value] of Object.entries(collection)) {
    result[key] = dslToJson(value, includeRaw);
  }
  
  return result;
}

// ==================== 按类型分组 ====================

export interface DSLByLayer {
  domain: {
    models: Record<string, DSLMetadata>;
    domain: Record<string, DSLMetadata>;
    repository: Record<string, DSLMetadata>;
    service: Record<string, DSLMetadata>;
  };
  application: {
    appService: Record<string, DSLMetadata>;
    dto: Record<string, DSLMetadata>;
  };
  presentation: {
    view: Record<string, DSLMetadata>;
  };
}

/**
 * 将 DSL 集合按 DDD 分层分组
 */
export function groupDSLByLayer(
  collection: Record<string, unknown>,
  includeRaw = false
): DSLByLayer {
  const result: DSLByLayer = {
    domain: {
      models: {},
      domain: {},
      repository: {},
      service: {},
    },
    application: {
      appService: {},
      dto: {},
    },
    presentation: {
      view: {},
    },
  };
  
  for (const [key, value] of Object.entries(collection)) {
    const metadata = dslToJson(value, includeRaw);
    
    switch (metadata.__dslType) {
      case 'entity':
      case 'valueObject':
      case 'enum':
        result.domain.models[key] = metadata;
        break;
      case 'rule':
      case 'domainLogic':
        result.domain.domain[key] = metadata;
        break;
      case 'repository':
        result.domain.repository[key] = metadata;
        break;
      case 'service':
        result.domain.service[key] = metadata;
        break;
      case 'appService':
        result.application.appService[key] = metadata;
        break;
      case 'dto':
      case 'constant':
        result.application.dto[key] = metadata;
        break;
      case 'page':
        result.presentation.view[key] = metadata;
        break;
    }
  }
  
  return result;
}

// ==================== HTML 渲染工具 ====================

/**
 * 将字段列表渲染为表格 HTML
 */
export function fieldsToTable(fields: FieldMetadata[]): string {
  if (!fields || fields.length === 0) return '<p>无字段定义</p>';
  
  const rows = fields.map(f => {
    const badges: string[] = [];
    if (f.primaryKey) badges.push('<span class="badge pk">PK</span>');
    if (f.required) badges.push('<span class="badge required">必填</span>');
    if (f.hasValidation) badges.push('<span class="badge validation">验证</span>');
    
    let typeInfo = f.type;
    if (f.relation) typeInfo += ` (${f.relation})`;
    if (f.target) typeInfo += ` → ${f.target}`;
    if (f.enumType) typeInfo += ` (${f.enumType})`;
    if (f.embedded) typeInfo += ' [embedded]';
    
    return `
      <tr>
        <td><code>${f.name}</code></td>
        <td>${typeInfo}</td>
        <td>${f.label || '-'}</td>
        <td>${badges.join(' ') || '-'}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <table class="fields-table">
      <thead>
        <tr>
          <th>字段名</th>
          <th>类型</th>
          <th>标签</th>
          <th>属性</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * 将 DSL 元数据渲染为 HTML 卡片
 */
export function dslToHtmlCard(metadata: DSLMetadata, showRaw = false): string {
  const typeIcons: Record<DSLType, string> = {
    entity: '🔵',
    valueObject: '🔶',
    enum: '🔷',
    dto: '📋',
    constant: '🎨',
    rule: '✅',
    domainLogic: '💡',
    repository: '💾',
    service: '⚙️',
    appService: '📱',
    page: '📄',
    unknown: '❓',
  };
  
  const typeLabels: Record<DSLType, string> = {
    entity: '实体',
    valueObject: '值对象',
    enum: '枚举',
    dto: 'DTO',
    constant: '常量',
    rule: '规则',
    domainLogic: '领域逻辑',
    repository: 'Repository',
    service: 'Service',
    appService: 'AppService',
    page: 'Page',
    unknown: '未知',
  };
  
  let content = '';
  
  // 基本信息
  if (metadata.description) {
    content += `<p class="dsl-description">${metadata.description}</p>`;
  }
  if (metadata.table) {
    content += `<p><strong>表名:</strong> <code>${metadata.table}</code></p>`;
  }
  if (metadata.route) {
    content += `<p><strong>路由:</strong> <code>${metadata.route}</code></p>`;
  }
  
  // 字段表格
  if (metadata.fields && metadata.fields.length > 0) {
    content += `<p><strong>字段 (${metadata.fieldCount}):</strong></p>`;
    content += fieldsToTable(metadata.fields);
  }
  
  // 枚举值
  if (metadata.values) {
    content += `<p><strong>枚举值:</strong></p>`;
    content += `<pre class="json-block">${JSON.stringify(metadata.values, null, 2)}</pre>`;
  }
  
  // 常量值
  if (metadata.value !== undefined) {
    content += `<p><strong>值:</strong></p>`;
    content += `<pre class="json-block">${JSON.stringify(metadata.value, null, 2)}</pre>`;
  }
  
  // 方法列表
  if (metadata.methods && metadata.methods.length > 0) {
    content += `<p><strong>方法:</strong></p>`;
    content += `<ul class="method-list">${metadata.methods.map(m => `<li><code>${m}()</code></li>`).join('')}</ul>`;
  }
  
  // 领域逻辑分类
  if (metadata.validations) {
    content += `<p><strong>验证规则:</strong> ${metadata.validations.join(', ')}</p>`;
  }
  if (metadata.computations) {
    content += `<p><strong>计算规则:</strong> ${metadata.computations.join(', ')}</p>`;
  }
  if (metadata.checks) {
    content += `<p><strong>状态检查:</strong> ${metadata.checks.join(', ')}</p>`;
  }
  if (metadata.actions) {
    content += `<p><strong>状态转换:</strong> ${metadata.actions.join(', ')}</p>`;
  }
  
  // 原始 JSON
  if (showRaw && metadata._raw) {
    content += `<details><summary>原始定义 (JSON)</summary>`;
    content += `<pre class="json-block">${JSON.stringify(metadata._raw, null, 2)}</pre>`;
    content += `</details>`;
  }
  
  return `
    <div class="dsl-card ${metadata.__dslType}-card">
      <h3>${typeIcons[metadata.__dslType]} ${typeLabels[metadata.__dslType]}: ${metadata.name}</h3>
      ${content}
    </div>
  `;
}

/**
 * 将整个 DSL 集合渲染为按层分组的 HTML
 */
export function renderDSLCollection(
  collection: Record<string, unknown>,
  options: { showRaw?: boolean } = {}
): string {
  const grouped = groupDSLByLayer(collection, options.showRaw);
  
  const renderLayer = (
    items: Record<string, DSLMetadata>,
    title: string,
    icon: string
  ): string => {
    const cards = Object.values(items)
      .map(m => dslToHtmlCard(m, options.showRaw))
      .join('');
    
    if (!cards) return '';
    
    return `
      <div class="dsl-layer-section">
        <h3>${icon} ${title}</h3>
        ${cards}
      </div>
    `;
  };
  
  return `
    <!-- 领域层 -->
    <div class="layer-group domain-group">
      <div class="group-header">
        <h2>🏛️ 领域层 (Domain Layer)</h2>
      </div>
      ${renderLayer(grouped.domain.models, 'Model 层', '📦')}
      ${renderLayer(grouped.domain.domain, 'Domain 层', '💡')}
      ${renderLayer(grouped.domain.repository, 'Repository 层', '💾')}
      ${renderLayer(grouped.domain.service, 'Service 层', '⚙️')}
    </div>
    
    <!-- 应用层 -->
    <div class="layer-group application-group">
      <div class="group-header">
        <h2>📱 应用层 (Application Layer)</h2>
      </div>
      ${renderLayer(grouped.application.dto, 'DTO 层', '📋')}
      ${renderLayer(grouped.application.appService, 'AppService 层', '📱')}
    </div>
    
    <!-- 表现层 -->
    <div class="layer-group presentation-group">
      <div class="group-header">
        <h2>🖥️ 表现层 (Presentation Layer)</h2>
      </div>
      ${renderLayer(grouped.presentation.view, 'View 层', '📄')}
    </div>
  `;
}

