import js from '@eslint/js'
import globals from 'globals'
export default [{ files:['components/review/**/*.jsx','components/DailyRCDetailedReview.jsx','lib/bootcamp/**/*.{js,mjs}','components/bootcamp/**/*.jsx','app/boot-camp/**/*.jsx','app/api/bootcamp/**/*.js','tests/bootcamp*.mjs','tests/helpers/bootcamp-db.mjs'],
  languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},
  rules:{...js.configs.recommended.rules,'no-unused-vars':['error',{varsIgnorePattern:'^[A-Z_]',argsIgnorePattern:'^_'}]} }]
