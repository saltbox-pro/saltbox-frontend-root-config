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
  availableModuleRoutes: string[] = ["/gateway"];

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

  setAvailableModuleRoutes(routes: string[]) {
    this.availableModuleRoutes = Array.from(new Set(routes));
  }

  addAvailableModuleRoute(route: string) {
    if (!route) {
      return;
    }

    this.setAvailableModuleRoutes([...this.availableModuleRoutes, route]);
  }

  private getMatchedRoute(pathname: string, routes: string[]): string | null {
    const matchedRoutes = routes
      .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length);

    return matchedRoutes[0] ?? null;
  }

  isAvailableModulePath(pathname: string): boolean {
    return this.getMatchedRoute(pathname, this.availableModuleRoutes) !== null;
  }
}

export const menuStore = new MenuStore();
