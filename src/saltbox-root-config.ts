import { registerApplication, start } from "single-spa";
import { authStore } from "./store/auth-store";
import { containerTracker } from "./container-tracker";
import { menuStore } from "./store/menu-store";
import { localeStore } from "./store/locale-store";

let saltboxMainConfig;
let saltboxBaseUrl = "/static/base/index.js";
let saltboxDiscoveryUrl = "/api/discovery/config";

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

const loadBase = (baseFrontendUrl: string, saltboxDiscoveryUrl: string, mainConfig: any | undefined) => {
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
  fetch(saltboxDiscoveryUrl)
    .then((response) => {
      return response.json();
    })
    .then((config) => {
      if (mainConfig) {
        authStore.setUserConfig(mainConfig.auth_config);
        loadModules(mainConfig);
      } else {
        authStore.setUserConfig(config.auth_config);
        loadModules(config);
      }
    });
};

const loadModules = async (mainConfig: any) => {
  mainConfig.services.map((module) =>
    import(
      /* webpackIgnore: true */ // @ts-ignore-next
      module.url + "/index.js"
    )
      .then(async (impotedModule) => {
        if (impotedModule.meta?.menuConfig) {
          menuStore.addMenuItem(impotedModule.meta.menuConfig);
        }
        await containerTracker.waitForContainer("app-container");
        registerApplication({
          name: impotedModule.meta.name,
          app: {
            bootstrap: impotedModule.bootstrap,
            mount: impotedModule.mount,
            unmount: impotedModule.unmount,
          },
          customProps: { authStore, env: module.env, localeStore },
          activeWhen: [impotedModule.meta.path],
        });
      })
      .catch((error) =>
        console.error("Failed to wait for app container:", error)
      )
  );
};

loadBase(saltboxBaseUrl, saltboxDiscoveryUrl, saltboxMainConfig);
