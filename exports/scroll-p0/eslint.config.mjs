import js from '@eslint/js';
import globals from 'globals';
export default [{files:['**/*.{js,jsx,mjs}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},rules:{...js.configs.recommended.rules,'no-unused-vars':'off','no-empty':['error',{allowEmptyCatch:true}]}}];

