# BeyondJS Widgets

## Introduction

Beyond-JS Widgets is a versatile web-components framework designed for developers to create a range of web solutions
from simple widgets to comprehensive applications. It seamlessly integrates with popular frameworks like React, Vue, and
Svelte and supports various rendering methods like Server-Side, Static, and Client-Side Rendering. This flexibility
enhances performance and user experience.

## Features

### Versatility and Integration

-   **Pages and Layouts:** Widgets can represent entire pages or layouts, simplifying complex web application
    construction.
-   **Elements in Existing Applications:** Easily integrate widgets as individual elements in existing applications.

### Modular and Universal Development

-   **Modular Design:** Each widget is a distinct module, improving code management and efficiency.
-   **Universal Application:** Widgets function seamlessly on both client and server sides.

### Framework Integration

-   **CSS Encapsulation:** Styles are isolated within each web component, preventing conflicts and ensuring stable
    styling.
-   **Reusability:** Widgets are reusable across different parts of an application, easing maintenance and updates.

## Widget System

### Modular Design

Widgets are automatically loaded when their corresponding web elements are inserted into the DOM. This lazy loading
ensures optimal performance and resource use.

### Controller's Role

-   **Controller:** A critical component within each JS+CSS module, coordinating the rendering of the widget into HTML.
-   **Rendering Modes:** Widgets detect the necessary rendering mode upon DOM insertion, enhancing rendering efficiency.

### Integration with View Frameworks

Widgets are compatible with various JavaScript frameworks, enabling them to serve multiple roles, such as pages or
layouts, through simple settings.

## Rendering and Hydration

Widgets support hybrid rendering techniques and facilitate the hydration process, smoothly transitioning from
server-rendered content to dynamic client-side updates.

### Rendering Options

-   **Server-Side Rendering (SSR):** Dynamically generates HTML on the server, improving load times.
-   **Static Rendering (SR):** Pre-resolves and compiles HTML content, optimizing mobile performance.
-   **Client-Side Rendering (CSR):** Renders content on the client side, suitable for dynamic applications.

### Web Composition Suite (WCS)

-   **Single-Page Applications:** WCS enhances user experience in SPAs by managing routing, layout, and transitions.
-   **Layout Containers:** The `beyond-layout-children` web component manages layouts and dynamic content, supporting a
    hierarchical application structure.

## Documentation

For more information, read the [BeyondJS widgets documentation](https://beyondjs.com/docs/widgets).
