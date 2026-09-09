import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'output/**', '.playwright-cli/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue,js}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, __MOCK_ENABLED__: 'readonly' },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['src/{views,components,layout,stores}/**/*.{vue,ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'axios', message: '请调用 src/api 的业务接口。' }] },
      ],
    },
  },
  prettier,
)
