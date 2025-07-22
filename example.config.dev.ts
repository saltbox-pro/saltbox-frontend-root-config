export const saltboxBaseUrl = "http://localhost:4201/index.js";

export const saltboxMainConfig = {
    "auth_config": {
        "authority": "http://localhost/auth/keycloak/realms/salt.box",
        "client_id": "saltbox_core",
        "redirect_uri": "http://localhost:4200",
        "client_secret": "PWldvmaA9IW1tHLP",
        "keycloak_oidc_url": "http://localhost/auth/keycloak/realms/salt.box/.well-known/openid-configuration",
        "keycloak_authorization_endpoint": "http://localhost/auth/keycloak/realms/salt.box/protocol/openid-connect/auth"
    },
    "services": [{
        "url": "http://localhost:4202",
        "static_host": "http://localhost:4202",
        "env": {
            "api_base_path": "http://localhost/api/core",
            "ws_server_url": null
        }
    }],
    "keycloak_url": "http://localhost/auth/keycloak"
}