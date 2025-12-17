/**
 * 运行状态树提供者
 * 
 * 显示 DSL Runtime 的运行状态
 */

import * as vscode from 'vscode';
import { RuntimeService } from '../services/RuntimeService';

export class RuntimeStatusProvider implements vscode.TreeDataProvider<StatusTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private runtimeService: RuntimeService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: StatusTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: StatusTreeItem): Promise<StatusTreeItem[]> {
    if (element) {
      return [];
    }

    const isRunning = this.runtimeService.isRunning();
    const port = this.runtimeService.getPort();

    const items: StatusTreeItem[] = [
      new StatusTreeItem(
        isRunning ? '运行中' : '已停止',
        isRunning ? 'pass' : 'circle-slash',
        isRunning ? `http://localhost:${port}` : '点击启动服务器'
      ),
    ];

    if (isRunning) {
      items.push(
        new StatusTreeItem(
          `端口: ${port}`,
          'globe',
          '开发服务器端口'
        ),
        new StatusTreeItem(
          '打开浏览器',
          'link-external',
          `http://localhost:${port}`,
          {
            command: 'vscode.open',
            title: '打开浏览器',
            arguments: [vscode.Uri.parse(`http://localhost:${port}`)],
          }
        )
      );
    }

    return items;
  }
}

class StatusTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    icon: string,
    description?: string,
    command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    
    this.iconPath = new vscode.ThemeIcon(icon);
    this.description = description;
    
    if (command) {
      this.command = command;
    }
  }
}


