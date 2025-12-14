module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './examples/*/tsconfig.json'
    ],
  },
  plugins: ['@typescript-eslint', '@ai-builder'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  rules: {
    // 全局规则
    '@typescript-eslint/no-explicit-any': 'error', // 禁止使用 any
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },

  overrides: [
    // ==================== .model.ts 约束 ====================
    {
      files: ['**/*.model.ts'],
      rules: {
        // 分层引用约束
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/*.domain.ts', '**/*.domain'],
              message: '🛑 Model 层不能引用 Domain 层'
            },
            {
              group: ['**/*.app.ts', '**/*.app'],
              message: '🛑 Model 层不能引用 App 层'
            },
            {
              group: ['**/*.view.tsx', '**/*.view'],
              message: '🛑 Model 层不能引用 View 层'
            },
          ]
        }],
        // Model 特定规则
        '@ai-builder/model-fields-only': 'error',
      }
    },

    // ==================== .domain.ts 约束 ====================
    {
      files: ['**/*.domain.ts'],
      rules: {
        // 分层引用约束
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/*.app.ts', '**/*.app'],
              message: '🛑 Domain 层不能引用 App 层'
            },
            {
              group: ['**/*.view.tsx', '**/*.view'],
              message: '🛑 Domain 层不能引用 View 层'
            },
            {
              group: ['**/dal/**', '**/repo/**', '**/mapper/**'],
              message: '🛑 Domain 层不能引用数据访问层'
            },
            {
              group: ['axios', 'node-fetch', 'got', 'superagent'],
              message: '🛑 Domain 层禁止进行 HTTP 请求'
            },
            {
              group: ['fs', 'fs/promises', 'path', 'child_process'],
              message: '🛑 Domain 层禁止进行文件/系统操作'
            },
          ]
        }],
        // Domain 特定规则
        '@ai-builder/no-async-in-domain': 'error',
        '@ai-builder/no-this-in-domain': 'error',
      }
    },

    // ==================== .app.ts 约束 ====================
    {
      files: ['**/*.app.ts'],
      rules: {
        // 分层引用约束
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/*.view.tsx', '**/*.view'],
              message: '🛑 App 层不能引用 View 层'
            },
            {
              group: ['vue', 'react', 'react-dom', '@vue/*'],
              message: '🛑 App 层不能引用前端框架'
            },
          ]
        }],
        // App 特定规则
        '@ai-builder/use-inject-decorator': 'warn',
        '@ai-builder/action-return-type': 'error',
      }
    },

    // ==================== .view.tsx 约束 ====================
    {
      files: ['**/*.view.tsx', '**/*.ui.ts'],
      rules: {
        // 分层引用约束
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/dal/**', '**/repo/**', '**/mapper/**'],
              message: '🛑 View 层不能直接访问数据库'
            },
            {
              group: ['@ai-builder/runtime'],
              message: '🛑 UI DSL 不能直接引用 runtime（纯类型定义包）'
            },
          ]
        }],
      }
    },

    // ==================== tests 目录放宽限制 ====================
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@ai-builder/no-async-in-domain': 'off',
        '@ai-builder/no-this-in-domain': 'off',
      }
    },

    // ==================== examples 目录放宽限制 ====================
    {
      files: ['examples/**/*.ts', 'examples/**/*.tsx'],
      rules: {
        '@ai-builder/use-inject-decorator': 'off',
      }
    },
  ],
};

