import type { NextConfig } from 'next';
const config:NextConfig={
  // Use the TypeScript 5 programmatic checker; type checking stays enabled.
  experimental:{useTypeScriptCli:false},
};
export default config;
