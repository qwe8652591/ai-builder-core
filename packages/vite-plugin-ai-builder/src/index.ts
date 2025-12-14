/**
 * Vite plugin for ai-builder DSL transformation
 * 自动将 DSL 导入替换为 runtime-renderer 实现
 */

import type { Plugin } from 'vite';

export interface AiBuilderPluginOptions {
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
  
  /**
   * 自定义 import 映射
   */
  importMappings?: Record<string, string>;
}

export function aiBuilderPlugin(options: AiBuilderPluginOptions = {}): Plugin {
  const {
    debug = false,
    importMappings = {},
  } = options;

  // 默认的 import 映射规则
  const defaultMappings: Record<string, string> = {
    '@ai-builder/dsl/ui': '@ai-builder/runtime-renderer/react',
    '@ai-builder/std-ui': '@ai-builder/runtime-renderer/react',
  };

  const allMappings = { ...defaultMappings, ...importMappings };

  return {
    name: 'vite-plugin-ai-builder',
    
    enforce: 'pre', // 在其他插件之前运行
    
    /**
     * 解析模块 ID
     */
    resolveId(source, importer) {
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
      // 这里只是简单的转换示例，实际编译器会做更复杂的 AST 转换
      const definePageRegex = /export\s+default\s+definePage\(\s*({[^}]*})\s*,\s*\(/g;
      if (definePageRegex.test(transformed)) {
        // 简化版本：将 definePage(meta, () => {...}) 转为 export default function Page() {...}
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
          map: null, // TODO: 生成 source map
        };
      }

      return null;
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

export default aiBuilderPlugin;

