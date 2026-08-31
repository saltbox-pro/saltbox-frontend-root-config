import { makeAutoObservable } from "mobx";

type PluginsBySlot = Record<string, unknown[]>;

export class PluginsStore {
  plugins: PluginsBySlot = {};

  constructor() {
    makeAutoObservable(this);
  }

  addPlugins(plugins: PluginsBySlot) {
    for (const slot in plugins) {
      const slotPlugins = plugins[slot];
      if (!slotPlugins) {
        continue;
      }

      if (this.plugins[slot]) {
        this.plugins[slot] = [...this.plugins[slot], ...slotPlugins];
      } else {
        this.plugins[slot] = [...slotPlugins];
      }
    }
  }
}

export const pluginsStore = new PluginsStore();
