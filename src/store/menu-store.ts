import { makeAutoObservable, observable } from "mobx";

import {
  type MenuLayout,
  applyMenuLayout,
  buildMenuCatalog,
  collectMenuItemKeys,
  filterHiddenMenuItems,
  filterVisibleMenuItems,
  resolveHiddenItems,
} from "./menu-layout";

export type { MenuLayout } from "./menu-layout";

export type MenuLayoutPersister = (layout: MenuLayout | undefined) => Promise<void>;

export type MenuLayoutLoader = () => void;

export type MenuLayoutStatus = "pending" | "retrying" | "loaded" | "failed" | "unavailable";

export interface MenuItem {
  priority: number;
  key: string;
  label: string | Record<string, string>;
  path?: string;
  href?: string;
  additionalActivePaths?: string[];
  children?: MenuItem[];
  icon?: string;
}

export class MenuStore {
  menu: MenuItem[] = [];
  settingsMenu: MenuItem[] = [];
  availableModuleRoutes: string[] = ["/gateway"];
  fullBleedModuleRoutes: string[] = [];
  isModulesLoading = true;
  layout: MenuLayout | null = null;
  layoutStatus: MenuLayoutStatus = "pending";

  private persistLayout: MenuLayoutPersister | null = null;
  private loadLayout: MenuLayoutLoader | null = null;
  private storedLayoutRevision = 0;

  get sortedMenu() {
    return this.menu.slice().sort((a, b) => a.priority - b.priority);
  }

  get sortedSettingsMenu() {
    return this.settingsMenu.slice().sort((a, b) => a.priority - b.priority);
  }

  get menuCatalog() {
    return buildMenuCatalog(this.sortedMenu, this.sortedSettingsMenu);
  }

  get orderedMenuCatalog() {
    return applyMenuLayout(this.menuCatalog, this.layout);
  }

  get defaultHiddenItems() {
    return collectMenuItemKeys(this.sortedSettingsMenu);
  }

  get hiddenItems() {
    return resolveHiddenItems(this.layout, this.defaultHiddenItems);
  }

  get visibleMenu() {
    return filterVisibleMenuItems(this.orderedMenuCatalog, this.hiddenItems);
  }

  get hiddenMenu() {
    return filterHiddenMenuItems(this.orderedMenuCatalog, this.hiddenItems);
  }

  constructor() {
    makeAutoObservable<this, "persistLayout" | "loadLayout" | "storedLayoutRevision">(this, {
      layout: observable.ref,
      persistLayout: false,
      loadLayout: false,
      storedLayoutRevision: false,
    });
  }

  setLayoutPersister(persister: MenuLayoutPersister | null) {
    this.persistLayout = persister;
  }

  setLayoutLoader(loader: MenuLayoutLoader | null) {
    this.loadLayout = loader;
  }

  applyStoredLayout(layout: MenuLayout | undefined) {
    this.layout = layout ?? null;
    this.layoutStatus = "loaded";
    this.storedLayoutRevision += 1;
  }

  failLayoutLoad() {
    if (this.layoutStatus === "loaded") return;

    this.layoutStatus = "failed";
  }

  retryLayoutLoad() {
    if (!this.loadLayout || this.layoutStatus !== "failed") return;

    this.layoutStatus = "retrying";
    this.loadLayout();
  }

  resolveLayoutWithoutLoader() {
    if (!this.loadLayout && this.layoutStatus === "pending") {
      this.layoutStatus = "unavailable";
    }
  }

  async setLayout(layout: MenuLayout) {
    await this.saveLayout(layout);
  }

  async resetLayout() {
    await this.saveLayout(null);
  }

  private async saveLayout(layout: MenuLayout | null) {
    const revision = this.storedLayoutRevision;
    await this.persistLayout?.(layout ?? undefined);
    this.commitLayout(layout, revision);
  }

  private commitLayout(layout: MenuLayout | null, revision: number) {
    if (revision !== this.storedLayoutRevision) return;

    this.layout = layout;
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

  setModulesLoading(isLoading: boolean) {
    this.isModulesLoading = isLoading;
  }

  addAvailableModuleRoute(route: string) {
    if (!route) {
      return;
    }

    this.setAvailableModuleRoutes([...this.availableModuleRoutes, route]);
  }

  addFullBleedModuleRoute(route: string) {
    if (!route) {
      return;
    }

    this.fullBleedModuleRoutes = Array.from(new Set([...this.fullBleedModuleRoutes, route]));
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

  isFullBleedModulePath(pathname: string): boolean {
    return this.getMatchedRoute(pathname, this.fullBleedModuleRoutes) !== null;
  }
}

export type MenuLayoutPort = Pick<
  MenuStore,
  "setLayoutPersister" | "setLayoutLoader" | "applyStoredLayout" | "failLayoutLoad"
>;

export const createMenuLayoutPort = (store: MenuStore): MenuLayoutPort => ({
  setLayoutPersister: (persister) => store.setLayoutPersister(persister),
  applyStoredLayout: (layout) => store.applyStoredLayout(layout),
  setLayoutLoader: (loader) => store.setLayoutLoader(loader),
  failLayoutLoad: () => store.failLayoutLoad(),
});

export const menuStore = new MenuStore();
