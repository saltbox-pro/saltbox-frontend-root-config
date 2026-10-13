import { makeAutoObservable } from "mobx";

export enum AppLocales {
  EN = "en",
  RU = "ru",
}

export type LocalePersister = (locale: AppLocales) => Promise<void>;

export class LocaleStore {
  currentLocale: AppLocales = AppLocales.EN;

  readonly supportedLocales: Array<AppLocales> = [AppLocales.EN, AppLocales.RU];

  private persist: LocalePersister | null = null;

  constructor() {
    makeAutoObservable(this);
    const savedLocale = localStorage.getItem("currentLocale");
    if (savedLocale && Object.values(AppLocales).includes(savedLocale as AppLocales)) {
      this.currentLocale = savedLocale as AppLocales;
    }
    document.documentElement.lang = this.currentLocale;
  }

  setPersister(persist: LocalePersister) {
    this.persist = persist;
  }

  async setLocale(locale: AppLocales) {
    if (locale === this.currentLocale) return;
    this.currentLocale = locale;
    localStorage.setItem("currentLocale", locale);
    document.documentElement.lang = locale;
    await this.persist?.(locale).catch(() => undefined);
    window.location.reload();
  }
}

export const localeStore = new LocaleStore();
