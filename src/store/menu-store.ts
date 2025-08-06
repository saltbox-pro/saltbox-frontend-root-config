import { makeAutoObservable } from "mobx";

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  children?: MenuItem[];
  icon?: string;
}

export class MenuStore {
  menu: MenuItem[] = [];
  settings: MenuItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addMenuItem(menuItem: MenuItem) {
    this.menu.push(menuItem);
  }

  addSettingsItem(menuItem: MenuItem) {
    this.settings.push(menuItem);
  }
}

export const menuStore = new MenuStore();
