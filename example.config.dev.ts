export const saltboxBaseUrl = "http://localhost:4201/index.js";

export const saltboxDiscoveryUrl = "/api/discovery/config";

export const saltboxMainConfig = {
  "auth_config": {
    "authority": "https://localhost/auth/keycloak/realms/salt.box",
    "client_id": "saltbox_core",
    "redirect_uri": "http://localhost:4200",
    "client_secret": "PWldvmaA9IW1tHLP",
  },
  "services": [{
    "service_name": "core",
    "url": "http://localhost:4202",
    "env": {
      "api_base_path": "https://localhost/api/core",
      "ws_server_url": "wss://localhost/api/core"
    }
  },
  {
    "service_name": "scheduler",
    "url": "http://localhost:4204",
    "env": {
      "api_base_path": "https://localhost/api/scheduler",
      "ws_server_url": null
    }
  },
  {
    "service_name": "inventory",
    "url": "http://localhost:4205",
    "env": {
      "api_base_path": "https://localhost/api/inventory",
      "ws_server_url": null
    }
  },
  {
    "service_name": "gateway",
    "url": "http://localhost:4203",
    "env": {
      "api_base_path": "https://localhost",
      "ws_server_url": null
    }
  },
  ],
}
