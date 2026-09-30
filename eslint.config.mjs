import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".next-swc/**",
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    // The viewer needs raw <img> elements: exact object-fit control for the
    // shared-element handoff between the ring tile and the enlarged photo.
    files: ["src/components/viewer/**/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default eslintConfig;
