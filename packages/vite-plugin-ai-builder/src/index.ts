/**
 * Vite plugin for ai-builder DSL transformation and AST analysis
 * 
 * 功能：
 * 1. 自动将 DSL 导入替换为 runtime-renderer 实现
 * 2. AST 静态分析项目中的所有 DSL 定义
 * 3. 提供虚拟模块 `virtual:ai-builder-metadata` 访问元数据
 */

import type { Plugin, ViteDevServer } from 'vite';
import * as path from 'path';
import { analyzeProject, analyzeFile, toRuntimeMetadata, type AnalyzerResult } from './analyzers';

// 虚拟模块 ID
const VIRTUAL_MODULE_ID = 'virtual:ai-builder-metadata';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface AiBuilderPluginOptions {
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
  
  /**
   * 是否启用 AST 分析
   * @default true
   */
  enableAnalyzer?: boolean;
  
  /**
   * 自定义 import 映射
   */
  importMappings?: Record<string, string>;
  
  /**
   * 项目根目录（用于 AST 分析）
   */
  projectRoot?: string;
}

export function aiBuilderPlugin(options: AiBuilderPluginOptions = {}): Plugin {
  const {
    debug = false,
    enableAnalyzer = true,
    importMappings = {},
  } = options;

  // 默认的 import 映射规则（注意：不要映射 @qwe8652591/std-ui，它由 dsl-runtime 的 resolve.alias 处理）
  const defaultMappings: Record<string, string> = {
    '@ai-builder/dsl/ui': '@ai-builder/runtime-renderer/react',
  };

  const allMappings = { ...defaultMappings, ...importMappings };
  
  // 项目元数据（AST 分析结果）
  let projectMetadata: AnalyzerResult | null = null;
  let projectRoot = '';
  let server: ViteDevServer | null = null;

  return {
    name: 'vite-plugin-ai-builder',
    
    enforce: 'pre', // 在其他插件之前运行
    
    /**
     * 配置钩子 - 获取项目根目录
     */
    configResolved(config) {
      projectRoot = options.projectRoot || config.root;
      if (debug) {
        console.log('[ai-builder] Project root:', projectRoot);
      }
    },
    
    /**
     * 开发服务器配置
     */
    configureServer(_server) {
      server = _server;
      
      // 提供 API 端点获取元数据
      server.middlewares.use('/__ai-builder/metadata', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (!projectMetadata) {
          res.end(JSON.stringify({ error: 'Metadata not ready' }));
          return;
        }
        
        res.end(JSON.stringify(projectMetadata, null, 2));
      });
      
      // 提供 API 端点获取运行时格式的元数据
      server.middlewares.use('/__ai-builder/runtime-metadata', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (!projectMetadata) {
          res.end(JSON.stringify({ error: 'Metadata not ready' }));
          return;
        }
        
        const runtimeMetadata = toRuntimeMetadata(projectMetadata);
        res.end(JSON.stringify(runtimeMetadata, null, 2));
      });
    },
    
    /**
     * 构建开始 - 执行 AST 分析
     */
    async buildStart() {
      if (!enableAnalyzer) return;
      
      try {
        console.log('[ai-builder] 开始 AST 分析...');
        projectMetadata = await analyzeProject(projectRoot);
        
        if (debug) {
          console.log('[ai-builder] AST 分析结果:', JSON.stringify(projectMetadata, null, 2));
        }
      } catch (e) {
        console.error('[ai-builder] AST 分析失败:', e);
      }
    },
    
    /**
     * 解析虚拟模块
     */
    resolveId(source) {
      if (source === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      
      // 处理 import 映射
      for (const [from, to] of Object.entries(allMappings)) {
        if (source === from) {
          if (debug) {
            console.log(`[ai-builder] Resolving: ${from} -> ${to}`);
          }
          return to;
        }
      }
      
      return null;
    },
    
    /**
     * 加载虚拟模块
     */
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // 确保元数据已加载
        if (!projectMetadata && enableAnalyzer) {
          projectMetadata = await analyzeProject(projectRoot);
        }
        
        // 生成虚拟模块代码
        const code = `
// 由 vite-plugin-ai-builder 自动生成
// 项目 AST 分析结果

export const metadata = ${JSON.stringify(projectMetadata || {}, null, 2)};

export const entities = ${JSON.stringify(projectMetadata?.entities || [], null, 2)};

export const dtos = ${JSON.stringify(projectMetadata?.dtos || [], null, 2)};

export const enums = ${JSON.stringify(projectMetadata?.enums || [], null, 2)};

export const pages = ${JSON.stringify(projectMetadata?.pages || [], null, 2)};

export const services = ${JSON.stringify(projectMetadata?.services || [], null, 2)};

export const extensions = ${JSON.stringify(projectMetadata?.extensions || [], null, 2)};

// 运行时格式的元数据（用于注入到 Metadata Store）
export const runtimeMetadata = ${JSON.stringify(projectMetadata ? toRuntimeMetadata(projectMetadata) : [], null, 2)};

export default metadata;
`;
        
        return code;
      }
      
      return null;
    },
    
    /**
     * 转换代码
     */
    transform(code, id) {
      // 只处理 .view.tsx 文件
      if (!id.endsWith('.view.tsx')) {
        return null;
      }

      if (debug) {
        console.log('[ai-builder] Transforming:', id);
      }

      let transformed = code;
      let hasChanges = false;

      // 替换 import 语句
      for (const [from, to] of Object.entries(allMappings)) {
        const regex = new RegExp(
          `from\\s+['"\`]${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`,
          'g'
        );
        
        if (regex.test(transformed)) {
          transformed = transformed.replace(regex, `from '${to}'`);
          hasChanges = true;
          
          if (debug) {
            console.log(`  [ai-builder] Replaced: ${from} -> ${to}`);
          }
        }
      }

      // 移除 definePage 包装（简化处理，保持函数组件格式）
      const definePageRegex = /export\s+default\s+definePage\(\s*({[^}]*})\s*,\s*\(/g;
      if (definePageRegex.test(transformed)) {
        transformed = transformed.replace(
          definePageRegex,
          'export default function Page('
        );
        hasChanges = true;
        
        if (debug) {
          console.log('  [ai-builder] Simplified definePage wrapper');
        }
      }

      if (hasChanges) {
        return {
          code: transformed,
          map: null,
        };
      }

      return null;
    },
    
    /**
     * 热更新处理 - 文件变化时重新分析
     */
    async handleHotUpdate({ file, server }) {
      if (!enableAnalyzer) return;
      
      // 检查是否是 DSL 相关文件
      const isDSLFile = file.match(/\.(entity|dto|page|ext|appservice)\.(ts|tsx)$/);
      
      if (isDSLFile) {
        if (debug) {
          console.log('[ai-builder] DSL 文件变化，重新分析:', file);
        }
        
        // 重新分析整个项目
        try {
          projectMetadata = await analyzeProject(projectRoot);
          
          // 使虚拟模块失效，触发重新加载
          const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (module) {
            server.moduleGraph.invalidateModule(module);
          }
          
          // 通知客户端刷新
          server.ws.send({
            type: 'custom',
            event: 'ai-builder:metadata-updated',
            data: {
              file,
              timestamp: Date.now(),
            },
          });
        } catch (e) {
          console.error('[ai-builder] 热更新分析失败:', e);
        }
      }
    },

    /**
     * 配置解析别名
     */
    config() {
      return {
        resolve: {
          alias: Object.entries(allMappings).map(([find, replacement]) => ({
            find,
            replacement,
          })),
        },
      };
    },
  };
}

// 导出分析器供外部使用
export { analyzeProject, analyzeFile, toRuntimeMetadata };
export type { AnalyzerResult } from './analyzers';

export default aiBuilderPlugin;
