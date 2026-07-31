import { defineConfig } from 'tsup';
import postcss from 'esbuild-plugin-postcss2';

export default defineConfig((options) => ({
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
  // `pnpm dev` (tsup --watch) builds for development, `pnpm build` for
  // production. Development-only code is compiled out of the shipped bundle
  // rather than merely hidden, so it cannot be reached from the public site.
  esbuildOptions(esbuildOptions) {
    esbuildOptions.define = {
      ...esbuildOptions.define,
      'process.env.NODE_ENV': JSON.stringify(
        options.watch ? 'development' : 'production'
      ),
    };
    return esbuildOptions;
  },
}));