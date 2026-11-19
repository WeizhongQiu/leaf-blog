// @ts-check
import { builtinModules } from 'node:module'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import solid from 'eslint-plugin-solid'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['*.{js,ts}', 'build/**/*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    ...solid.configs['flat/typescript'],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    rules: {
      ...solid.configs['flat/typescript'].rules,
      'no-restricted-imports': [
        'error',
        {
          paths: builtinModules.map((name) => ({
            name,
            message: 'Browser code must not import built-in Node.js modules.',
          })),
          patterns: [
            {
              group: ['node:*', '**/build/**', '**/vite.config*'],
              message:
                'Browser code must not import Node.js or build-time modules.',
            },
          ],
        },
      ],
    },
  },
  prettier,
)
