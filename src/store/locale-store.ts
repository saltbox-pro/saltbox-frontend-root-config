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
  }

  setLocale(locale: AppLocales) {
    this.currentLocale = locale;
  }
}

export const localeStore = new LocaleStore();
