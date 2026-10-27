import type { MenuItem } from "./menu-store";

export type MenuLayout = {
  groupOrder: string[];
  itemOrder: Record<string, string[]>;
  hiddenItems: string[];
  shownItems: string[];
};

function mergeGroup(group: MenuItem, extraGroup: MenuItem | undefined): MenuItem {
  if (!group.children || !extraGroup?.children) return group;

  return { ...group, children: [...group.children, ...extraGroup.children] };
}

export function buildMenuCatalog(menu: MenuItem[], settingsMenu: MenuItem[]): MenuItem[] {
  const settingsGroups = new Map(
    settingsMenu.filter((group) => group.children).map((group) => [group.key, group])
  );
  const menuGroupKeys = new Set(menu.filter((group) => group.children).map((group) => group.key));

  return [
    ...menu.map((group) => mergeGroup(group, settingsGroups.get(group.key))),
    ...settingsMenu.filter((group) => !(group.children && menuGroupKeys.has(group.key))),
  ];
}

export function collectMenuItemKeys(menu: MenuItem[]): string[] {
  return menu.flatMap((group) =>
    group.children ? group.children.map((child) => child.key) : [group.key]
  );
}

export function resolveHiddenItems(
  layout: MenuLayout | null,
  defaultHiddenItems: string[]
): string[] {
  if (!layout) return defaultHiddenItems;

  const shown = new Set(layout.shownItems);

  return [...layout.hiddenItems, ...defaultHiddenItems.filter((key) => !shown.has(key))];
}

function sortByLayoutOrder(items: MenuItem[], order: string[] | undefined): MenuItem[] {
  if (!order?.length) return items;

  const positions = new Map(order.map((key, index) => [key, index]));
  const ordered = items
    .filter((item) => positions.has(item.key))
    .sort((a, b) => (positions.get(a.key) ?? 0) - (positions.get(b.key) ?? 0));

  items.forEach((item, index) => {
    if (!positions.has(item.key)) ordered.splice(index, 0, item);
  });

  return ordered;
}

export function applyMenuLayout(menu: MenuItem[], layout: MenuLayout | null): MenuItem[] {
  if (!layout) return menu;

  return sortByLayoutOrder(menu, layout.groupOrder).map((group) =>
    group.children
      ? { ...group, children: sortByLayoutOrder(group.children, layout.itemOrder[group.key]) }
      : group
  );
}

function filterMenuItems(menu: MenuItem[], isKept: (key: string) => boolean): MenuItem[] {
  return menu.flatMap((group) => {
    if (!group.children) return isKept(group.key) ? [group] : [];

    const children = group.children.filter((child) => isKept(child.key));

    return children.length > 0 ? [{ ...group, children }] : [];
  });
}

export function filterVisibleMenuItems(menu: MenuItem[], hiddenItems: string[]): MenuItem[] {
  if (hiddenItems.length === 0) return menu;

  const hidden = new Set(hiddenItems);

  return filterMenuItems(menu, (key) => !hidden.has(key));
}

export function filterHiddenMenuItems(menu: MenuItem[], hiddenItems: string[]): MenuItem[] {
  if (hiddenItems.length === 0) return [];

  const hidden = new Set(hiddenItems);

  return filterMenuItems(menu, (key) => hidden.has(key));
}
