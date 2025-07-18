const { merge } = require("webpack-merge");
const path = require("path");
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
    resolve: {
      alias: {
        "saltbox-core-api": path.resolve(__dirname, "../saltbox-frontend-core/src/api/generated"),
        "saltbox-core": path.resolve(__dirname, "../saltbox-frontend-core/src"),
        "saltbox-base": path.resolve(__dirname, "../saltbox-frontend-base/src"),
        "saltbox-root-config": path.resolve(__dirname, "../saltbox-frontend-root-config/src"),
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
    ],
  });

  config.externals = [];

  return config;
};
