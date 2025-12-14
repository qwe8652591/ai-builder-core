/**
 * 文件监听脚本 - 自动生成 Kysely Schema
 * 
 * 监听领域模型文件变化，自动运行生成命令
 */

import * as chokidar from 'chokidar';
import { exec } from 'child_process';
import * as path from 'path';

// 监听的文件模式
const watchPattern = 'src/domain/**/*.model.ts';

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 1000;

let debounceTimer: NodeJS.Timeout | null = null;
let isGenerating = false;

/**
 * 执行生成命令
 */
function generateSchema() {
  if (isGenerating) {
    console.log('⏳ 生成中，跳过本次触发...');
    return;
  }

  isGenerating = true;
  console.log('\n🔄 检测到领域模型变化，开始生成 Kysely Schema...\n');

  exec('pnpm gen:kysely', (error, stdout, stderr) => {
    isGenerating = false;

    if (error) {
      console.error('❌ 生成失败：', error.message);
      return;
    }

    if (stderr) {
      console.error('⚠️  警告：', stderr);
    }

    console.log(stdout);
    console.log('✅ 生成完成！继续监听文件变化...\n');
  });
}

/**
 * 防抖处理
 */
function debouncedGenerate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    generateSchema();
  }, DEBOUNCE_DELAY);
}

/**
 * 启动文件监听
 */
function startWatching() {
  console.log('👀 开始监听领域模型文件变化...');
  console.log(`📁 监听模式：${watchPattern}\n`);

  const watcher = chokidar.watch(watchPattern, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    ignoreInitial: true, // 忽略初始文件
  });

  watcher
    .on('add', (filePath) => {
      console.log(`📄 新增文件：${path.relative(process.cwd(), filePath)}`);
      debouncedGenerate();
    })
    .on('change', (filePath) => {
      console.log(`📝 修改文件：${path.relative(process.cwd(), filePath)}`);
      debouncedGenerate();
    })
    .on('unlink', (filePath) => {
      console.log(`🗑️  删除文件：${path.relative(process.cwd(), filePath)}`);
      debouncedGenerate();
    })
    .on('error', (error) => {
      console.error('❌ 监听错误：', error);
    });

  // 首次启动时生成一次
  console.log('🚀 首次启动，生成 Kysely Schema...\n');
  generateSchema();

  // 监听进程退出信号
  process.on('SIGINT', () => {
    console.log('\n\n👋 停止监听，再见！');
    watcher.close();
    process.exit(0);
  });
}

// 启动监听
startWatching();

