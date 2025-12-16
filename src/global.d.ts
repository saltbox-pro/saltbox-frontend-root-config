declare const DEVELOPMENT: boolean;
declare const PRODUCTION: boolean;

declare const CONFIGURATION:
  | {
      saltboxBaseUrl?: string;
      saltboxMainConfig?: any;
      saltboxDiscoveryUrl?: string;
    }
  | undefined;
