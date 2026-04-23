# 01 - Getting Started with DYMER

DYMER (DYnamic Information ModElling & Rendering) is a comprehensive suite designed for dynamic resource catalog visualization. It integrates a Headless CMS with a powerful template delivery engine, facilitating seamless mapping between JSON data models and graphic templates. An out-of-the-box JavaScript viewer is also provided for easy web application integration.

## Key Features

DYMER offers a robust set of features to streamline content management and delivery:

*   **Dynamic Data Modeling**: Create and modify data schemas (JSON Schema) without requiring code. This allows for flexible and agile data structure adjustments.
*   **Drag & Drop Modeling & Templating**: Design data models and templates using an integrated drag-and-drop builder, simplifying the development process.
*   **Logic-less Templates**: Generate graphic templates using Handlebars syntax, ensuring a clear separation of logic and presentation.
*   **Powerful Search Engine**: Benefit from full-text search capabilities on textual, numerical, and geospatial data, powered by Elasticsearch.
*   **RESTful API**: Access clean, well-documented APIs for seamless integration with any frontend or backend system.
*   **Ready-to-use JavaScript Viewer**: Utilize a drop-in library for instant entity rendering within web applications.
*   **Microservices Architecture**: The system is built on a scalable, containerized microservices architecture orchestrated with Docker, ensuring high availability and performance.
*   **Admin GUI**: Manage the platform through a modern TypeScript-based administration interface.
*   **Multi-tenant Ready**: Supports multiple models, templates, and entity types, making it suitable for diverse applications.

## Architecture Overview

DYMER's architecture is composed of six microservices, each running within its own Docker container. This distributed approach enhances scalability and maintainability.

| Service | Purpose | Port (default) | Technology |
| :---------------- | :------------------------------------ | :------------- | :----------------------- |
| `dymer-webserver` | API Gateway & routing | 8888 | Node.js + Express |
| `dymer-entities` | Entity CRUD + search | 3001 | Node.js + Elasticsearch |
| `dymer-forms` | Data model management | 3002 | Node.js + MongoDB |
| `dymer-templates` | Template storage & rendering | 3003 | Node.js + Handlebars |
| `dymer-gui` | Admin interface | 4200 | TypeScript + Modern Framework |
| `dymer-services` | Auxiliary services | variable | Node.js |

## Quick Start Guide

To get started with DYMER, follow these steps:

### Prerequisites

Ensure you have the following software installed on your system:

*   **Docker**: Version >= 20.10
*   **Docker Compose**: Version >= 2.0
*   **Git**

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/Engineering-Research-and-Development/DYMER.git
    cd DYMER
    ```

2.  **Configure port (optional)**: If you wish to use a port other than the default `8080`, create a `.env` file and specify the `HOST_PORT`.

    ```bash
    echo "HOST_PORT=8080" > .env
    ```

3.  **Start all services**:

    ```bash
    docker-compose up -d
    ```

4.  **Wait for services to be ready**: This may take approximately 30 seconds.

    ```bash
    docker-compose ps
    ```

### First Access

Open your web browser and navigate to `http://localhost:8080` (or the port you configured).

Use the default credentials to log in:

*   **Username**: `admin`
*   **Password**: `dymer`

**Important**: Change your password immediately after your first login for security reasons.

### Verify Installation

To ensure all services are running correctly and the API is accessible:

1.  **Check running services**:

    ```bash
    docker-compose ps
    ```

2.  **Test the API**:

    ```bash
    curl http://localhost:8080/api/v1/health
    ```

    **Expected response**:

    ```json
    {"status":"ok","version":"3.0.1"}
    ```

## Troubleshooting

| Issue | Solution |
| :-------------------- | :--------------------------------------------------------------------------------------------------- |
| `Port already in use` | Change `HOST_PORT` in the `.env` file. |
| `Services not starting` | Run `docker-compose logs` to view error messages and diagnose the issue. |
| `Cannot connect to database` | Ensure MongoDB and Elasticsearch containers are healthy by checking their status with `docker-compose ps`. |

