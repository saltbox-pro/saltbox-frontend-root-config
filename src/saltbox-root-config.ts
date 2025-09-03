import { registerApplication, start } from "single-spa";
import { authStore } from "./store/auth-store";
import { containerTracker } from "./container-tracker";
import { menuStore } from "./store/menu-store";
import { pluginsStore } from "./store/plugins-store";
import { localeStore } from "./store/locale-store";

let saltboxMainConfig;
let saltboxBaseUrl = "/static/base/index.js";
let saltboxDiscoveryUrl = "/api/discovery/config";
let saltboxGatewayUrl = "/static/gateway";

if (DEVELOPMENT && CONFIGURATION) {
  if (CONFIGURATION?.saltboxMainConfig) {
    saltboxMainConfig = CONFIGURATION.saltboxMainConfig;
  }
  if (CONFIGURATION?.saltboxBaseUrl) {
    saltboxBaseUrl = CONFIGURATION.saltboxBaseUrl;
  }
  if (CONFIGURATION?.saltboxDiscoveryUrl) {
    saltboxDiscoveryUrl = CONFIGURATION.saltboxDiscoveryUrl;
  }
}

const loadBase = (
  baseFrontendUrl: string,
  saltboxDiscoveryUrl: string,
  mainConfig: any | undefined
) => {
  registerApplication({
    name: "saltbox-frontend-base",
    app: () =>
      import(
        /* webpackIgnore: true */ // @ts-ignore-next
        baseFrontendUrl
      ),
    customProps: { menuStore, authStore, localeStore },
    activeWhen: ["/"],
  });
  start({
    urlRerouteOnly: true,
  });
  if (mainConfig) {
    authStore.setUserConfig(mainConfig.auth_config);
    loadModules(mainConfig);
    return;
  }
  fetch(saltboxDiscoveryUrl)
    .then((response) => {
      return response.json();
    })
    .then((config) => {
      authStore.setUserConfig(config.auth_config);
      config.services.unshift({
        url: saltboxGatewayUrl,
        env: {
          api_base_path: "",
          ws_server_url: null,
        },
      });
      loadModules(config);
    });
};

const loadModules = async (mainConfig: any) => {
  mainConfig.services.map((module) =>
    import(
      /* webpackIgnore: true */ // @ts-ignore-next
      module.url + "/index.js"
    )
      .then(async (impotedModule) => {
        if (impotedModule.saltboxModule?.settingsConfig) {
          menuStore.addSettingsItem(impotedModule.saltboxModule.settingsConfig);
        }
        if (impotedModule.saltboxModule?.menuConfig) {
          menuStore.addMenuItem(impotedModule.saltboxModule.menuConfig);
        }
        if (impotedModule.saltboxModule?.plugins) {
          pluginsStore.addPlugins(impotedModule.saltboxModule.plugins);
        }
        if (impotedModule.saltboxModule?.init) {
          impotedModule.saltboxModule.init(authStore, module.env, localeStore, pluginsStore);
        }
        await containerTracker.waitForContainer("app-container");
        registerApplication({
          name: impotedModule.saltboxModule.name,
          app: {
            ...impotedModule,
          },
          activeWhen: [impotedModule.saltboxModule?.path],
        });
      })
      .catch((error) =>
        console.error("Failed to wait for app container:", error)
      )
  );
};

loadBase(saltboxBaseUrl, saltboxDiscoveryUrl, saltboxMainConfig);
