/**
 * DSL 项目加载器
 * 
 * 🎯 动态导入 DSL 项目的所有定义文件，自动注册到 Metadata Store
 * 
 * 使用 Vite 的 ssrLoadModule 来处理 TypeScript 模块导入
 */

import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { createServer, type ViteDevServer } from 'vite';

export interface DSLProjectConfig {
  /** 项目根目录（运行时自动设置） */
  root: string;
  
  /** 
   * DSL 源码目录（相对于 root）
   * @default 'src/dsl' - 约定优于配置
   */
  srcDir: string;
  
  /** 
   * DSL 入口文件（相对于 srcDir）
   * @default 'index.ts' - 约定优于配置
   */
  entry: string;
  
  /**
   * 自定义入口文件（相对于 root）
   * 如果提供，将使用此文件作为应用入口，否则自动生成
   * @example 'src/main.tsx'
   */
  customEntry?: string;
  
  /** 数据库配置 */
  database?: {
    /** 
     * 初始化 SQL 文件路径（相对于 root）
     * ⚠️ 必须在项目目录内，会进行安全检查
     */
    initSql?: string;
    
    /** 检查表名（用于判断数据库是否需要加载初始数据） */
    checkTable?: string;
    
    /** IndexedDB 持久化 key（浏览器端自动生成，可自定义） */
    persistKey?: string;
    
    /** 是否开启调试日志 */
    debug?: boolean;
  };
  
  /** 开发服务器配置 */
  server?: {
    port: number;
    host?: string;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Partial<DSLProjectConfig> = {
  srcDir: 'src/dsl',
  entry: 'index.ts',
  server: {
    port: 3000,
    host: 'localhost',
  },
};

/**
 * 验证路径安全性（防止路径遍历攻击）
 */
function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(basePath, targetPath);
  return resolvedTarget.startsWith(resolvedBase);
}

/**
 * 验证并规范化配置
 */
function validateConfig(config: DSLProjectConfig): void {
  const errors: string[] = [];
  
  // 验证 srcDir
  const srcDirPath = path.join(config.root, config.srcDir);
  if (!fs.existsSync(srcDirPath)) {
    errors.push(`❌ srcDir 目录不存在: ${srcDirPath}`);
  }
  
  // 验证 entry
  const entryPath = path.join(config.root, config.srcDir, config.entry);
  if (!fs.existsSync(entryPath)) {
    errors.push(`❌ entry 文件不存在: ${entryPath}`);
  }
  
  // 验证 customEntry（安全检查）
  if (config.customEntry) {
    if (!isPathSafe(config.root, config.customEntry)) {
      errors.push(`❌ customEntry 路径不安全（不能指向项目目录外）: ${config.customEntry}`);
    } else {
      const customEntryPath = path.join(config.root, config.customEntry);
      if (!fs.existsSync(customEntryPath)) {
        errors.push(`❌ customEntry 文件不存在: ${customEntryPath}`);
      }
    }
  }
  
  // 验证 initSql（安全检查）
  if (config.database?.initSql) {
    // 安全检查：确保路径在项目目录内
    if (!isPathSafe(config.root, config.database.initSql)) {
      errors.push(`❌ initSql 路径不安全（不能指向项目目录外）: ${config.database.initSql}`);
    } else {
      const initSqlPath = path.join(config.root, config.database.initSql);
      if (!fs.existsSync(initSqlPath)) {
        errors.push(`❌ initSql 文件不存在: ${initSqlPath}`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`DSL 配置验证失败:\n${errors.join('\n')}`);
  }
}

/**
 * 加载 DSL 项目配置
 */
export async function loadDSLConfig(projectPath: string): Promise<DSLProjectConfig> {
  const absolutePath = path.resolve(projectPath);
  const configPath = path.join(absolutePath, 'dsl.config.ts');
  const configJsPath = path.join(absolutePath, 'dsl.config.js');
  
  let userConfig: Partial<DSLProjectConfig> = {};
  
  // 尝试加载用户配置
  if (fs.existsSync(configPath)) {
    const module = await import(configPath);
    userConfig = module.default || module;
  } else if (fs.existsSync(configJsPath)) {
    const module = await import(configJsPath);
    userConfig = module.default || module;
  }
  
  // 合并配置
  const config: DSLProjectConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    root: absolutePath,
    // 自动生成 persistKey（如果未配置）
    database: userConfig.database ? {
      ...userConfig.database,
      persistKey: userConfig.database.persistKey || path.basename(absolutePath),
    } : undefined,
  } as DSLProjectConfig;
  
  // 验证配置
  validateConfig(config);
  
  return config;
}

/**
 * 发现 DSL 文件
 */
export async function discoverDSLFiles(config: DSLProjectConfig): Promise<{
  models: string[];
  dto: string[];
  services: string[];
  pages: string[];
  extensions: string[];
  repositories: string[];
  components: string[];
}> {
  const dslDir = path.join(config.root, config.srcDir);
  
  const findFiles = async (pattern: string) => {
    return glob(pattern, { cwd: dslDir, absolute: true });
  };
  
  const [models, dto, services, pages, extensions, repositories, components] = await Promise.all([
    findFiles('models/**/*.model.ts'),
    findFiles('dto/**/*.dto.ts'),
    findFiles('services/**/*.service.ts'),
    findFiles('pages/**/*.page.tsx'),
    findFiles('extensions/**/*.ext.ts'),
    findFiles('repositories/**/*.repository.ts'),
    findFiles('components/**/*.component.tsx'),
  ]);
  
  return { models, dto, services, pages, extensions, repositories, components };
}

/**
 * 创建用于加载 DSL 的 Vite 服务器
 */
async function createViteLoader(projectPath: string): Promise<ViteDevServer> {
  const server = await createServer({
    root: projectPath,
    server: {
      middlewareMode: true,
    },
    plugins: [
      (await import('@vitejs/plugin-react')).default(),
    ],
    optimizeDeps: {
      // Vite 5.1+ 配置
      noDiscovery: true,
      include: [],
    },
    ssr: {
      // 将 React 等 CJS 模块标记为外部依赖，使用 Node.js 原生加载
      external: ['react', 'react-dom', 'antd', 'decimal.js'],
      // 需要转换的模块（workspace 包）
      noExternal: [
        '@ai-builder/jsx-runtime',
        '@ai-builder/std-ui',
        '@ai-builder/runtime-renderer',
        '@ai-builder/dsl',
      ],
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: '@ai-builder/jsx-runtime',
    },
  });
  
  return server;
}

/**
 * 加载 DSL 项目
 * 
 * 使用 Vite 的 ssrLoadModule 动态导入所有 DSL 文件，
 * 触发装饰器执行，注册到 Metadata Store
 */
export async function loadDSLProject(projectPath: string): Promise<{
  config: DSLProjectConfig;
  files: Awaited<ReturnType<typeof discoverDSLFiles>>;
  vite: ViteDevServer;
  stats: {
    models: number;
    dto: number;
    services: number;
    pages: number;
    extensions: number;
    repositories: number;
    components: number;
    total: number;
  };
}> {
  console.log(`\n📦 Loading DSL project from: ${projectPath}\n`);
  
  // 1. 加载配置
  const config = await loadDSLConfig(projectPath);
  console.log(`  ✅ Config loaded`);
  
  // 2. 发现 DSL 文件
  const files = await discoverDSLFiles(config);
  console.log(`  ✅ Files discovered`);
  
  // 3. 创建 Vite loader
  console.log(`  ⏳ Creating Vite loader...`);
  const vite = await createViteLoader(projectPath);
  console.log(`  ✅ Vite loader ready`);
  
  // 4. 按顺序导入文件（顺序很重要：models → dto → services → pages）
  const importFiles = async (fileList: string[], label: string) => {
    for (const file of fileList) {
      try {
        await vite.ssrLoadModule(file);
        console.log(`    📄 ${path.relative(config.root, file)}`);
      } catch (error) {
        console.error(`    ❌ Failed to import ${path.relative(config.root, file)}:`, (error as Error).message);
      }
    }
    if (fileList.length > 0) {
      console.log(`  ✅ ${label}: ${fileList.length} files loaded`);
    }
  };
  
  console.log(`\n🔄 Importing DSL files...\n`);
  
  await importFiles(files.models, 'Models');
  await importFiles(files.dto, 'DTOs');
  await importFiles(files.repositories, 'Repositories');
  await importFiles(files.services, 'Services');
  await importFiles(files.extensions, 'Extensions');
  await importFiles(files.components, 'Components');
  await importFiles(files.pages, 'Pages');
  
  // 5. 统计
  const stats = {
    models: files.models.length,
    dto: files.dto.length,
    services: files.services.length,
    pages: files.pages.length,
    extensions: files.extensions.length,
    repositories: files.repositories.length,
    components: files.components.length,
    total: 0,
  };
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0) - stats.total;
  
  console.log(`\n✨ DSL project loaded successfully!`);
  console.log(`   Total: ${stats.total} files\n`);
  
  return { config, files, vite, stats };
}
