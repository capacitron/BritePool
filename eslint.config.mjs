import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".local/**", ".next/**", "node_modules/**"],
  },
  ...nextConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
