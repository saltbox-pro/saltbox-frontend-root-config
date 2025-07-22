const { merge } = require("webpack-merge");
const webpack = require('webpack');
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const orgName = "saltbox";

  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

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
      new webpack.DefinePlugin({
        DEVELOPMENT: argv.mode === 'development',
        PRODUCTION: argv.mode === 'production',
      }),
    ],
  });

  config.externals = [];

  return config;
};
