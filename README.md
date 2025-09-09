## Run for local development

1. rename `example.config.dev.ts` to `config.dev.ts`
2. change `client_secret` value in `config.dev.ts` to value from file `saltbox-compose/secrets/keycloak_client_saltbox_core_password`

### Example package.json for multi-repos

```{
    "name": "saltbox-frontend-multirepo",
    "version": "0.0.0",
    "private": true,
    "dependencies": {},
    "scripts": {
        "start": "npx concurrently yarn:start:*",
        "start:root-config": "cd saltbox-frontend-root-config && yarn start",
        "start:core": "cd saltbox-frontend-core && yarn start",
        "start:base": "cd saltbox-frontend-base && yarn start",
        "start:scheduler": "cd saltbox-frontend-scheduler && yarn start",
        "live": "npx concurrently yarn:live:*",
        "live:root-config": "cd saltbox-frontend-root-config && yarn live",
        "live:core": "cd saltbox-frontend-core && yarn live",
        "live:base": "cd saltbox-frontend-base && yarn live",
        "live:scheduler": "cd saltbox-frontend-scheduler && yarn live",
        "git-pull": "npx concurrently yarn:git-pull:*",
        "git-pull:root-config": "cd saltbox-frontend-root-config && git pull",
        "git-pull:core": "cd saltbox-frontend-core && git pull",
        "git-pull:base": "cd saltbox-frontend-base && git pull",
        "git-pull:scheduler": "cd saltbox-frontend-scheduler && git pull",
        "build": "npx concurrently yarn:build:*",
        "build:root-config": "cd saltbox-frontend-root-config && yarn build",
        "build:core": "cd saltbox-frontend-core && yarn build",
        "build:base": "cd saltbox-frontend-base && yarn build",
        "build:scheduler": "cd saltbox-frontend-scheduler && yarn build",
        "packages": "npx concurrently yarn:install:*",
        "install:root-config": "cd saltbox-frontend-root-config && yarn",
        "install:core": "cd saltbox-frontend-core && yarn",
        "install:base": "cd saltbox-frontend-base && yarn",
        "install:scheduler": "cd saltbox-frontend-scheduler && yarn"
    }
}```

### Generate Tokens For Private NPM registry

1. Open page https://dev.saltbox.pro/-/user_settings/personal_access_tokens

2. Add new token with `read_api`

3. Run commands on your local machine:

`yarn config set '//dev.saltbox.pro/api/v4/packages/npm/:_authToken' '<token>'
npm config set -- //dev.saltbox.pro/api/v4/projects/:_authToken=<token>
npm config set -- //dev.saltbox.pro/api/v4/packages/npm/:_authToken=<token>`
