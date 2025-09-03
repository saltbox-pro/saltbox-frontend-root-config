import { makeAutoObservable } from "mobx";

export class PluginsStore {
  plugins: Object = {};

  constructor() {
    makeAutoObservable(this);
  }

  addPlugins(plugins: any[]) {
    this.plugins = { ...this.plugins, ...plugins };
  }
}

export const pluginsStore = new PluginsStore();
