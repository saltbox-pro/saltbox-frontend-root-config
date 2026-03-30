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

export type ModuleState = "active" | "disabled" | "unavailable" | "disconnected";

export interface ModuleAccessRule {
  routePrefix: string;
  state: ModuleState;
}

export class MenuStore {
  menu: MenuItem[] = [];
  settingsMenu: MenuItem[] = [];
  moduleAccessRules: ModuleAccessRule[] = [];

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

  setModuleAccessRules(rules: ModuleAccessRule[]) {
    this.moduleAccessRules = rules.slice();
  }

  setModuleStateByRoutePrefix(routePrefix: string, state: ModuleState) {
    const targetRule = this.moduleAccessRules.find((rule) => rule.routePrefix === routePrefix);
    if (!targetRule) {
      return;
    }
    targetRule.state = state;
  }

  getModuleStateByPath(pathname: string): ModuleState | null {
    const matchingRules = this.moduleAccessRules
      .filter(
        (rule) => pathname === rule.routePrefix || pathname.startsWith(`${rule.routePrefix}/`)
      )
      .sort((a, b) => b.routePrefix.length - a.routePrefix.length);

    if (matchingRules.length === 0) {
      return null;
    }

    return matchingRules[0].state;
  }
}

export const menuStore = new MenuStore();
