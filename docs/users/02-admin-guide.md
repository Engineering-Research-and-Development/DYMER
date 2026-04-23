# 02 - DYMER Admin Panel Guide

The DYMER Admin Panel provides a comprehensive interface for managing all aspects of your DYMER instance, from data models and templates to entity management and system configuration. This guide will walk you through the key sections and functionalities of the administration interface.

## Accessing the Admin Panel

After successfully installing and starting DYMER (as described in `01-getting-started.md`), open your web browser and navigate to the configured port (default: `http://localhost:8080`). Log in using your administrator credentials.

## Dashboard Overview

Upon logging in, you will be presented with the DYMER Dashboard. This central hub provides an overview of your system's status, recent activities, and quick access to essential management sections.

![Admin Dashboard Overview](placeholder_ws-dashboard.png)
*Placeholder: Screenshot of the DYMER Admin Dashboard (ws-dashboard.png)*

The dashboard typically displays:

*   **System Health**: Status of microservices and database connections.
*   **Recent Activity**: A log of recent changes or operations performed within the system.
*   **Quick Links**: Shortcuts to frequently used sections like Model Editor, Template Editor, and Entity Management.

## Navigation

The Admin Panel is organized into several key sections, accessible via a navigation menu (usually on the left or top of the interface). The main sections include:

*   **Models**: Define and manage your data schemas.
*   **Templates**: Create and edit graphic templates for data rendering.
*   **Entities**: Manage instances of your data models.
*   **Users & Roles**: (If applicable) Manage user accounts and permissions.
*   **Settings**: Configure system-wide parameters.

## Model Management

The **Models** section allows you to define the structure of your data using JSON Schema. DYMER provides a user-friendly interface for creating and modifying these schemas.

![Model Editor Interface](placeholder_ws-model-editor.png)
*Placeholder: Screenshot of the DYMER Model Editor (ws-model-editor.png)*

Key functionalities include:

*   **Creating New Models**: Define new data structures from scratch.
*   **Editing Existing Models**: Modify fields, data types, and validation rules for existing schemas.
*   **Import/Export Models**: Share or backup your data models.
*   **Version Control**: DYMER may offer versioning for your models, allowing you to track changes and revert if necessary.

## Template Creation and Management

In the **Templates** section, you can design how your data models are rendered visually. DYMER utilizes Handlebars for logic-less templating, ensuring a clean separation between data and presentation.

![Template Editor Interface](placeholder_ws-template-editor.png)
*Placeholder: Screenshot of the DYMER Template Editor (ws-template-editor.png)*

Features available in this section:

*   **New Template Creation**: Develop new visual layouts for your data.
*   **Template Editing**: Modify existing Handlebars templates using an integrated editor.
*   **Preview Functionality**: Instantly see how your template will render with sample data.
*   **Template Assignment**: Link templates to specific data models for automatic rendering.

## Entity Management

The **Entities** section is where you manage the actual data instances based on your defined models. This includes creating, reading, updating, and deleting (CRUD) individual entities.

![Entity Management Interface](placeholder_ws-manageEntity.png)
*Placeholder: Screenshot of the DYMER Entity Management (ws-manageEntity.png)*

Within this section, you can:

*   **Create New Entities**: Input data according to a chosen model.
*   **View and Search Entities**: Browse through your stored data, with powerful search and filtering options.
*   **Edit Entities**: Update the content of existing data instances.
*   **Delete Entities**: Remove unwanted data.
*   **Bulk Operations**: Perform actions on multiple entities simultaneously.

## User and Role Management (If Applicable)

Depending on your DYMER configuration, there might be a section dedicated to managing users and their roles. This allows for granular control over who can access and modify different parts of the system.

## System Settings

The **Settings** section provides options to configure various system-wide parameters, such as API keys, integration settings, and other operational preferences.

By familiarizing yourself with these sections, you can effectively manage and leverage the full power of the DYMER platform.
