# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-09-30

### Added
- Initial project setup with Single-SPA architecture
- Docker support with Nginx configuration
- CI/CD pipeline configuration
- Config loader for dynamic module configuration
- Locale store with i18next integration
- Locale persistence in local storage
- Menu store with settings menu support
- Menu configuration with priority and sorting
- Gateway module configuration
- Container tracker for module lifecycle management
- Development mode support
- Build and live server commands
- Application favicon and public assets copying

### Changed
- Reworked module loader for better performance
- Reworked application initialization flow
- Reworked modules initialization process
- Updated module configuration structure
- Changed plugin structure for better modularity
- Modified lifecycle property in saltboxModule config
- Updated loading process for modules
- Changed configuration for environment store
- Updated example configuration for development

### Fixed
- Fixed TypeScript configuration and dependencies
- Fixed base URL resolution
- Fixed webpack externals configuration
- Fixed module URLs resolution
- Fixed config parsing
- Fixed user manager initialization
- Fixed auth store configuration
- Fixed gateway configuration and URL
- Fixed loadBase functionality
- Removed console.log statements
- Fixed example development config
- Added icons to menuStore
- Added editor config
- Updated README sections for private NPM packages
- Updated NPM config information in README
- Security vulnerability fixes
- Fixed Docker NPM configuration
