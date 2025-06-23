import { registerApplication, start } from "single-spa";
import { authStore } from "./auth-store";
import { containerTracker } from "./container-tracker";

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [];

export const addMenuConfig = (config: MenuItem) => {
  menuConfig.push(config);
};

const modules = [
  {
    name: "saltbox-frontend-core",
    path: "/core",
  },
  {
    name: "saltbox-frontend-flow",
    path: "/flow",
  },
];

const loadMainApps = async () => {
  const loadedModules = new Map();

  const loadPromises = modules.map((module) =>
    import(
      /* webpackIgnore: true */ // @ts-ignore-next
      module.name
    ).then((app) => {
      if (app.meta?.menuConfig) {
        addMenuConfig(app.meta.menuConfig);
      }
      loadedModules.set(module.name, app);
    })
  );

  await Promise.all(loadPromises);

  registerApplication({
    name: "saltbox-frontend-base",
    app: () =>
      import(
        /* webpackIgnore: true */ // @ts-ignore-next
        "saltbox-frontend-base"
      ),
    customProps: { menuConfig, authStore },
    activeWhen: ["/"],
  });

  // Запускаем single-spa
  start({
    urlRerouteOnly: true,
  });

  try {
    await containerTracker.waitForContainer("app-container");
    modules.forEach((module) => {
      registerApplication({
        name: module.name,
        app: () => Promise.resolve(loadedModules.get(module.name)),
        customProps: { authStore },
        activeWhen: [module.path],
      });
    });
  } catch (error) {
    console.error("Failed to wait for app container:", error);
  }
};

loadMainApps();
