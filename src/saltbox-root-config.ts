import { registerApplication, start } from "single-spa";

import { containerTracker } from "./container-tracker";
import { authStore } from "./store/auth-store";
import { localeStore } from "./store/locale-store";
import { menuStore } from "./store/menu-store";
import { pluginsStore } from "./store/plugins-store";

const handleChunkLoadError = (message: string) => {
  if (
    !/Loading chunk .* failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(
      message
    )
  ) {
    return;
  }
  const key = "sbx_chunk_reload_ts";
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
};
window.addEventListener("error", (event) => handleChunkLoadError(event.message || ""));
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = typeof reason === "string" ? reason : reason?.message || "";
  handleChunkLoadError(message);
});

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
  menuStore.setModulesLoading(true);
  const availableServices = mainConfig.services.filter((service) => service.is_available !== false);

  const moduleLoadPromises = availableServices.map((module) =>
    import(
      /* webpackIgnore: true */ // @ts-ignore-next
      module.url + "/index.js"
    )
      .then(async (impotedModule) => {
        if (impotedModule.saltboxModule?.path) {
          menuStore.addAvailableModuleRoute(impotedModule.saltboxModule.path);
        }
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
          impotedModule.saltboxModule.init(authStore, availableServices, localeStore, pluginsStore);
        }
        await containerTracker.waitForContainer("app-container");
        registerApplication({
          name: impotedModule.saltboxModule.name,
          app: impotedModule.saltboxModule.singleSpaLifecycle,
          activeWhen: [impotedModule.saltboxModule?.path],
        });
      })
      .catch((error) => console.error("Failed to wait for app container:", error))
  );

  await Promise.allSettled(moduleLoadPromises);
  menuStore.setModulesLoading(false);
};

loadBase(saltboxBaseUrl, saltboxDiscoveryUrl, saltboxMainConfig);
