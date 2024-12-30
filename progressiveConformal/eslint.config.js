import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
export default [
    {
        ignores: ['public/**/*.js'],
    },
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        files: ['**/*.js'],
        plugins: {
            jsdoc,
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                },
            ],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'semi-spacing': ['error', { after: true, before: false }],
            'no-extra-semi': 'error',
            'no-unexpected-multiline': 'error',
            'no-unreachable': 'error',
            'no-undef': 'error',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-property-description': 'off',
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
    },
];
