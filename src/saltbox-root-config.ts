import { registerApplication, start } from "single-spa";
import { authStore } from "./store/auth-store";
import { containerTracker } from "./container-tracker";
import { runInAction } from "mobx";
import { menuStore } from "./store/menu-store";
import { localeStore } from "./store/locale-store";

// const mainConfig = {
//   authConfig: {
//     authority: "http://localhost/auth/keycloak/realms/salt.box",
//     client_id: "saltbox_core",
//     client_secret: "PWldvmaA9IW1tHLP",
//     redirect_uri: "http://localhost:4200",
//   },
//   modules: [
//     {
//       url: "http://localhost:4202/index.js",
//       env: {
//         apiBasePath: "http://localhost/api/core",
//         wsServerUrl: "wss://demo.saltbox.pro/api/core",
//       },
//     },
//   ],
// };

const loadBase = () => {
  registerApplication({
    name: "saltbox-frontend-base",
    app: () =>
      import(
        /* webpackIgnore: true */ // @ts-ignore-next
        "/static/base/index.js"
      ),
    customProps: { menuStore, authStore, localeStore },
    activeWhen: ["/"],
  });
  start({
    urlRerouteOnly: true,
  });
  fetch("/api/discovery/config")
    .then((response) => {
      return response.json();
    })
    .then((mainConfig) => {
      runInAction(() => {
        authStore.userConfig = mainConfig.auth_config;
      });
      loadModules(mainConfig);
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

loadBase();
