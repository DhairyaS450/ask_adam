import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Add custom rules configuration here
  {
    files: ['**/*.ts', '**/*.tsx'], // Target TypeScript files
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Set no-explicit-any to warn
      '@typescript-eslint/no-unused-vars': 'warn',  // Set no-unused-vars to warn
    },
  },
];

export default eslintConfig;
