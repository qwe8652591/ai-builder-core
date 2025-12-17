/**
 * 元数据查看器面板
 * 
 * 在编辑器区域显示元数据详情（类似 dsl-modeler 的效果）
 */

import * as vscode from 'vscode';
import type { AnalyzerResult } from '../services/AnalyzerService';

export class MetadataViewerPanel {
  public static currentPanel: MetadataViewerPanel | undefined;
  private static readonly viewType = 'dsl.metadataViewer';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    metadata: AnalyzerResult | null,
    selectedName?: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 设置 HTML 内容
    this._update(metadata, selectedName);

    // 监听面板销毁
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // 监听消息
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'goToSource':
            if (message.sourceFile) {
              const uri = vscode.Uri.file(message.sourceFile);
              vscode.workspace.openTextDocument(uri).then((doc) => {
                vscode.window.showTextDocument(doc);
              });
            }
            break;
          case 'refresh':
            // 刷新逻辑
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    metadata: AnalyzerResult | null,
    selectedName?: string
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已有面板，直接显示
    if (MetadataViewerPanel.currentPanel) {
      MetadataViewerPanel.currentPanel._panel.reveal(column);
      MetadataViewerPanel.currentPanel._update(metadata, selectedName);
      return;
    }

    // 创建新面板
    const panel = vscode.window.createWebviewPanel(
      MetadataViewerPanel.viewType,
      selectedName ? `📋 ${selectedName}` : '📋 DSL Modeler',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    MetadataViewerPanel.currentPanel = new MetadataViewerPanel(
      panel,
      extensionUri,
      metadata,
      selectedName
    );
  }

  public dispose() {
    MetadataViewerPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update(metadata: AnalyzerResult | null, selectedName?: string) {
    const webview = this._panel.webview;
    this._panel.title = selectedName ? `📋 ${selectedName}` : '📋 DSL Modeler';
    this._panel.webview.html = this._getHtmlForWebview(webview, metadata, selectedName);
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    metadata: AnalyzerResult | null,
    selectedName?: string
  ): string {
    // 查找选中的元数据
    let selectedMeta = null;
    if (selectedName && metadata) {
      const allItems = [
        ...(metadata.entities || []),
        ...(metadata.dtos || []),
        ...(metadata.enums || []),
        ...(metadata.pages || []),
        ...(metadata.components || []),
        ...(metadata.services || []),
        ...(metadata.extensions || []),
      ];
      selectedMeta = allItems.find((item) => item.name === selectedName);
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DSL Modeler</title>
  <style>
    :root {
      --vscode-font-family: var(--vscode-editor-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .header-icon {
      font-size: 32px;
    }
    
    .header-title {
      font-size: 24px;
      font-weight: 600;
    }
    
    .type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .card {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .property-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px 16px;
    }
    
    .property-label {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    
    .property-value {
      font-family: var(--vscode-editor-font-family);
    }
    
    .property-value code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    th {
      background: var(--vscode-editor-background);
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
    }
    
    tr:hover {
      background: var(--vscode-list-hoverBackground);
    }
    
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      margin-right: 4px;
    }
    
    .tag-blue { background: #1890ff; color: white; }
    .tag-green { background: #52c41a; color: white; }
    .tag-orange { background: #fa8c16; color: white; }
    .tag-purple { background: #722ed1; color: white; }
    .tag-red { background: #f5222d; color: white; }
    .tag-cyan { background: #13c2c2; color: white; }
    
    .json-viewer {
      background: var(--vscode-textCodeBlock-background);
      border-radius: 8px;
      padding: 16px;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--vscode-button-border);
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      font-size: 12px;
      cursor: pointer;
    }
    
    .btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  ${selectedMeta ? this._renderMetadata(selectedMeta) : this._renderOverview(metadata)}
  
  <script>
    const vscode = acquireVsCodeApi();
    
    function goToSource(sourceFile) {
      vscode.postMessage({ command: 'goToSource', sourceFile });
    }
  </script>
</body>
</html>`;
  }

  private _renderMetadata(meta: any): string {
    const typeIcons: Record<string, string> = {
      entity: '📦',
      dto: '📤',
      enum: '🏷️',
      page: '📄',
      component: '🧩',
      appService: '🎯',
      extension: '🔗',
    };

    const typeLabels: Record<string, string> = {
      entity: '实体',
      dto: 'DTO',
      enum: '枚举',
      page: '页面',
      component: '组件',
      appService: '应用服务',
      extension: '扩展',
    };

    const icon = typeIcons[meta.__type] || '📋';
    const label = typeLabels[meta.__type] || meta.__type;

    let content = `
      <div class="header">
        <span class="header-icon">${icon}</span>
        <span class="header-title">${meta.name}</span>
        <span class="type-badge">${label}</span>
      </div>
    `;

    // 基本信息
    content += `
      <div class="section">
        <div class="section-title">基本信息</div>
        <div class="card">
          <div class="property-grid">
            <span class="property-label">名称</span>
            <span class="property-value">${meta.name}</span>
            
            <span class="property-label">类型</span>
            <span class="property-value"><span class="tag">${label}</span></span>
    `;

    if (meta.comment || meta.description) {
      content += `
            <span class="property-label">描述</span>
            <span class="property-value">${meta.comment || meta.description}</span>
      `;
    }

    if (meta.route) {
      content += `
            <span class="property-label">路由</span>
            <span class="property-value"><code>${meta.route}</code></span>
      `;
    }

    if (meta.permission) {
      content += `
            <span class="property-label">权限</span>
            <span class="property-value"><code>${meta.permission}</code></span>
      `;
    }

    if (meta.table) {
      content += `
            <span class="property-label">数据表</span>
            <span class="property-value"><code>${meta.table}</code></span>
      `;
    }

    if (meta.sourceFile) {
      const shortPath = meta.sourceFile.split('/').slice(-3).join('/');
      content += `
            <span class="property-label">源文件</span>
            <span class="property-value">
              <button class="btn" onclick="goToSource('${meta.sourceFile}')">
                📂 ${shortPath}
              </button>
            </span>
      `;
    }

    content += `
          </div>
        </div>
      </div>
    `;

    // 字段列表（Entity/DTO）
    if (meta.fields && Object.keys(meta.fields).length > 0) {
      const fields = Object.values(meta.fields);
      content += `
        <div class="section">
          <div class="section-title">字段定义 (${fields.length})</div>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>标签</th>
                  <th>类型</th>
                  <th>必填</th>
                  <th>主键</th>
                </tr>
              </thead>
              <tbody>
                ${(fields as any[]).map((field: any) => `
                  <tr>
                    <td><code>${field.name}</code></td>
                    <td>${field.label || '-'}</td>
                    <td><span class="tag tag-blue">${field.type}</span></td>
                    <td>${field.required ? '✓' : '-'}</td>
                    <td>${field.primaryKey ? '🔑' : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 枚举值
    if (meta.values && meta.values.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">枚举值 (${meta.values.length})</div>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>键</th>
                  <th>值</th>
                  <th>标签</th>
                </tr>
              </thead>
              <tbody>
                ${meta.values.map((v: any) => `
                  <tr>
                    <td><code>${v.key}</code></td>
                    <td>${typeof v.value === 'string' ? `"${v.value}"` : v.value}</td>
                    <td>${v.label ? `<span class="tag" style="background:${v.color || '#999'}">${v.label}</span>` : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 组件/Hooks/服务（Page）
    if (meta.components || meta.hooks || meta.services) {
      content += `
        <div class="section">
          <div class="section-title">依赖分析</div>
          <div class="card">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
      `;

      if (meta.components && meta.components.length > 0) {
        content += `
              <div>
                <div class="property-label" style="margin-bottom: 8px;">🧩 使用的组件</div>
                <div>${meta.components.map((c: string) => `<span class="tag tag-green">${c}</span>`).join('')}</div>
              </div>
        `;
      }

      if (meta.hooks && meta.hooks.length > 0) {
        content += `
              <div>
                <div class="property-label" style="margin-bottom: 8px;">🪝 使用的 Hooks</div>
                <div>${meta.hooks.map((h: string) => `<span class="tag tag-blue">${h}</span>`).join('')}</div>
              </div>
        `;
      }

      if (meta.services && meta.services.length > 0) {
        content += `
              <div>
                <div class="property-label" style="margin-bottom: 8px;">🎯 调用的服务</div>
                <div>${meta.services.map((s: string) => `<span class="tag tag-red">${s}</span>`).join('')}</div>
              </div>
        `;
      }

      content += `
            </div>
          </div>
        </div>
      `;
    }

    // 原始 JSON
    content += `
      <div class="section">
        <div class="section-title">原始 JSON</div>
        <div class="json-viewer">${JSON.stringify(meta, null, 2)}</div>
      </div>
    `;

    return content;
  }

  private _renderOverview(metadata: AnalyzerResult | null): string {
    if (!metadata) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div>未加载元数据</div>
          <div style="margin-top: 8px; font-size: 12px;">请等待项目分析完成</div>
        </div>
      `;
    }

    const stats = [
      { icon: '📦', label: '实体', count: metadata.entities?.length || 0, color: 'blue' },
      { icon: '🏷️', label: '枚举', count: metadata.enums?.length || 0, color: 'purple' },
      { icon: '📄', label: '页面', count: metadata.pages?.length || 0, color: 'cyan' },
      { icon: '🧩', label: '组件', count: metadata.components?.length || 0, color: 'green' },
      { icon: '📤', label: 'DTO', count: metadata.dtos?.length || 0, color: 'orange' },
      { icon: '🎯', label: '服务', count: metadata.services?.length || 0, color: 'red' },
      { icon: '🔗', label: '扩展', count: metadata.extensions?.length || 0, color: 'purple' },
    ];

    return `
      <div class="header">
        <span class="header-icon">🏗️</span>
        <span class="header-title">DSL 项目概览</span>
      </div>
      
      <div class="section">
        <div class="section-title">资源统计</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${stats.filter(s => s.count > 0).map(s => `
            <div class="card" style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 4px;">${s.icon}</div>
              <div style="font-size: 24px; font-weight: 600;">${s.count}</div>
              <div class="property-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="empty-state" style="padding: 40px;">
        <div>在左侧资源目录中选择一个对象查看详情</div>
      </div>
    `;
  }
}


