# 05 - Entity Management (CRUD) in DYMER

Entity management is a fundamental aspect of any content management system, and DYMER provides robust capabilities for Creating, Reading, Updating, and Deleting (CRUD) entities based on your defined data models. This guide will detail how to interact with and manage your data entities within the DYMER platform.

## Understanding Entities

In DYMER, an **entity** is an instance of a data model. For example, if you have a `Product` data model, each individual product (e.g., "Laptop Pro X", "Wireless Mouse") stored in DYMER is an entity of that `Product` model. Entities hold the actual data that will be rendered by your templates and served via the API.

## Accessing Entity Management

To manage your entities, navigate to the **Entities** section within the DYMER Admin Panel. This section provides a centralized interface for all CRUD operations.

![Entity Management Interface](placeholder_ws-manageEntity.png)
*Placeholder: Screenshot of the DYMER Entity Management interface (ws-manageEntity.png)*

## Creating New Entities

To add a new data record to your DYMER instance:

1.  **Select Model**: From the Entity Management interface, choose the data model for which you want to create a new entity (e.g., `Product`).
2.  **Initiate Creation**: Click on a button like `Create New Entity` or `Add Entity`.
3.  **Fill in Data**: A form will be presented, dynamically generated based on the JSON Schema of the selected model. Fill in the required fields and any optional fields with the appropriate data.
    *   **Data Validation**: DYMER will apply the validation rules defined in your data model (e.g., data types, min/max lengths, patterns) to ensure data integrity.
4.  **Save Entity**: Once all data is entered and validated, save the new entity. It will then be stored in the database and become available for searching and rendering.

![Example Form Render](placeholder_example_formrender.png)
*Placeholder: Screenshot of an example form generated for entity creation (example_formrender.png)*

## Reading and Searching Entities

DYMER offers powerful capabilities to view and search your stored entities:

1.  **Browse Entities**: The Entity Management section typically displays a list of entities for the currently selected model.

    ![Render List](placeholder_render-list.png)
    *Placeholder: Screenshot of a list of rendered entities (render-list.png)*

2.  **Search Functionality**: Utilize the search bar to find specific entities based on keywords, values in certain fields, or a combination of criteria. DYMER leverages Elasticsearch for full-text search, allowing for efficient retrieval of information across various data types.

    *   **Filtering**: Apply filters to narrow down your search results based on specific field values, date ranges, or other attributes.
    *   **Sorting**: Sort entities by different fields (e.g., creation date, name, price) in ascending or descending order.

3.  **View Entity Details**: Click on an individual entity from the list to view its complete details. This often includes all properties defined in its data model.

    ![Render List Detail](placeholder_render-list-detail.png)
    *Placeholder: Screenshot of the detailed view of a single entity (render-list-detail.png)*

## Updating Existing Entities

To modify the data of an existing entity:

1.  **Select Entity**: Locate the entity you wish to update using the browsing or search functionalities.
2.  **Initiate Edit**: Click on an `Edit` button or icon associated with the entity.
3.  **Modify Data**: The entity's data will be loaded into an editable form. Make the necessary changes to the fields.
4.  **Save Changes**: Save the updated entity. The changes will be reflected immediately in the system and any applications consuming this data.

## Deleting Entities

To remove an entity from DYMER:

1.  **Select Entity**: Find the entity you want to delete.
2.  **Initiate Deletion**: Click on a `Delete` button or icon. You will typically be prompted for confirmation to prevent accidental data loss.
3.  **Confirm Deletion**: Confirm the action. The entity and its associated data will be permanently removed from the system.

## Bulk Operations

For managing a large number of entities, DYMER may offer bulk operations, allowing you to perform actions like:

*   **Bulk Edit**: Apply changes to multiple entities simultaneously.
*   **Bulk Delete**: Remove several entities at once.
*   **Import/Export**: Import entities from external files (e.g., CSV, JSON) or export existing entities for backup or migration purposes.

Effective entity management ensures that your data is accurate, up-to-date, and readily available for rendering and consumption by integrated applications.
