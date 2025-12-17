/**
 * DSL Modeler Server
 * 
 * 独立运行的建模工作台服务器
 * 
 * 支持：
 * - 内置元数据类型（通过 AST 分析）
 * - 自定义元数据类型（通过运行时加载 DSL）
 * - 派生元数据类型（自动计算生成）
 */

import { createServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DynamicTypeConfig, CustomMetadata } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ModelerServerOptions {
  projectPath: string;
  port: number;
  host: string;
  open?: boolean;
}

/** 缓存的动态类型配置 */
let cachedDynamicTypes: DynamicTypeConfig[] = [];
/** 缓存的扩展元数据 */
let cachedExtendedMetadata: Record<string, CustomMetadata[]> = {};
/** Vite 服务器实例（用于 SSR 加载） */
let viteServer: ViteDevServer | null = null;

/**
 * 使用 Vite SSR 加载目标项目的 DSL 定义
 */
async function loadProjectDSLWithVite(projectPath: string): Promise<void> {
  if (!viteServer) {
    console.log('[Modeler] Vite 服务器未就绪，稍后加载 DSL');
    return;
  }
  
  try {
    // 尝试找到并加载目标项目的 DSL 入口
    // 优先加载完整的 dsl/index.ts，这样实体、页面等也会被注册
    const possibleEntries = [
      path.join(projectPath, 'src/dsl/index.ts'),
      path.join(projectPath, 'src/dsl/metadata/index.ts'),
      path.join(projectPath, 'src/metadata/index.ts'),
    ];
    
    let metadataModule: any = null;
    let loaded = false;
    
    for (const entry of possibleEntries) {
      try {
        // 使用 Vite SSR 加载 TypeScript 文件，并获取导出的模块
        metadataModule = await viteServer.ssrLoadModule(entry);
        console.log(`[Modeler] 已加载 DSL 定义: ${entry}`);
        loaded = true;
        break;
      } catch (e) {
        // 部分模块可能加载失败，但其他模块可能已成功注册
        console.log(`[Modeler] 加载 ${entry} 时有部分错误: ${(e as Error).message}`);
        // 继续尝试下一个入口
      }
    }
    
    if (!loaded || !metadataModule) {
      console.log('[Modeler] 未找到 DSL 入口文件，跳过自定义类型加载');
      return;
    }
    
    // 从加载的 metadata 模块获取 metadataStore（确保是同一个实例）
    const { metadataStore, getAllDSLTypes, getDSLTypeConfig } = metadataModule;
    
    if (!metadataStore || !getAllDSLTypes || !getDSLTypeConfig) {
      console.log('[Modeler] metadata 模块未导出必要的 dsl-core 对象');
      return;
    }
    
    const builtinTypes = [
      'entity', 'valueObject', 'aggregate', 'event', 'enum',
      'dto', 'appService', 'service', 'repository',
      'page', 'component', 'hook',
      'extension'
    ];
    
    const allTypes = getAllDSLTypes();
    cachedDynamicTypes = [];
    cachedExtendedMetadata = {};
    
    for (const type of allTypes) {
      if (builtinTypes.includes(type)) continue;
      
      const config = getDSLTypeConfig(type);
      if (config) {
        cachedDynamicTypes.push({
          type,
          layer: config.layer || 'custom',
          subLayer: config.subLayer,
          label: config.label || type,
          icon: config.icon || '📦',
          isDerived: !!config.derivedFrom && config.derivedFrom.length > 0,
          derivedFrom: config.derivedFrom,
        });
        
        // 获取该类型的所有元数据（getByType 返回 Map）
        const itemsMap = metadataStore.getByType(type);
        if (itemsMap && itemsMap.size > 0) {
          cachedExtendedMetadata[type] = Array.from(itemsMap.values()).map((item: any) => ({
            ...item.definition as Record<string, unknown>,
            __type: type,
            name: item.name,
          })) as CustomMetadata[];
        }
      }
    }
    
    if (cachedDynamicTypes.length > 0) {
      console.log(`[Modeler] 发现 ${cachedDynamicTypes.length} 个自定义/派生类型:`);
      cachedDynamicTypes.forEach(t => {
        const count = cachedExtendedMetadata[t.type]?.length || 0;
        console.log(`  - ${t.label} (${t.type}): ${count} 项${t.isDerived ? ' [派生]' : ''}`);
      });
    }
  } catch (e) {
    console.warn('[Modeler] 加载 DSL 定义失败:', (e as Error).message);
  }
}

/**
 * 创建 API 中间件
 */
function createApiMiddleware() {
  return {
    name: 'modeler-api',
    configureServer(server: ViteDevServer) {
      // 动态类型配置端点
      server.middlewares.use('/__ai-builder/types', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(cachedDynamicTypes));
        } else {
          next();
        }
      });
      
      // 扩展元数据端点（自定义 + 派生）
      server.middlewares.use('/__ai-builder/extended', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(cachedExtendedMetadata));
        } else {
          next();
        }
      });
    },
  };
}

/**
 * 创建建模工作台服务器
 */
export async function createModelerServer(options: ModelerServerOptions): Promise<ViteDevServer> {
  const { projectPath, port, host, open } = options;
  
  // 动态导入 vite-plugin-ai-builder
  let aiBuilderPlugin: any;
  try {
    const pluginModule = await import('@qwe8652591/vite-plugin');
    aiBuilderPlugin = pluginModule.aiBuilderPlugin || pluginModule.default;
  } catch (e) {
    console.warn('[Modeler] vite-plugin-ai-builder 未找到，将使用基础模式');
  }
  
  // 获取 modeler UI 入口（开发时用 src，发布后用 dist）
  const modelerRoot = path.resolve(__dirname, '..');
  
  const server = await createServer({
    root: modelerRoot,
    configFile: path.resolve(modelerRoot, 'vite.config.ts'),
    
    plugins: [
      // API 中间件
      createApiMiddleware(),
      // AI Builder 插件（用于分析目标项目）
      aiBuilderPlugin?.({
        projectRoot: projectPath,
        patterns: {
          entities: '**/*.entity.ts',
          dtos: '**/*.dto.ts',
          enums: '**/*.enum.ts',
          pages: '**/*.page.tsx',
          services: '**/*.service.ts',
          extensions: '**/*.extension.ts',
          components: '**/*.component.tsx',
        },
      }),
      // 虚拟模块：注入目标项目路径
      {
        name: 'modeler-config',
        resolveId(id) {
          if (id === 'virtual:modeler-config') {
            return '\0virtual:modeler-config';
          }
        },
        load(id) {
          if (id === '\0virtual:modeler-config') {
            return `export const projectPath = ${JSON.stringify(projectPath)};`;
          }
        },
      },
    ],
    
    server: {
      port,
      host,
      open,
      strictPort: false,
    },
  });
  
  // 保存服务器实例并加载 DSL 定义
  viteServer = server;
  
  // 延迟加载 DSL（等待服务器完全启动）
  setTimeout(async () => {
    await loadProjectDSLWithVite(projectPath);
  }, 1000);
  
  return server;
}

