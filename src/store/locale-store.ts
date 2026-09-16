import { makeAutoObservable } from "mobx";

export enum AppLocales {
  EN = "en",
  RU = "ru",
}

export class LocaleStore {
  currentLocale: AppLocales = AppLocales.EN;

  readonly supportedLocales: Array<AppLocales> = [AppLocales.EN, AppLocales.RU];

  constructor() {
    makeAutoObservable(this);
    const savedLocale = localStorage.getItem("currentLocale");
    if (savedLocale && Object.values(AppLocales).includes(savedLocale as AppLocales)) {
      this.currentLocale = savedLocale as AppLocales;
    }
    document.documentElement.lang = this.currentLocale;
  }

  /**
   * Смена языка всегда перезагружает страницу (SBX-837): часть UI не умеет
   * переключать локаль в рантайме (Monaco-редактор в common, Analytics/Superset
   * со статичным i18n + bootstrap). Локаль персистится в localStorage и читается
   * в конструкторе при загрузке, так что после reload все приложения поднимутся
   * уже с новым языком.
   */
  setLocale(locale: AppLocales) {
    if (locale === this.currentLocale) return;
    this.currentLocale = locale;
    localStorage.setItem("currentLocale", locale);
    document.documentElement.lang = locale;
    window.location.reload();
  }
}

export const localeStore = new LocaleStore();
