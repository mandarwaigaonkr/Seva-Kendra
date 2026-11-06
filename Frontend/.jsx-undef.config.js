import react from "eslint-plugin-react";
export default [{ files: ["**/*.jsx"], plugins: { react }, languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } }, rules: { "react/jsx-no-undef": "error" } }];
