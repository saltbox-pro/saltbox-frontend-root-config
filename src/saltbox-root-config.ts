import { registerApplication, start } from "single-spa";

import { containerTracker } from "./container-tracker";
import { authStore } from "./store/auth-store";
import { localeStore } from "./store/locale-store";
import { menuStore } from "./store/menu-store";
import { pluginsStore } from "./store/plugins-store";

type ModuleState = "active" | "disabled" | "unavailable" | "disconnected";

type ModuleDefinition = {
  serviceName: string;
  routePrefix: string;
};

const moduleDefinitions: ModuleDefinition[] = [
  { serviceName: "core", routePrefix: "/core" },
  { serviceName: "scheduler", routePrefix: "/scheduler" },
  { serviceName: "inventory", routePrefix: "/inventory" },
  { serviceName: "migration", routePrefix: "/scenarios" },
  { serviceName: "gateway", routePrefix: "/gateway" },
  { serviceName: "metric", routePrefix: "/metric" },
];

const getServiceEnabledStatus = (service: any): boolean =>
  service.enabled !== false && service.is_enabled !== false;

const getServiceAvailableStatus = (service: any): boolean => service.is_available !== false;

const getServiceState = (service: any): ModuleState => {
  if (!getServiceEnabledStatus(service)) {
    return "disabled";
  }
  if (!getServiceAvailableStatus(service)) {
    return "unavailable";
  }
  return "active";
};

const getModuleDefinitionByServiceName = (
  serviceName: string | undefined
): ModuleDefinition | undefined =>
  moduleDefinitions.find((moduleDefinition) => moduleDefinition.serviceName === serviceName);

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
  const serviceStateMap = new Map<string, ModuleState>();
  mainConfig.services.forEach((service) => {
    serviceStateMap.set(service.service_name, getServiceState(service));
  });

  menuStore.setModuleAccessRules(
    moduleDefinitions.map((moduleDefinition) => ({
      routePrefix: moduleDefinition.routePrefix,
      state: serviceStateMap.get(moduleDefinition.serviceName) ?? "disconnected",
    }))
  );

  const activeServices = mainConfig.services.filter(
    (service) => getServiceEnabledStatus(service) && getServiceAvailableStatus(service)
  );

  activeServices.map((module) =>
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
          impotedModule.saltboxModule.init(authStore, activeServices, localeStore, pluginsStore);
        }
        await containerTracker.waitForContainer("app-container");
        registerApplication({
          name: impotedModule.saltboxModule.name,
          app: impotedModule.saltboxModule.singleSpaLifecycle,
          activeWhen: [impotedModule.saltboxModule?.path],
        });
      })
      .catch((error) => {
        const moduleDefinition = getModuleDefinitionByServiceName(module.service_name);
        if (moduleDefinition) {
          menuStore.setModuleStateByRoutePrefix(moduleDefinition.routePrefix, "unavailable");
        }
        console.error("Failed to load module:", error);
      })
  );
};

loadBase(saltboxBaseUrl, saltboxDiscoveryUrl, saltboxMainConfig);
