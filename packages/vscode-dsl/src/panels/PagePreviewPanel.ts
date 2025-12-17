/**
 * 页面预览面板
 * 
 * 在编辑器区域显示页面的实时预览（通过 iframe 嵌入 dsl-runtime）
 */

import * as vscode from 'vscode';

interface PageMetadata {
  name: string;
  route?: string;
  __type: string;
}

export class PagePreviewPanel {
  public static currentPanels: Map<string, PagePreviewPanel> = new Map();
  private static readonly viewType = 'dsl.pagePreview';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    metadata: PageMetadata,
    port: number
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 设置 HTML 内容
    this._update(metadata, port);

    // 监听面板销毁
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    metadata: PageMetadata,
    port: number
  ) {
    const column = vscode.ViewColumn.Beside;

    // 检查是否已有该页面的预览
    const existingPanel = PagePreviewPanel.currentPanels.get(metadata.name);
    if (existingPanel) {
      existingPanel._panel.reveal(column);
      existingPanel._update(metadata, port);
      return;
    }

    // 创建新面板
    const panel = vscode.window.createWebviewPanel(
      PagePreviewPanel.viewType,
      `👁️ ${metadata.name}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const previewPanel = new PagePreviewPanel(panel, extensionUri, metadata, port);
    PagePreviewPanel.currentPanels.set(metadata.name, previewPanel);
  }

  public dispose() {
    // 从 Map 中移除
    for (const [key, value] of PagePreviewPanel.currentPanels) {
      if (value === this) {
        PagePreviewPanel.currentPanels.delete(key);
        break;
      }
    }

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update(metadata: PageMetadata, port: number) {
    const webview = this._panel.webview;
    this._panel.title = `👁️ ${metadata.name}`;
    this._panel.webview.html = this._getHtmlForWebview(metadata, port);
  }

  private _getHtmlForWebview(metadata: PageMetadata, port: number): string {
    // 构建页面 URL
    let route = metadata.route || '/';
    
    // 处理动态路由参数（如 /orders/:id）
    if (route.includes(':')) {
      // 用示例 ID 替换
      route = route.replace(/:([^/]+)/g, 'preview-$1');
    }

    const pageUrl = `http://localhost:${port}/#${route}`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面预览 - ${metadata.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--vscode-titleBar-activeBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    .toolbar-url {
      flex: 1;
      padding: 4px 12px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      color: var(--vscode-input-foreground);
      font-size: 12px;
      font-family: var(--vscode-editor-font-family);
    }
    
    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 14px;
    }
    
    .toolbar-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    
    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: var(--vscode-panel-border);
    }
    
    .device-btn {
      padding: 4px 8px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 12px;
    }
    
    .device-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    
    .device-btn.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    
    .preview-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #1e1e1e;
      overflow: auto;
    }
    
    .preview-frame {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .preview-frame.desktop {
      width: 100%;
      height: 100%;
      max-width: none;
      border-radius: 0;
    }
    
    .preview-frame.tablet {
      width: 768px;
      height: 1024px;
    }
    
    .preview-frame.mobile {
      width: 375px;
      height: 812px;
    }
    
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--vscode-panel-border);
      border-top-color: var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">
      <span>👁️</span>
      <span>${metadata.name}</span>
    </div>
    
    <input class="toolbar-url" type="text" value="${pageUrl}" readonly id="urlInput" />
    
    <button class="toolbar-btn" onclick="copyUrl()" title="复制 URL">📋</button>
    <button class="toolbar-btn" onclick="openInBrowser()" title="在浏览器中打开">🔗</button>
    <button class="toolbar-btn" onclick="refreshPreview()" title="刷新">🔄</button>
    
    <div class="toolbar-divider"></div>
    
    <button class="device-btn active" onclick="setDevice('desktop')" id="btn-desktop">🖥️ 桌面</button>
    <button class="device-btn" onclick="setDevice('tablet')" id="btn-tablet">📱 平板</button>
    <button class="device-btn" onclick="setDevice('mobile')" id="btn-mobile">📱 手机</button>
  </div>
  
  <div class="preview-container">
    <div class="preview-frame desktop" id="previewFrame">
      <div class="loading" id="loading">
        <div class="loading-spinner"></div>
        <div>正在加载页面...</div>
      </div>
      <iframe 
        id="previewIframe" 
        src="${pageUrl}" 
        onload="hideLoading()"
        style="display: none;"
      ></iframe>
    </div>
  </div>
  
  <script>
    const vscode = acquireVsCodeApi();
    const pageUrl = '${pageUrl}';
    
    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('previewIframe').style.display = 'block';
    }
    
    function refreshPreview() {
      const iframe = document.getElementById('previewIframe');
      document.getElementById('loading').style.display = 'flex';
      iframe.style.display = 'none';
      iframe.src = iframe.src;
    }
    
    function copyUrl() {
      navigator.clipboard.writeText(pageUrl);
      // 简单的复制提示
      const btn = event.target;
      const original = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = original, 1000);
    }
    
    function openInBrowser() {
      vscode.postMessage({ command: 'openInBrowser', url: pageUrl });
    }
    
    function setDevice(device) {
      const frame = document.getElementById('previewFrame');
      frame.className = 'preview-frame ' + device;
      
      // 更新按钮状态
      document.querySelectorAll('.device-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById('btn-' + device).classList.add('active');
    }
  </script>
</body>
</html>`;
  }
}


