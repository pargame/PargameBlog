import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
  // TS-aware 규칙을 사용하고 언더스코어 접두사 인수를 허용합니다.
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
  'sort-imports': ['warn', { ignoreDeclarationSort: true, allowSeparatedGroups: true }],
  // 대부분의 장소에서 console의 직접 사용을 금지 — logger 유틸 사용을 강제합니다.
  'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // 로거 구현 파일 내부에서 console 사용을 허용하여 console로 포워드할 수 있도록 합니다.
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
])
