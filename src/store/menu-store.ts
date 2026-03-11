import { makeAutoObservable } from "mobx";

export interface MenuItem {
  priority: number;
  key: string;
  label: string;
  path?: string;
  href?: string;
  children?: MenuItem[];
  icon?: string;
}

export class MenuStore {
  menu: MenuItem[] = [];
  settingsMenu: MenuItem[] = [];

  get sortedMenu() {
    return this.menu.slice().sort((a, b) => a.priority - b.priority);
  }

  get sortedSettingsMenu() {
    return this.settingsMenu.slice().sort((a, b) => a.priority - b.priority);
  }

  constructor() {
    makeAutoObservable(this);
  }

  addMenuItem(menuItem: MenuItem) {
    this.menu.push(menuItem);
  }

  addSettingsItem(menuItem: MenuItem) {
    this.settingsMenu.push(menuItem);
  }
}

export const menuStore = new MenuStore();
