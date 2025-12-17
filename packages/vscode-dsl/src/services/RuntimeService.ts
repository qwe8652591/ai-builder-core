/**
 * DSL Runtime 服务
 * 
 * 管理 dsl-runtime 开发服务器的启动和停止
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export class RuntimeService {
  private process: cp.ChildProcess | null = null;
  private port: number;
  private outputChannel: vscode.OutputChannel;
  private running = false;

  constructor(
    private projectRoot: string,
    private context: vscode.ExtensionContext
  ) {
    const config = vscode.workspace.getConfiguration('dsl');
    this.port = config.get('runtime.port') || 3000;
    
    this.outputChannel = vscode.window.createOutputChannel('DSL Runtime');
    context.subscriptions.push(this.outputChannel);
  }

  /**
   * 启动开发服务器
   */
  async start(): Promise<void> {
    if (this.running) {
      vscode.window.showWarningMessage('开发服务器已在运行中');
      return;
    }

    this.outputChannel.show();
    this.outputChannel.appendLine(`[DSL Runtime] 正在启动开发服务器...`);
    this.outputChannel.appendLine(`[DSL Runtime] 项目路径: ${this.projectRoot}`);
    this.outputChannel.appendLine(`[DSL Runtime] 端口: ${this.port}`);

    return new Promise((resolve, reject) => {
      try {
        // 查找 dsl-runtime 命令
        const npmPath = this.findCommand('dsl-runtime');
        
        if (!npmPath) {
          // 如果没有全局安装，尝试使用 npx
          this.process = cp.spawn('npx', ['dsl-runtime', 'dev', '--port', String(this.port)], {
            cwd: this.projectRoot,
            shell: true,
            env: { ...process.env, FORCE_COLOR: '1' },
          });
        } else {
          this.process = cp.spawn(npmPath, ['dev', '--port', String(this.port)], {
            cwd: this.projectRoot,
            shell: true,
            env: { ...process.env, FORCE_COLOR: '1' },
          });
        }

        this.process.stdout?.on('data', (data) => {
          const text = data.toString();
          this.outputChannel.append(text);
          
          // 检测服务器启动成功
          if (text.includes('开发服务器已启动') || text.includes('localhost')) {
            this.running = true;
            resolve();
          }
        });

        this.process.stderr?.on('data', (data) => {
          this.outputChannel.append(data.toString());
        });

        this.process.on('error', (error) => {
          this.outputChannel.appendLine(`[DSL Runtime] 错误: ${error.message}`);
          this.running = false;
          reject(error);
        });

        this.process.on('exit', (code) => {
          this.outputChannel.appendLine(`[DSL Runtime] 进程退出，代码: ${code}`);
          this.running = false;
          this.process = null;
        });

        // 设置超时
        setTimeout(() => {
          if (!this.running) {
            this.running = true; // 假设已启动
            resolve();
          }
        }, 5000);

      } catch (error) {
        this.outputChannel.appendLine(`[DSL Runtime] 启动失败: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * 停止开发服务器
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    this.outputChannel.appendLine(`[DSL Runtime] 正在停止服务器...`);

    return new Promise((resolve) => {
      if (this.process) {
        // Windows 需要特殊处理
        if (process.platform === 'win32') {
          cp.exec(`taskkill /pid ${this.process.pid} /T /F`);
        } else {
          this.process.kill('SIGTERM');
        }

        this.process.on('exit', () => {
          this.running = false;
          this.process = null;
          this.outputChannel.appendLine(`[DSL Runtime] 服务器已停止`);
          resolve();
        });

        // 强制超时
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          this.running = false;
          this.process = null;
          resolve();
        }, 3000);
      } else {
        resolve();
      }
    });
  }

  /**
   * 检查服务器是否运行中
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * 获取端口
   */
  getPort(): number {
    return this.port;
  }

  /**
   * 获取服务器 URL
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * 查找命令路径
   */
  private findCommand(command: string): string | null {
    try {
      // 首先尝试从项目 node_modules/.bin 查找
      const localBin = path.join(this.projectRoot, 'node_modules', '.bin', command);
      if (require('fs').existsSync(localBin)) {
        return localBin;
      }

      // 尝试使用 which/where 查找
      const result = cp.execSync(
        process.platform === 'win32' ? `where ${command}` : `which ${command}`,
        { encoding: 'utf-8' }
      );
      return result.trim().split('\n')[0];
    } catch {
      return null;
    }
  }
}


