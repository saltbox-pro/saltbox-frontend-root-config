import { makeAutoObservable } from "mobx";

export enum AppLocales {
  EN = "en",
  RU = "ru",
}

export type LocalePersister = (locale: AppLocales) => Promise<void>;

const LOCALE_STORAGE_KEY = "currentLocale";

export class LocaleStore {
  currentLocale: AppLocales = AppLocales.EN;

  readonly supportedLocales: Array<AppLocales> = [AppLocales.EN, AppLocales.RU];

  private persist: LocalePersister | null = null;

  constructor() {
    makeAutoObservable(this);
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && Object.values(AppLocales).includes(savedLocale as AppLocales)) {
      this.currentLocale = savedLocale as AppLocales;
    }
    document.documentElement.lang = this.currentLocale;
  }

  setPersister(persist: LocalePersister | null) {
    this.persist = persist;
  }

  applyLocale(locale: AppLocales) {
    if (locale === this.currentLocale) return;
    this.writeLocale(locale);
    window.location.reload();
  }

  async setLocale(locale: AppLocales) {
    if (locale === this.currentLocale) return;

    await this.persist?.(locale);

    this.writeLocale(locale);
    window.location.reload();
  }

  private writeLocale(locale: AppLocales) {
    this.currentLocale = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }
}

export const localeStore = new LocaleStore();
