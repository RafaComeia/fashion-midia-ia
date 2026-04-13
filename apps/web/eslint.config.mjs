import { sharedRules } from '@fashion-midia/config/eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'public/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      ...sharedRules,
    },
  },
);
