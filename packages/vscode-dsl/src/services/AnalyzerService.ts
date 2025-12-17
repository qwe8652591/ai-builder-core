/**
 * AST 分析服务
 * 
 * 使用 vite-plugin-ai-builder 的分析能力
 */

import * as vscode from 'vscode';
import { analyzeProject, type AnalyzerResult } from '@qwe8652591/vite-plugin';

// 重新导出类型
export type { AnalyzerResult };

export interface AnyMetadata {
  __type: string;
  name: string;
  comment?: string;
  description?: string;
  sourceFile?: string;
  route?: string;
  permission?: string;
  table?: string;
  target?: string;
  [key: string]: unknown;
}

export class AnalyzerService {
  private metadata: AnalyzerResult | null = null;
  private analyzing = false;

  constructor(private projectRoot: string) {}

  /**
   * 执行 AST 分析
   */
  async analyze(): Promise<AnalyzerResult | null> {
    if (this.analyzing) {
      console.log('[AnalyzerService] 分析正在进行中，跳过');
      return this.metadata;
    }

    this.analyzing = true;
    console.log('[AnalyzerService] 开始分析项目:', this.projectRoot);

    try {
      // 使用 vite-plugin 的分析功能
      this.metadata = await analyzeProject(this.projectRoot);
      
      console.log('[AnalyzerService] 分析完成:', {
        entities: this.metadata?.entities?.length || 0,
        dtos: this.metadata?.dtos?.length || 0,
        enums: this.metadata?.enums?.length || 0,
        pages: this.metadata?.pages?.length || 0,
        components: this.metadata?.components?.length || 0,
        services: this.metadata?.services?.length || 0,
        extensions: this.metadata?.extensions?.length || 0,
      });

      return this.metadata;
    } catch (error) {
      console.error('[AnalyzerService] 分析失败:', error);
      vscode.window.showErrorMessage(`DSL 分析失败: ${error}`);
      return null;
    } finally {
      this.analyzing = false;
    }
  }

  /**
   * 获取当前元数据
   */
  getMetadata(): AnalyzerResult | null {
    return this.metadata;
  }

  /**
   * 获取指定类型的元数据
   */
  getMetadataByType<T extends AnyMetadata>(type: string): T[] {
    if (!this.metadata) {
      return [];
    }

    const typeMap: Record<string, keyof AnalyzerResult> = {
      entity: 'entities',
      dto: 'dtos',
      enum: 'enums',
      page: 'pages',
      component: 'components',
      appService: 'services',
      extension: 'extensions',
    };

    const key = typeMap[type];
    if (key) {
      return (this.metadata[key] as T[]) || [];
    }

    return [];
  }

  /**
   * 根据名称查找元数据
   */
  findByName(name: string): AnyMetadata | null {
    if (!this.metadata) {
      return null;
    }

    // 遍历所有类型查找
    const allItems = [
      ...(this.metadata.entities || []),
      ...(this.metadata.dtos || []),
      ...(this.metadata.enums || []),
      ...(this.metadata.pages || []),
      ...(this.metadata.components || []),
      ...(this.metadata.services || []),
      ...(this.metadata.extensions || []),
    ];

    return allItems.find(item => item.name === name) || null;
  }
}


