export const saltboxBaseUrl = "http://localhost:4201/index.js";

export const saltboxDiscoveryUrl = "/api/discovery/config";

export const saltboxMainConfig = {
    "auth_config": {
        "authority": "http://localhost/auth/keycloak/realms/salt.box",
        "client_id": "saltbox_core",
        "redirect_uri": "http://localhost:4200",
        "client_secret": "PWldvmaA9IW1tHLP",
    },
    "services": [{
        "url": "http://localhost:4202",
        "env": {
            "api_base_path": "http://localhost/api/core",
            "ws_server_url": "ws://localhost/api/core"
        }
    }],
}
