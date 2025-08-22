import { defineConfig } from 'tsup';
import postcss from 'esbuild-plugin-postcss2';

export default defineConfig({
  entry: {
    index: 'src/index.tsx',
  },
  format: ['iife'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  jsxFactory: 'React.createElement',
  plugins: [postcss],
  onSuccess: 'copyfiles -u 1 public/index.html dist',
  outExtension({ format }) {
    return {
      js: `.js`,
    };
  },
  // Add this section to define the environment variable
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': JSON.stringify('production'),
    };
    return options;
  },
});