import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import {
  User,
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from "oidc-client-ts";

const userStore = new WebStorageStateStore({ store: window.localStorage });

export class AuthStore {
  @observable user: User | undefined;
  @observable isLoading = true;
  @observable error: Error | undefined;
  @observable userConfig: UserManagerSettings | undefined;
  @observable private userPromise: Promise<User> | undefined;
  @observable isSignOut: boolean = false;
  @observable private _userManager: UserManager | undefined;

  @computed get mergedConfig(): UserManagerSettings | undefined {
    if (!this.userConfig) return undefined;
    return {
      automaticSilentRenew: true,
      userStore: userStore,
      ...this.userConfig,
    };
  }

  @computed get userManager(): UserManager | undefined {
    if (!this.mergedConfig) return undefined;
    if (!this._userManager) {
      this._userManager = new UserManager(this.mergedConfig);

      this._userManager.events.addUserLoaded((user) => {
        runInAction(() => {
          this.user = user;
          this.error = undefined;
        });
      });

      this._userManager.events.addUserUnloaded(() => {
        runInAction(() => {
          this.user = undefined;
        });
      });

      this._userManager.events.addSilentRenewError((error) => {
        runInAction(() => {
          this.error = error;
        });
      });
    }

    return this._userManager;
  }

  @computed get isAuthenticated() {
    return !!this.user && !this.user.expired;
  }

  constructor() {
    makeObservable(this);
  }

  @action async signIn(redirectURI?: string) {
    if (!this.userManager) return;
    try {
      this.isLoading = true;
      await this.userManager.signinRedirect({ redirect_uri: redirectURI });
    } catch (error) {
      console.error("AuthStore.signIn error", error);
      runInAction(() => {
        this.error = error as Error;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  @action async signOut(redirectURI?: string) {
    if (!this.userManager) return;
    try {
      this.isSignOut = true;
      await this.userManager.signoutRedirect({
        post_logout_redirect_uri: redirectURI,
      });
    } catch (error) {
      runInAction(() => {
        this.error = error as Error;
      });
    } finally {
      runInAction(() => {
        this.isSignOut = false;
      });
    }
  }

  @action handleSigninRedirectCallback() {
    if (!this.userManager || this.userPromise) return;
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      this.userPromise = (
        this.userManager as UserManager
      ).signinRedirectCallback();
      this.userPromise
        .then((user) => {
          runInAction(() => {
            this.user = user;
            this.error = undefined;
            resolve(user);
          });
        })
        .catch((error) => {
          runInAction(() => {
            this.error = error as Error;
            this.user = undefined;
            reject(error);
          });
        })
        .finally(() => {
          runInAction(() => {
            this.isLoading = false;
          });
        });
    });
  }

  @action setUserConfig(config: UserManagerSettings) {
    this.userConfig = config;
  }
}

export const authStore = new AuthStore();
