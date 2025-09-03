import { makeAutoObservable } from "mobx";

export class PluginsStore {
  plugins: Object = {};

  constructor() {
    makeAutoObservable(this);
  }

  addPlugins(plugins: any[]) {
    for (const plugin in plugins) {
      if (this.plugins?.[plugin]) {
        this.plugins[plugin].push(...plugins[plugin]);
      } else {
        this.plugins[plugin] = [...plugins[plugin]];
      }
    }
  }
}

export const pluginsStore = new PluginsStore();
