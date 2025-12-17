/**
 * AI Builder DSL VS Code 扩展
 * 
 * 功能：
 * 1. Activity Bar 图标 + 专属侧边栏显示 DSL 资源目录
 * 2. 点击资源在编辑器区域展示内容或预览
 * 3. 集成 dsl-runtime 和 dsl-modeler 能力
 */

import * as vscode from 'vscode';
import { DSLResourceProvider } from './providers/DSLResourceProvider';
import { RuntimeStatusProvider } from './providers/RuntimeStatusProvider';
import { RuntimeService } from './services/RuntimeService';
import { AnalyzerService } from './services/AnalyzerService';
import { MetadataViewerPanel } from './panels/MetadataViewerPanel';
import { PagePreviewPanel } from './panels/PagePreviewPanel';

let runtimeService: RuntimeService;
let analyzerService: AnalyzerService;
let resourceProvider: DSLResourceProvider;
let statusProvider: RuntimeStatusProvider;

export async function activate(context: vscode.ExtensionContext) {
  console.log('[DSL Extension] 正在激活...');

  // 检查是否是 DSL 项目
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log('[DSL Extension] 未打开工作区');
    return;
  }

  const projectRoot = workspaceFolders[0].uri.fsPath;

  // 初始化服务
  analyzerService = new AnalyzerService(projectRoot);
  runtimeService = new RuntimeService(projectRoot, context);

  // 初始化树视图提供者
  resourceProvider = new DSLResourceProvider(analyzerService);
  statusProvider = new RuntimeStatusProvider(runtimeService);

  // 注册树视图
  const resourceTreeView = vscode.window.createTreeView('dsl-resources', {
    treeDataProvider: resourceProvider,
    showCollapseAll: true,
  });

  const statusTreeView = vscode.window.createTreeView('dsl-runtime-status', {
    treeDataProvider: statusProvider,
  });

  // 设置上下文
  vscode.commands.executeCommand('setContext', 'dsl.hasProject', true);
  vscode.commands.executeCommand('setContext', 'dsl.runtimeRunning', false);

  // 注册命令
  const commands = [
    // 启动开发服务器
    vscode.commands.registerCommand('dsl.startRuntime', async () => {
      try {
        await runtimeService.start();
        vscode.commands.executeCommand('setContext', 'dsl.runtimeRunning', true);
        statusProvider.refresh();
        vscode.window.showInformationMessage('DSL 开发服务器已启动');
      } catch (error) {
        vscode.window.showErrorMessage(`启动失败: ${error}`);
      }
    }),

    // 停止开发服务器
    vscode.commands.registerCommand('dsl.stopRuntime', async () => {
      try {
        await runtimeService.stop();
        vscode.commands.executeCommand('setContext', 'dsl.runtimeRunning', false);
        statusProvider.refresh();
        vscode.window.showInformationMessage('DSL 开发服务器已停止');
      } catch (error) {
        vscode.window.showErrorMessage(`停止失败: ${error}`);
      }
    }),

    // 刷新资源
    vscode.commands.registerCommand('dsl.refreshResources', async () => {
      await analyzerService.analyze();
      resourceProvider.refresh();
      vscode.window.showInformationMessage('DSL 资源已刷新');
    }),

    // 预览页面
    vscode.commands.registerCommand('dsl.previewPage', async (item) => {
      if (!item?.metadata) {
        vscode.window.showWarningMessage('请先选择一个页面');
        return;
      }

      // 确保 runtime 正在运行
      if (!runtimeService.isRunning()) {
        const choice = await vscode.window.showInformationMessage(
          '需要先启动开发服务器才能预览页面',
          '启动服务器'
        );
        if (choice === '启动服务器') {
          await vscode.commands.executeCommand('dsl.startRuntime');
        } else {
          return;
        }
      }

      // 打开预览面板
      PagePreviewPanel.createOrShow(
        context.extensionUri,
        item.metadata,
        runtimeService.getPort()
      );
    }),

    // 在 Modeler 中打开
    vscode.commands.registerCommand('dsl.openInModeler', async (item) => {
      const metadata = item?.metadata || analyzerService.getMetadata();
      MetadataViewerPanel.createOrShow(
        context.extensionUri,
        metadata,
        item?.metadata?.name
      );
    }),

    // 查看元数据
    vscode.commands.registerCommand('dsl.viewMetadata', async (item) => {
      if (!item?.metadata) {
        vscode.window.showWarningMessage('请先选择一个资源');
        return;
      }

      MetadataViewerPanel.createOrShow(
        context.extensionUri,
        analyzerService.getMetadata(),
        item.metadata.name
      );
    }),

    // 跳转到源码
    vscode.commands.registerCommand('dsl.goToSource', async (item) => {
      if (!item?.metadata?.sourceFile) {
        vscode.window.showWarningMessage('未找到源文件');
        return;
      }

      const uri = vscode.Uri.file(item.metadata.sourceFile);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    }),
  ];

  // 添加到订阅列表
  context.subscriptions.push(
    resourceTreeView,
    statusTreeView,
    ...commands
  );

  // 初始分析
  try {
    await analyzerService.analyze();
    resourceProvider.refresh();
    console.log('[DSL Extension] 初始分析完成');
  } catch (error) {
    console.error('[DSL Extension] 初始分析失败:', error);
  }

  // 监听文件变化
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx}');
  watcher.onDidChange(() => {
    // 防抖处理
    setTimeout(() => {
      analyzerService.analyze().then(() => resourceProvider.refresh());
    }, 500);
  });
  context.subscriptions.push(watcher);

  // 自动启动 Runtime（如果配置了）
  const config = vscode.workspace.getConfiguration('dsl');
  if (config.get('runtime.autoStart')) {
    vscode.commands.executeCommand('dsl.startRuntime');
  }

  console.log('[DSL Extension] 激活完成');
}

export function deactivate() {
  console.log('[DSL Extension] 正在停用...');
  
  if (runtimeService) {
    runtimeService.stop();
  }
}


