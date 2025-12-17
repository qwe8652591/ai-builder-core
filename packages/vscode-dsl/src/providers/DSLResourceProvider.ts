/**
 * DSL 资源树提供者
 * 
 * 在侧边栏显示项目中的所有 DSL 资源
 */

import * as vscode from 'vscode';
import { AnalyzerService, AnyMetadata } from '../services/AnalyzerService';

// 层级配置
const layerConfig = {
  domain: {
    title: '领域层',
    icon: 'symbol-namespace',
    subLayers: {
      entities: { title: '实体', icon: 'symbol-class', dataKey: 'entities' as const },
      enums: { title: '枚举', icon: 'symbol-enum', dataKey: 'enums' as const },
    },
  },
  presentation: {
    title: '表现层',
    icon: 'symbol-interface',
    subLayers: {
      pages: { title: '页面', icon: 'file', dataKey: 'pages' as const },
      components: { title: '组件', icon: 'symbol-method', dataKey: 'components' as const },
    },
  },
  application: {
    title: '应用层',
    icon: 'symbol-function',
    subLayers: {
      dtos: { title: 'DTO', icon: 'symbol-struct', dataKey: 'dtos' as const },
      services: { title: '服务', icon: 'symbol-event', dataKey: 'services' as const },
    },
  },
  infrastructure: {
    title: '基础设施层',
    icon: 'extensions',
    subLayers: {
      extensions: { title: '扩展', icon: 'symbol-property', dataKey: 'extensions' as const },
    },
  },
};

export class DSLResourceProvider implements vscode.TreeDataProvider<DSLTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DSLTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private analyzerService: AnalyzerService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DSLTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: DSLTreeItem): Promise<DSLTreeItem[]> {
    const metadata = this.analyzerService.getMetadata();
    
    if (!metadata) {
      return [];
    }

    // 根节点：显示层级
    if (!element) {
      return Object.entries(layerConfig).map(([key, config]) => {
        // 计算该层级下的总数
        let totalCount = 0;
        Object.values(config.subLayers).forEach(subLayer => {
          const items = (metadata as any)[subLayer.dataKey] || [];
          totalCount += items.length;
        });

        return new DSLTreeItem(
          config.title,
          vscode.TreeItemCollapsibleState.Expanded,
          {
            type: 'layer',
            layerKey: key,
            icon: config.icon,
            count: totalCount,
          }
        );
      }).filter(item => item.data.count > 0);
    }

    // 层级节点：显示子层级
    if (element.data.type === 'layer') {
      const layer = layerConfig[element.data.layerKey as keyof typeof layerConfig];
      
      return Object.entries(layer.subLayers).map(([key, subLayer]) => {
        const items = (metadata as any)[subLayer.dataKey] || [];
        
        return new DSLTreeItem(
          subLayer.title,
          items.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
          {
            type: 'subLayer',
            subLayerKey: key,
            dataKey: subLayer.dataKey,
            icon: subLayer.icon,
            count: items.length,
          }
        );
      }).filter(item => item.data.count > 0);
    }

    // 子层级节点：显示具体资源
    if (element.data.type === 'subLayer') {
      const items = (metadata as any)[element.data.dataKey] || [];
      
      return items.map((item: AnyMetadata) => {
        return new DSLTreeItem(
          item.name,
          vscode.TreeItemCollapsibleState.None,
          {
            type: 'item',
            itemType: item.__type,
            metadata: item,
            icon: this.getItemIcon(item.__type),
          }
        );
      });
    }

    return [];
  }

  private getItemIcon(type: string): string {
    const icons: Record<string, string> = {
      entity: 'database',
      dto: 'symbol-struct',
      enum: 'symbol-enum',
      page: 'file',
      component: 'symbol-method',
      appService: 'symbol-event',
      extension: 'extensions',
    };
    return icons[type] || 'symbol-misc';
  }
}

export class DSLTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data: {
      type: 'layer' | 'subLayer' | 'item';
      layerKey?: string;
      subLayerKey?: string;
      dataKey?: string;
      itemType?: string;
      metadata?: AnyMetadata;
      icon?: string;
      count?: number;
    }
  ) {
    super(label, collapsibleState);

    // 设置图标
    if (data.icon) {
      this.iconPath = new vscode.ThemeIcon(data.icon);
    }

    // 设置描述（显示数量）
    if (data.count !== undefined && data.count > 0) {
      this.description = `(${data.count})`;
    }

    // 设置上下文值（用于菜单显示）
    if (data.type === 'item' && data.itemType) {
      this.contextValue = data.itemType;
    }

    // 设置 tooltip
    if (data.metadata) {
      const meta = data.metadata;
      let tooltip = `${meta.name}\n类型: ${meta.__type}`;
      
      if ('comment' in meta && meta.comment) {
        tooltip += `\n描述: ${meta.comment}`;
      }
      if ('route' in meta && meta.route) {
        tooltip += `\n路由: ${meta.route}`;
      }
      if ('sourceFile' in meta && meta.sourceFile) {
        tooltip += `\n文件: ${meta.sourceFile.split('/').slice(-2).join('/')}`;
      }
      
      this.tooltip = tooltip;
    }

    // 设置点击命令
    if (data.type === 'item') {
      this.command = {
        command: 'dsl.viewMetadata',
        title: '查看元数据',
        arguments: [this],
      };
    }
  }
}


