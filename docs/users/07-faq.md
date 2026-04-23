# 07 - Frequently Asked Questions (FAQ) about DYMER

This section addresses common questions about DYMER, its architecture, usage, and troubleshooting.

## General Questions

### What is DYMER?

DYMER (DYnamic Information ModElling & Rendering) is a comprehensive suite for dynamic resource catalog visualization. It combines a Headless CMS with a template delivery engine, enabling seamless mapping between JSON data models and graphic templates, along with a JavaScript viewer for web application integration.

### What are the core components of DYMER?

DYMER is built on a microservices architecture consisting of six main services:

*   `dymer-webserver`: API Gateway & routing.
*   `dymer-entities`: Handles Entity CRUD operations and search.
*   `dymer-forms`: Manages data models.
*   `dymer-templates`: Stores and renders templates.
*   `dymer-gui`: The Admin interface.
*   `dymer-services`: Provides auxiliary services.

It also utilizes Elasticsearch and MongoDB for data storage.

![DYMER Architecture Overview](placeholder_DymerArchitecture.png)
*Placeholder: Screenshot of the DYMER Architecture Diagram (DymerArchitecture.png)*

### What technologies does DYMER use?

DYMER primarily uses Node.js and Express for its backend services, Handlebars for templating, TypeScript and a modern framework (like Angular) for the Admin GUI, and Docker for containerization. It integrates with MongoDB for data model storage and Elasticsearch for powerful search capabilities.

### Is DYMER multi-tenant ready?

Yes, DYMER is designed to be multi-tenant ready, supporting multiple models, templates, and entity types, making it suitable for diverse applications and environments.

## Installation and Setup

### What are the prerequisites for installing DYMER?

To install DYMER, you need Docker (version >= 20.10), Docker Compose (version >= 2.0), and Git installed on your system.

### How do I start all DYMER services?

After cloning the repository and navigating into the `DYMER` directory, you can start all services using `docker-compose up -d`.

### What are the default login credentials for the Admin Panel?

The default login credentials are:

*   **Username**: `admin`
*   **Password**: `dymer`

It is highly recommended to change your password immediately after the first login for security reasons.

## Data Modeling and Templating

### How do I create data models in DYMER?

Data models are created and managed through the **Models** section in the DYMER Admin Panel using the Model Editor. You define your data structures using JSON Schema, specifying properties, data types, and validation rules.

### What templating language does DYMER use?

DYMER uses **Handlebars.js** for creating logic-less graphic templates. These templates are used to define how your data models are visually rendered.

### Can I use my own JavaScript framework with DYMER?

Yes, DYMER is designed to be headless. You can integrate its API and the JavaScript Viewer with any frontend framework like React, Vue, Angular, or even vanilla JavaScript.

## Troubleshooting

### What should I do if I encounter a "Port already in use" error?

If you see a "Port already in use" error, you can change the `HOST_PORT` in your `.env` file to an available port.

### My DYMER services are not starting. How can I diagnose the issue?

If services are not starting, run `docker-compose logs` to view the logs for each service. This will provide detailed error messages that can help you diagnose the problem.

### I cannot connect to the database. What should I check?

Ensure that the MongoDB and Elasticsearch containers are healthy and running. You can check their status using `docker-compose ps`.
