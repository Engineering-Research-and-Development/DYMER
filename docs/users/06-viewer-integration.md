# 06 - Integrating the DYMER JavaScript Viewer

DYMER provides a ready-to-use JavaScript viewer library that simplifies the integration of dynamically rendered content into any web application. This guide will explain how to incorporate the DYMER Viewer into your frontend projects, allowing you to display entities managed by DYMER with minimal effort.

## Understanding the DYMER Viewer

The DYMER JavaScript Viewer is a client-side library designed to fetch data entities from the DYMER API Gateway (`dymer-webserver`) and render them using the Handlebars templates defined in the DYMER Admin Panel. It acts as a bridge between your frontend application and the DYMER backend, abstracting away the complexities of API calls and template rendering.

## Key Features of the Viewer

*   **Easy Integration**: Drop-in library for quick setup.
*   **Dynamic Rendering**: Automatically fetches and renders entities based on their associated templates.
*   **Search and Filtering**: Supports client-side search and filtering of displayed entities.
*   **Customizable**: Allows for customization of rendering behavior and styling.
*   **Event-Driven**: Provides events for interacting with the rendered content.

## Integration Steps

Integrating the DYMER Viewer into your web application typically involves the following steps:

### 1. Include the Viewer Library

The first step is to include the DYMER Viewer JavaScript library in your HTML file. You can typically do this by adding a `<script>` tag to your `index.html` or equivalent file.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My DYMER Application</title>
    <!-- Link to your CSS files here -->
</head>
<body>
    <div id="dymer-content-container"></div>

    <!-- Include the DYMER Viewer library -->
    <script src="https://your-dymer-cdn/dymer-viewer.min.js"></script>
    <script>
        // Your application-specific JavaScript will go here
    </script>
</body>
</html>
```

**Note**: Replace `https://your-dymer-cdn/dymer-viewer.min.js` with the actual URL to the DYMER Viewer library, which would typically be served by your `dymer-webserver` or a CDN.

### 2. Initialize the Viewer

Once the library is included, you need to initialize the viewer, specifying the API endpoint and the container where the content should be rendered.

```javascript
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const dymerViewer = new DymerViewer({
            apiGatewayUrl: 'http://localhost:8080/api/v1', // Replace with your DYMER API Gateway URL
            containerId: 'dymer-content-container' // The ID of the HTML element where content will be rendered
        });

        // You can now use dymerViewer methods to fetch and render content
    });
</nscript>
```

### 3. Fetch and Render Entities

After initialization, you can use the `dymerViewer` instance to fetch and render entities. The viewer typically provides methods to fetch single entities, lists of entities, and apply search/filter parameters.

#### Rendering a List of Entities

To render a list of entities (e.g., all products):

```javascript
dymerViewer.renderEntityList('product', { // 'product' is the model name
    // Optional: add search and filter parameters
    search: 'electronics',
    filters: {
        price: { $gt: 100 }
    },
    sort: { name: 1 } // Sort by name ascending
})
.then(() => console.log('Product list rendered successfully'))
.catch(error => console.error('Error rendering product list:', error));
```

![Render List with Filters](placeholder_render-list-filtersnippets.png)
*Placeholder: Screenshot of a rendered list with filter snippets (render-list-filtersnippets.png)*

#### Rendering a Single Entity

To render a specific entity by its ID:

```javascript
dymerViewer.renderSingleEntity('product', 'product-id-123') // 'product' is model name, 'product-id-123' is entity ID
.then(() => console.log('Single product rendered successfully'))
.catch(error => console.error('Error rendering single product:', error));
```

#### Example: Map Integration

DYMER Viewer can also be integrated with other JavaScript libraries for richer visualizations, such as maps.

![HTML Map Integration](placeholder_html_map.jpg)
*Placeholder: Screenshot of an HTML map integration example (html_map.jpg)*

## Customization and Advanced Usage

The DYMER Viewer often exposes options for advanced customization:

*   **Custom Templates**: While DYMER manages templates on the backend, you might be able to override or provide client-side templates for specific use cases.
*   **Event Handling**: Listen to events triggered by the viewer (e.g., `entityRendered`, `searchPerformed`) to implement custom logic or UI updates.
*   **Styling**: The rendered content will inherit styles from your application's CSS. You can also define specific CSS rules to target elements rendered by the viewer.
*   **Error Handling**: Implement robust error handling for API calls and rendering processes.

By following these integration steps, you can effectively leverage the DYMER JavaScript Viewer to bring your dynamic content to life within your web applications.
