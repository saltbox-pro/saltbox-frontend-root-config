const { merge } = require("webpack-merge");
const webpack = require('webpack');
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');
const fs = require('fs');

const loadConfiguration = () => {
  const configPath = path.resolve(__dirname, 'config.dev.ts');

  try {
    if (fs.existsSync(configPath)) {
      delete require.cache[require.resolve('./config.dev.ts')];

      const config = require('./config.dev.ts');

      return {
        saltboxBaseUrl: config.saltboxBaseUrl,
        saltboxMainConfig: config.saltboxMainConfig,
        saltboxDiscoveryUrl: config.saltboxDiscoveryUrl
      };
    }
    return null;
  } catch (error) {
    console.warn('Ошибка при загрузке config.dev.ts:', error.message);
    return null;
  }
};

module.exports = (webpackConfigEnv, argv) => {
  const orgName = "saltbox";

  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  const configuration = loadConfiguration();

  const definePluginConfig = {
    DEVELOPMENT: argv.mode === 'development',
    PRODUCTION: argv.mode === 'production',
  };

  if (configuration) {
    definePluginConfig.CONFIGURATION = JSON.stringify(configuration);
  }

  const config = merge(defaultConfig, {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'http://localhost',
          changeOrigin: true,
          secure: false,
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
        },
      }),
      new webpack.DefinePlugin(definePluginConfig),
      new CopyPlugin({
        patterns: [
          { from: "public" },
        ],
      }),
    ],
  });

  config.externals = [];

  return config;
};
