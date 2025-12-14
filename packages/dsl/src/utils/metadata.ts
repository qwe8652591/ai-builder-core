/**
 * 内部元数据存储
 * 用于在编译期/运行时收集装饰器元数据
 */

// 导出工具函数
export { convertEntityToTable, generateAllTableMetadata } from './table-generator';
export { loadModelFile, extractFieldsFromSource } from './model-loader';

export interface FieldMetadata {
  name: string;
  type: string;
  label?: string;
  nullable?: boolean;
  dbField?: {
    type?: string;
    length?: number;
    precision?: number;
    scale?: number;
    default?: any;
    nullable?: boolean;
    unique?: boolean;
    index?: boolean;
    comment?: string;
  };
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string | RegExp;
    email?: boolean;
    url?: boolean;
  };
  isExtension?: boolean;  // 标记是否为扩展字段
}

export interface EntityMetadata {
  name: string;
  table?: string;
  comment?: string;
  fields: FieldMetadata[];
  fromPackage?: string;  // 来源 NPM 包名
}

/**
 * 表字段元数据（数据库层面的字段）
 */
export interface TableColumnMetadata {
  name: string;              // 数据库字段名（snake_case）
  type: string;              // Kysely 类型字符串
  comment?: string;          // 字段注释
  isGenerated?: boolean;     // 是否自动生成（如 id, created_at）
  isForeignKey?: boolean;    // 是否外键
  sourceField?: string;      // 来源实体字段名（如果是扁平化的字段）
}

/**
 * 表元数据（对应数据库表结构）
 */
export interface TableMetadata {
  name: string;              // 表名（snake_case）
  entityName: string;        // 对应的实体名
  comment?: string;          // 表注释
  columns: TableColumnMetadata[];  // 表字段列表
  enums?: Array<{            // 枚举类型定义
    name: string;
    values: string[];
  }>;
}

export interface MetadataStore {
  entities: Map<string, EntityMetadata>;
  tables: Map<string, TableMetadata>;  // 新增：表元数据
  fields: Map<string, Map<string, unknown>>;
}

class GlobalMetadataStore implements MetadataStore {
  entities = new Map<string, EntityMetadata>();
  tables = new Map<string, TableMetadata>();  // 新增：表元数据存储
  fields = new Map<string, Map<string, unknown>>();
  methods = new Map<string, Map<string, unknown>>();
  properties = new Map<string, Map<string, unknown>>();

  registerEntity(className: string, options: unknown) {
    const metadata = options as EntityMetadata;
    this.entities.set(className, metadata);
  }

  getEntity(className: string): EntityMetadata | undefined {
    return this.entities.get(className);
  }

  /**
   * 注册表元数据
   */
  registerTable(tableName: string, metadata: TableMetadata) {
    this.tables.set(tableName, metadata);
  }

  /**
   * 获取表元数据
   */
  getTable(tableName: string): TableMetadata | undefined {
    return this.tables.get(tableName);
  }

  /**
   * 根据实体名获取表元数据
   */
  getTableByEntity(entityName: string): TableMetadata | undefined {
    return Array.from(this.tables.values()).find(t => t.entityName === entityName);
  }

  /**
   * 获取所有表元数据
   */
  getAllTables(): TableMetadata[] {
    return Array.from(this.tables.values());
  }

  registerField(className: string, fieldName: string, options: unknown) {
    if (!this.fields.has(className)) {
      this.fields.set(className, new Map());
    }
    this.fields.get(className)!.set(fieldName, options);
  }

  getField(className: string, fieldName: string): unknown {
    return this.fields.get(className)?.get(fieldName);
  }

  registerMethod(className: string, methodName: string, options: unknown) {
    if (!this.methods.has(className)) {
      this.methods.set(className, new Map());
    }
    this.methods.get(className)!.set(methodName, options);
  }

  getMethod(className: string, methodName: string): unknown {
    return this.methods.get(className)?.get(methodName);
  }

  registerProperty(className: string, propertyName: string, options: unknown) {
    if (!this.properties.has(className)) {
      this.properties.set(className, new Map());
    }
    this.properties.get(className)!.set(propertyName, options);
  }

  getProperty(className: string, propertyName: string): unknown {
    return this.properties.get(className)?.get(propertyName);
  }

  /**
   * 获取所有已注册的实体
   */
  getAllEntities(): EntityMetadata[] {
    return Array.from(this.entities.values());
  }

  /**
   * 获取所有实体名称
   */
  getAllEntityNames(): string[] {
    return Array.from(this.entities.keys());
  }

  /**
   * 获取指定实体的所有字段
   */
  getEntityFields(className: string): FieldMetadata[] {
    const entity = this.entities.get(className);
    return entity?.fields || [];
  }

  /**
   * 清空所有元数据（用于测试或重新加载）
   */
  clear() {
    this.entities.clear();
    this.tables.clear();
    this.fields.clear();
    this.methods.clear();
    this.properties.clear();
  }

  /**
   * 打印所有元数据（调试用）
   */
  debug() {
    console.log('\n📊 MetadataStore 内容：\n');
    console.log(`实体总数: ${this.entities.size}`);
    console.log(`表总数: ${this.tables.size}`);
    
    console.log('\n【实体元数据】');
    this.entities.forEach((entity, name) => {
      console.log(`\n📦 实体: ${name}`);
      console.log(`   表名: ${entity.table || 'N/A'}`);
      console.log(`   注释: ${entity.comment || 'N/A'}`);
      console.log(`   来源包: ${entity.fromPackage || '本地'}`);
      console.log(`   字段数: ${entity.fields.length}`);
      
      entity.fields.forEach(field => {
        const tags = [];
        if (field.isExtension) tags.push('扩展');
        if (field.nullable) tags.push('可空');
        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
        console.log(`      - ${field.name}: ${field.type}${tagStr}`);
      });
    });
    
    console.log('\n【表元数据】');
    this.tables.forEach((table, name) => {
      console.log(`\n🗄️  表: ${name}`);
      console.log(`   实体: ${table.entityName}`);
      console.log(`   注释: ${table.comment || 'N/A'}`);
      console.log(`   字段数: ${table.columns.length}`);
      
      table.columns.forEach(col => {
        const tags = [];
        if (col.isGenerated) tags.push('自动生成');
        if (col.isForeignKey) tags.push('外键');
        if (col.sourceField) tags.push(`来自:${col.sourceField}`);
        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
        console.log(`      - ${col.name}: ${col.type}${tagStr}`);
      });
    });
  }
}

// 导出单例
export const metadataStore = new GlobalMetadataStore();

/**
 * 初始化元数据（加载扩展、模型、生成表元数据）
 * 
 * @param options 初始化选项
 */
export async function initializeMetadata(options: {
  /** 扩展文件目录 */
  extensionsDir?: string;
  /** 领域模型目录 */
  domainDir: string;
  /** tsconfig.json 路径 */
  tsconfigPath?: string;
  /** 是否生成表元数据 */
  generateTables?: boolean;
  /** 是否显示日志 */
  verbose?: boolean;
}): Promise<void> {
  const { extensionsDir, domainDir, tsconfigPath, generateTables = true, verbose = false } = options;
  
  // 1. 加载扩展文件（如果有）
  if (extensionsDir) {
    const { globSync } = await import('glob');
    
    if (verbose) console.log('🔄 加载扩展定义...');
    
    const extensionFiles = globSync('**/*.ext.ts', { cwd: extensionsDir, absolute: true });
    for (const extFile of extensionFiles) {
      try {
        require(extFile);
        if (verbose) {
          const path = await import('path');
          console.log(`   ✅ 已加载 ${path.basename(extFile)}`);
        }
      } catch (error) {
        console.error(`加载扩展文件失败 ${extFile}:`, error);
      }
    }
    if (verbose) console.log();
  }
  
  // 2. 加载领域模型
  const { globSync } = await import('glob');
  const { loadModelFile } = await import('./model-loader');
  
  if (verbose) console.log('🔍 自动发现领域模型文件：');
  
  const modelFiles = globSync('**/*.model.ts', { cwd: domainDir, absolute: true });
  
  for (const modelFile of modelFiles) {
    if (verbose) {
      const path = await import('path');
      console.log(`   📄 ${path.basename(modelFile)}`);
    }
    
    loadModelFile(modelFile, tsconfigPath);
  }
  
  if (verbose) {
    console.log(`\n✅ 已导入 ${modelFiles.length} 个模型文件\n`);
  }
  
  // 3. 生成表元数据（如果需要）
  if (generateTables) {
    if (verbose) console.log('🔄 生成 Table 元数据：');
    await generateTableMetadata();
    
    if (verbose) {
      const tables = metadataStore.getAllTables();
      tables.forEach(table => {
        console.log(`   ✅ ${table.name} (${table.entityName}, ${table.columns.length} 列)`);
      });
      console.log();
    }
  }
}

/**
 * 生成表元数据
 * 将 Entity 元数据转换为 Table 元数据
 */
export async function generateTableMetadata(): Promise<void> {
  const { generateAllTableMetadata } = await import('./table-generator');
  generateAllTableMetadata();
}




