const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const { merge } = require("webpack-merge");

const PUBLIC_DIR = path.resolve(__dirname, "public");

const FAVICON_SOURCES = {
  svg: "favicon.svg",
  png: "favicon.png",
  png32: "favicon-32.png",
  png192: "favicon-192.png",
  png512: "favicon-512.png",
  apple: "apple-touch-icon.png",
};

const hashFile = (filePath) =>
  crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex").slice(0, 8);

const buildFaviconAssets = () =>
  Object.fromEntries(
    Object.entries(FAVICON_SOURCES).map(([key, fileName]) => {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      const hashedName = `${base}.${hashFile(path.join(PUBLIC_DIR, fileName))}${ext}`;

      return [key, hashedName];
    })
  );

class EmitEntryShimPlugin {
  constructor(opts) {
    this.shimName = opts.shimName;
    this.entryName = opts.entryName || "main";
  }
  apply(compiler) {
    const pluginName = "EmitEntryShimPlugin";
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: pluginName, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE },
        () => {
          const entrypoint = compilation.entrypoints.get(this.entryName);
          if (!entrypoint) return;
          const entryChunk = entrypoint.getEntrypointChunk();
          const jsFile = [...entryChunk.files].find((f) => f.endsWith(".js"));
          if (!jsFile || jsFile === this.shimName) return;
          const shim = `export * from "./${jsFile}";\n`;
          compilation.emitAsset(this.shimName, new compiler.webpack.sources.RawSource(shim));
        }
      );
    });
  }
}

const loadConfiguration = () => {
  const configPath = path.resolve(__dirname, "config.dev.ts");

  try {
    if (fs.existsSync(configPath)) {
      delete require.cache[require.resolve("./config.dev.ts")];

      const config = require("./config.dev.ts");

      return {
        saltboxBaseUrl: config.saltboxBaseUrl,
        saltboxMainConfig: config.saltboxMainConfig,
        saltboxDiscoveryUrl: config.saltboxDiscoveryUrl,
      };
    }
    return null;
  } catch (error) {
    console.warn("Ошибка при загрузке config.dev.ts:", error.message);
    return null;
  }
};

module.exports = (webpackConfigEnv, argv) => {
  const orgName = "saltbox";
  const isProd = argv.mode === "production";

  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  const configuration = loadConfiguration();
  const favicons = buildFaviconAssets();

  const definePluginConfig = {
    DEVELOPMENT: argv.mode === "development",
    PRODUCTION: isProd,
  };

  if (configuration) {
    definePluginConfig.CONFIGURATION = JSON.stringify(configuration);
  }

  const config = merge(defaultConfig, {
    devServer: {
      proxy: {
        "/api": {
          target: "http://localhost",
          changeOrigin: true,
          secure: false,
        },
        "/auth": {
          target: "http://localhost",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    output: {
      filename: isProd ? "saltbox-root-config.[contenthash].js" : "saltbox-root-config.js",
      chunkFilename: "[name].[contenthash].js",
      assetModuleFilename: "assets/[name].[contenthash][ext]",
    },
    optimization: {
      moduleIds: "deterministic",
      chunkIds: "deterministic",
      runtimeChunk: false,
      splitChunks: {
        chunks: "async",
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: false,
        template: "src/index.ejs",
        templateParameters: {
          isLocal: webpackConfigEnv && webpackConfigEnv.isLocal,
          orgName,
          favicons,
        },
      }),
      new webpack.DefinePlugin(definePluginConfig),
      new CopyPlugin({
        patterns: [
          {
            from: "public",
            globOptions: {
              ignore: [
                "**/favicon.svg",
                "**/favicon.png",
                "**/favicon-*.png",
                "**/apple-touch-icon.png",
              ],
            },
          },
          ...Object.entries(FAVICON_SOURCES).map(([key, fileName]) => ({
            from: path.join(PUBLIC_DIR, fileName),
            to: favicons[key],
          })),
        ],
      }),
      isProd && new EmitEntryShimPlugin({ shimName: "saltbox-root-config.js" }),
    ].filter(Boolean),
  });

  config.externals = [];

  return config;
};
