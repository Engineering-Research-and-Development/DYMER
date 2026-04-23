# 04 - Guide to Handlebars Template Creation in DYMER

DYMER leverages **Handlebars.js** for its template delivery engine, enabling the creation of powerful yet logic-less graphic templates. This guide will walk you through the process of creating and managing these templates within the DYMER Admin Panel, ensuring your data models are beautifully rendered.

## Understanding Handlebars Templates

Handlebars is a simple templating language that allows you to separate your data from your presentation. It works by compiling templates into functions that take a context (your data model) and return HTML or other text formats. The key principle is "logic-less" templating, meaning templates should focus solely on displaying data, not on complex business logic.

## Accessing the Template Editor

To create or modify templates, navigate to the **Templates** section within the DYMER Admin Panel. This section provides access to the Template Editor, an integrated environment for writing and managing your Handlebars templates.

![Template Editor Interface](placeholder_ws-template-editor.png)
*Placeholder: Screenshot of the DYMER Template Editor (ws-template-editor.png)*

## Creating a New Template

Follow these steps to create a new Handlebars template:

1.  **Navigate to Templates**: In the Admin Panel, click on the 'Templates' menu item.
2.  **Initiate New Template**: Look for a button or option like 'Create New Template' or 'Add Template'.
3.  **Define Template Name and Description**: Provide a unique name for your template (e.g., `ProductDetail`, `UserCard`, `ArticleList`) and an optional description.
4.  **Select Associated Model**: Link the template to a specific data model you created in the Model Editor. This tells DYMER which data structure this template is designed to render.
5.  **Write Handlebars Code**: In the provided editor, write your Handlebars template code. You will use Handlebars expressions to embed data from your associated model into the HTML structure.
6.  **Preview Template**: Utilize the preview functionality to see how your template will render with sample data. This allows for iterative design and debugging.
7.  **Save the Template**: Once satisfied with your template, save it. It will then be available for use in rendering entities.

### Basic Handlebars Syntax

Handlebars expressions are enclosed in double curly braces `{{ }}`. Here are some common usages:

*   **Displaying Data**: `{{propertyName}}` will output the value of `propertyName` from your data context.
    ```handlebars
    <h1>{{productName}}</h1>
    <p>Price: {{price}} {{currency}}</p>
    ```

*   **Conditionals (if/else)**: Use `{{#if condition}}...{{else}}...{{/if}}` for conditional rendering.
    ```handlebars
    {{#if inStock}}
        <span class="badge bg-success">In Stock</span>
    {{else}}
        <span class="badge bg-danger">Out of Stock</span>
    {{/if}}
    ```

*   **Iterating over Lists (each)**: Use `{{#each arrayName}}...{{/each}}` to loop through arrays.
    ```handlebars
    <ul>
    {{#each tags}}
        <li>{{this}}</li>
    {{/each}}
    </ul>
    ```

*   **Helpers**: Handlebars supports custom helpers for more complex formatting or logic. DYMER might provide built-in helpers or allow you to define your own.

### Example: Product Detail Template

Assuming a `Product` model as defined in `03-model-definition.md`, a simple template could look like this:

```handlebars
<div class="product-detail">
    <h2>{{name}}</h2>
    <p class="description">{{description}}</p>
    <div class="price-info">
        Price: <strong>{{price}} {{currency}}</strong>
    </div>
    {{#if inStock}}
        <span class="badge bg-success">Available</span>
    {{else}}
        <span class="badge bg-danger">Currently Unavailable</span>
    {{/if}}
</div>
```

## Modifying Existing Templates

To modify an existing template:

1.  **Select Template**: From the 'Templates' list, click on the template you wish to edit.
2.  **Make Changes**: Use the Template Editor to update the Handlebars code.
3.  **Preview and Save**: Always preview your changes to ensure they render as expected, then save the updated template.

## Template Assignment and Usage

Once a template is created, it needs to be assigned to a data model or used explicitly when rendering entities. DYMER's `dymer-templates` microservice is responsible for taking a data entity and an associated template, and then rendering the final output.

By mastering Handlebars template creation, you can design highly customizable and dynamic presentations for your data within the DYMER platform.
