/**
 * DSL Modeler CLI
 * 
 * 🏗️ 元数据建模工作台命令行工具
 * 
 * 使用方式：
 * ```bash
 * # 启动建模工作台（分析当前目录）
 * dsl-modeler
 * 
 * # 启动建模工作台（指定项目路径）
 * dsl-modeler dev [project-path]
 * 
 * # 指定端口
 * dsl-modeler dev --port 4000
 * 
 * # 查看帮助
 * dsl-modeler --help
 * ```
 */

import 'tsx/esm';

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';

const program = new Command();

program
  .name('dsl-modeler')
  .description('DSL Modeler - 元数据建模工作台')
  .version('0.1.0');

/**
 * dev 命令 - 启动建模工作台
 */
program
  .command('dev [project-path]', { isDefault: true })
  .description('启动元数据建模工作台')
  .option('-p, --port <port>', '端口号', '4000')
  .option('-H, --host <host>', '主机地址', 'localhost')
  .option('-o, --open', '自动打开浏览器', false)
  .action(async (projectPath: string = '.', options) => {
    try {
      const absolutePath = path.resolve(process.cwd(), projectPath);
      const port = parseInt(options.port, 10);
      const host = options.host;
      
      console.log(chalk.cyan('\n🏗️  DSL Modeler - 元数据建模工作台\n'));
      console.log(chalk.gray(`   项目路径: ${absolutePath}`));
      console.log(chalk.gray(`   服务地址: http://${host}:${port}\n`));
      
      // 动态导入服务器模块
      const { createModelerServer } = await import('./server.js');
      
      // 创建并启动服务器
      const server = await createModelerServer({
        projectPath: absolutePath,
        port,
        host,
        open: options.open,
      });
      
      await server.listen();
      
      const address = server.resolvedUrls?.local?.[0] || `http://${host}:${port}`;
      
      console.log(chalk.green(`\n✨ 建模工作台已启动: ${chalk.bold(address)}\n`));
      console.log(chalk.gray('   按 Ctrl+C 停止服务\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ 启动失败:'), error);
      process.exit(1);
    }
  });

/**
 * analyze 命令 - 仅分析元数据（不启动服务器）
 */
program
  .command('analyze [project-path]')
  .description('分析项目元数据并输出 JSON')
  .option('-o, --output <file>', '输出到文件')
  .action(async (projectPath: string = '.', options) => {
    try {
      const absolutePath = path.resolve(process.cwd(), projectPath);
      
      console.log(chalk.cyan('\n🔍 DSL Modeler - 分析元数据\n'));
      console.log(chalk.gray(`   项目路径: ${absolutePath}\n`));
      
      // 使用 vite-plugin-ai-builder 的分析能力
      const { analyzeProject } = await import('@qwe8652591/vite-plugin');
      
      const result = await analyzeProject(absolutePath);
      
      // 统计信息
      console.log(chalk.green('\n📊 分析结果:\n'));
      console.log(`   实体:     ${result.entities.length}`);
      console.log(`   DTO:      ${result.dtos.length}`);
      console.log(`   枚举:     ${result.enums.length}`);
      console.log(`   页面:     ${result.pages.length}`);
      console.log(`   组件:     ${result.components.length}`);
      console.log(`   服务:     ${result.services.length}`);
      console.log(`   扩展:     ${result.extensions.length}`);
      
      // 输出 JSON
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(result, null, 2));
        console.log(chalk.green(`\n✅ 已保存到: ${options.output}\n`));
      } else {
        console.log(chalk.gray('\n--- JSON 输出 ---\n'));
        console.log(JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ 分析失败:'), error);
      process.exit(1);
    }
  });

program.parse();

