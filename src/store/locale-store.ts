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
  }

  setLocale(locale: AppLocales) {
    this.currentLocale = locale;
    localStorage.setItem("currentLocale", locale);
  }
}

export const localeStore = new LocaleStore();
