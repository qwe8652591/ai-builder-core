#!/usr/bin/env tsx
/**
 * DSL Runtime CLI
 * 
 * 🎯 命令行工具，用于运行 DSL 项目
 * 
 * 使用方式：
 * ```bash
 * # 开发模式
 * dsl-runtime dev [project-path]
 * 
 * # 生产模式
 * dsl-runtime start [project-path]
 * 
 * # 查看元数据
 * dsl-runtime inspect [project-path]
 * ```
 */

// 🎯 注册 tsx loader 以支持 TypeScript 模块导入
import 'tsx/esm';

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { loadDSLProject, loadDSLConfig } from './loader.js';
import { createDevServer } from './server.js';

const program = new Command();

program
  .name('dsl-runtime')
  .description('DSL Runtime - 解析和运行 DSL 项目')
  .version('1.0.0');

/**
 * dev 命令 - 启动开发服务器
 */
program
  .command('dev [project-path]')
  .description('启动开发服务器')
  .option('-p, --port <port>', '端口号（覆盖 dsl.config.ts）')
  .option('-H, --host <host>', '主机地址（覆盖 dsl.config.ts）')
  .action(async (projectPath: string = '.', options) => {
    try {
      const absolutePath = path.resolve(process.cwd(), projectPath);
      
      console.log(chalk.cyan('\n🚀 DSL Runtime - Development Server\n'));
      console.log(chalk.gray(`   Project: ${absolutePath}\n`));
      
      // 加载配置
      const { loadDSLConfig } = await import('./loader.js');
      const config = await loadDSLConfig(absolutePath);
      
      // CLI 参数覆盖配置（仅当明确传入时）
      if (options.port) {
        config.server = { ...config.server, port: parseInt(options.port, 10) };
      }
      if (options.host) {
        config.server = { ...config.server, host: options.host };
      }
      
      // 创建并启动开发服务器
      const server = await createDevServer(config);
      await server.listen();
      
      const address = server.resolvedUrls?.local?.[0] || `http://${config.server.host}:${config.server.port}`;
      
      console.log(chalk.green(`\n✨ Server running at: ${chalk.bold(address)}\n`));
      console.log(chalk.gray('   Press Ctrl+C to stop\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to start dev server:'), error);
      process.exit(1);
    }
  });

/**
 * inspect 命令 - 查看 DSL 元数据
 */
program
  .command('inspect [project-path]')
  .description('查看 DSL 项目的元数据')
  .action(async (projectPath: string = '.') => {
    try {
      const absolutePath = path.resolve(process.cwd(), projectPath);
      
      console.log(chalk.cyan('\n🔍 DSL Runtime - Inspect\n'));
      
      // 加载 DSL 项目
      const { config, files, vite, stats } = await loadDSLProject(absolutePath);
      
      // 通过 Vite 导入 metadata store（确保使用同一个模块实例）
      const { getLayeredStats, metadataStore } = await vite.ssrLoadModule('@qwe8652591/dsl-core') as typeof import('@qwe8652591/dsl-core');
      
      console.log(chalk.green('\n📊 Metadata Statistics:\n'));
      console.log(JSON.stringify(getLayeredStats(), null, 2));
      
      console.log(chalk.green('\n📋 Registered Definitions:\n'));
      const all = metadataStore.getAll();
      all.forEach((meta) => {
        console.log(`  ${meta.__type.padEnd(12)} ${meta.name}`);
      });
      
      // 关闭 Vite 服务器
      await vite.close();
      
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to inspect:'), error);
      process.exit(1);
    }
  });

/**
 * init 命令 - 初始化新的 DSL 项目
 */
program
  .command('init [project-name]')
  .description('初始化一个新的 DSL 项目')
  .action(async (projectName: string = 'my-dsl-project') => {
    console.log(chalk.cyan(`\n📦 Creating new DSL project: ${projectName}\n`));
    console.log(chalk.yellow('   (Not implemented yet)\n'));
  });

program.parse();
