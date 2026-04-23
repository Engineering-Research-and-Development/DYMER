# 03 - How to Create Data Models in DYMER

DYMER's core functionality revolves around its dynamic data modeling capabilities, allowing users to define and manage data structures without writing code. This guide will walk you through the process of creating and managing data models using the DYMER Admin Panel's Model Editor.

## Understanding Data Models

In DYMER, data models are defined using **JSON Schema**, a powerful standard for describing the structure and constraints of JSON data. Each model represents a type of entity (e.g., a 'Product', 'User', or 'Article') and specifies the properties (fields) that entities of that type will possess, along with their data types, validation rules, and other metadata.

## Accessing the Model Editor

To create or modify data models, navigate to the **Models** section within the DYMER Admin Panel. This section provides access to the Model Editor, a graphical interface designed to simplify JSON Schema creation.

![Model Editor Interface](placeholder_ws-model-editor.png)
*Placeholder: Screenshot of the DYMER Model Editor (ws-model-editor.png)*

## Creating a New Data Model

Follow these steps to create a new data model:

1.  **Navigate to Models**: In the Admin Panel, click on the 'Models' menu item.
2.  **Initiate New Model**: Look for a button or option like 'Create New Model' or 'Add Model'.
3.  **Define Model Name and Description**: Provide a unique name for your model (e.g., `Product`, `BlogPost`) and an optional description that explains its purpose.
4.  **Add Properties (Fields)**: This is the most crucial step. For each property you want to add to your model:
    *   **Property Name**: A unique identifier for the field (e.g., `productName`, `price`, `description`).
    *   **Data Type**: Select the appropriate JSON Schema data type (e.g., `string`, `number`, `boolean`, `array`, `object`).
    *   **Format (Optional)**: For `string` types, you might specify formats like `date`, `email`, `uri`, etc.
    *   **Required**: Mark if the field is mandatory for entities of this model.
    *   **Default Value (Optional)**: Provide a default value if none is specified during entity creation.
    *   **Validation Rules (Optional)**: Add constraints such as `minLength`, `maxLength`, `minimum`, `maximum`, `pattern` (for regex), `enum` (for predefined values), etc.
    *   **Description**: A human-readable explanation of the field's purpose.
5.  **Organize Properties**: The Model Editor often allows you to group properties or define nested objects/arrays to create complex data structures.
6.  **Save the Model**: Once all properties are defined and configured, save your new data model. DYMER will then use this schema for entity creation and validation.

### Example: A Simple Product Model

Consider a `Product` model with the following properties:

| Property Name | Data Type | Required | Description |
| :------------ | :-------- | :------- | :------------------------------------------------- |
| `id` | `string` | Yes | Unique identifier for the product |
| `name` | `string` | Yes | Name of the product |
| `description` | `string` | No | Detailed description of the product |
| `price` | `number` | Yes | Price of the product (e.g., `minimum: 0`) |
| `currency` | `string` | Yes | Currency of the price (e.g., `enum: ["USD", "EUR"]`) |
| `inStock` | `boolean` | Yes | Availability status of the product |

This model would be visually constructed in the Model Editor by adding each property and configuring its respective settings.

## Modifying Existing Data Models

To modify an existing model:

1.  **Select Model**: From the 'Models' list, click on the model you wish to edit.
2.  **Make Changes**: Use the Model Editor to add, remove, or modify properties and their configurations.
3.  **Save Changes**: Save the updated model. Be aware that significant changes to a model's structure might impact existing entities based on that model. DYMER typically handles schema migrations, but it's always good practice to understand the implications of your changes.

## Importing and Exporting Models

DYMER usually provides options to import and export JSON Schema definitions. This is useful for:

*   **Backup and Restore**: Creating backups of your model definitions.
*   **Sharing Models**: Collaborating with other developers or sharing models across different DYMER instances.
*   **Version Control**: Managing model definitions in an external version control system.

By effectively utilizing the Model Editor, you can create flexible and robust data structures that perfectly match your application's requirements.
