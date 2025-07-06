import { registerApplication, start } from "single-spa";
import { authStore } from "./store/auth-store";
import { containerTracker } from "./container-tracker";
import { runInAction } from "mobx";
import { menuStore } from "./store/menu-store";

const mainConfig = {
  authConfig: {
    authority: "https://demo.saltbox.pro/auth/keycloak/realms/salt.box",
    client_id: "saltbox_core",
    redirect_uri: "http://localhost:4200",
    client_secret: "gKyKTi1QXTyfAbqK",
  },
  modules: [
    {
      url: "http://localhost:4202/saltbox-core.js",
      env: {
        apiBasePath: "https://demo.saltbox.pro/api/core",
        wsServerUrl: "wss://demo.saltbox.pro/api/core",
      },
    },
    {
      url: "http://localhost:4203/saltbox-flow.js",
    },
  ],
};

const loadBase = () => {
  runInAction(() => {
    authStore.userConfig = mainConfig.authConfig;
  });

  registerApplication({
    name: "saltbox-frontend-base",
    app: () =>
      import(
        /* webpackIgnore: true */ // @ts-ignore-next
        "http://localhost:4201/saltbox-base.js"
      ),
    customProps: { menuStore, authStore },
    activeWhen: ["/"],
  });
  start({
    urlRerouteOnly: true,
  });
  loadModules();
};

const loadModules = async () => {
  mainConfig.modules.map((module) =>
    import(
      /* webpackIgnore: true */ // @ts-ignore-next
      module.url
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
          customProps: { authStore, env: module.env },
          activeWhen: [impotedModule.meta.path],
        });
      })
      .catch((error) =>
        console.error("Failed to wait for app container:", error)
      )
  );
};

loadBase();
