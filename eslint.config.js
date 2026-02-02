import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // array-type: [true, "generic"] → prefer Array<T> over T[]
            '@typescript-eslint/array-type': ['error', { default: 'generic' }],

            // no-string-literal: false → allow obj["prop"] syntax
            '@typescript-eslint/dot-notation': 'off',

            // object-literal-shorthand: [true, "never"] → require { prop: prop } not { prop }
            'object-shorthand': ['error', 'never'],

            // only-arrow-functions: false → allow regular functions
            'prefer-arrow-callback': 'off',

            // max-classes-per-file: false
            'max-classes-per-file': 'off',

            // no-var-requires: false → allow require()
            '@typescript-eslint/no-require-imports': 'off',

            // ban-types: false → allow Function, Object, etc.
            '@typescript-eslint/no-restricted-types': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',

            // no-unused-expression: true (but allow short-circuit expressions)
            '@typescript-eslint/no-unused-expressions': ['error', {
                allowShortCircuit: true,
                allowTernary: true,
            }],

            // semicolon: [true, "always"]
            'semi': ['error', 'always'],

            // Additional overrides to match original permissive tslint config
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_|^unused',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/ban-ts-comment': 'off',

            // Allow .apply() and other patterns used in this codebase
            'prefer-spread': 'off',
            'prefer-const': 'warn',
            'no-case-declarations': 'off',
            'no-unexpected-multiline': 'off',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'test/**/*.js'],
    }
);
