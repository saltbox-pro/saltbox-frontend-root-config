import { makeAutoObservable, runInAction } from "mobx";
import {
  User,
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from "oidc-client-ts";

const userStore = new WebStorageStateStore({ store: window.localStorage });

export class AuthStore {
  user: User | undefined;
  isLoading = true;
  error: Error | undefined;
  userConfig: UserManagerSettings | undefined;
  private userPromise: Promise<User> | undefined;
  isSignOut: boolean = false;
  private _userManager: UserManager | undefined;

  get mergedConfig(): UserManagerSettings | undefined {
    if (!this.userConfig) return undefined;
    return {
      automaticSilentRenew: true,
      userStore: userStore,
      ...this.userConfig,
    };
  }

  get userManager(): UserManager | undefined {
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

  get isAuthenticated() {
    return !!this.user && !this.user.expired;
  }

  constructor() {
    makeAutoObservable(this);
  }

  private async initialize() {
    if (!this.userManager) return;
    try {
      const user = await this.userManager.getUser();
      runInAction(() => {
        this.user = user || undefined;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error as Error;
        this.isLoading = false;
      });
    }
  }

  async signIn(redirectURI?: string) {
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

  async signOut(redirectURI?: string) {
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

  handleSigninRedirectCallback() {
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
}

export const authStore = new AuthStore();
