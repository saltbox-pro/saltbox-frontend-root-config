import { makeAutoObservable } from "mobx";

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export class MenuStore {
  menu: MenuItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addMenuItem(menuItem: MenuItem) {
    this.menu.push(menuItem);
  }
}

export const menuStore = new MenuStore();
