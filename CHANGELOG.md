# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [DYMER v3.0.1] - 2026-04-23
### Added
- New DYMER GUI (Angular 20+)
- First RBAC JWT route

### Changed
- Moving to Elasticsearch 8.11 & MongoDB 7.0.4

### Fixed
- Microservice Fixed

## [v2.0.0] - 2024-10-29
### Added
- **Dymer Admin GUI Features**:
    - Swagger integration to expose endpoints and simplify endpoint management.
    - Dynamic Library Management to be injected client-side.
    - Import of Entities with multiple relations by REST call or CSV.
    - Export of Entities in JSON or CSV formats.
    - Taxonomy: to manage Vocabulary and import of an existing Vocabulary via REST call or CSV.
    - Social statistics to manage preferences and views.
    - New Vvvejs 2.0.3 editor provides an improved interface, support for dynamic layout, and simplified component management; integrates Magic template creation from an existing model.
    - Wizard to easily and intuitively generate Models and related Templates.
- **Dymer Client-side Features**:
    - Like and view to show contents likes and the number of visits.
    - Export a content in PDF format.

## [v1.1.2] - 2020-03-17
### Added
- **Dymer administration portal**:
    - New login.
    - Info page added.
    - Use of Redis for response caching with enable and flush via GUI.
    - Log console activation for each microservice by GUI.
    - Relationship management by GUI.
    - Improved dashboard (display UUID, DYMER version, last created/modified entities).
    - Manage entities: added filters for ID, visibility, status.
    - Manage taxonomies by vocabularies and component realization for models.
    - Automatic and conditional synchronization system between DYMER instances.
- **Dymer Client**:
    - Use select-picker in model select lists and search component.
    - Map: possibility to customize color and icon of markers depending on the present values of the entity.

### Changed
- **Dymer core**:
    - Search system optimization.
    - Parameterized resource sorting, choice of return fields in responses, limit in search queries.
    - Info retrieval of the owner/co-owner who last modified the resource.

## [v1.0.0] - 2020-03-17
### Added
- Initial release of DYMER.
