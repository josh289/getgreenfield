# vite-react-typescript-starter (Cntxtl Landing Page)

This project is a landing page built with Vite, React, and TypeScript, using Tailwind CSS for styling.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (which includes npm)

## Getting Started

1.  **Navigate to the project directory:**
    If you are in the workspace root, change to the `project` directory:
    ```bash
    cd project
    ```

2.  **Install dependencies:**
    Install all the necessary project dependencies using npm:
    ```bash
    npm install
    ```

3.  **Run the development server:**
    To start the Vite development server and view the site locally:
    ```bash
    npm run dev
    ```
    This will typically start the server on `http://localhost:5173/`. Open this URL in your web browser. The server will automatically reload when you make changes to the code.

## Available Scripts

In the `project` directory, you can run the following scripts:

-   ### `npm run dev`
    Starts the development server.

-   ### `npm run build`
    Builds the application for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

-   ### `npm run lint`
    Lints the project files using ESLint to check for code quality and potential errors. You might also be able to run this with `npx eslint .`.

-   ### `npm run preview`
    Serves the production build locally from the `dist` directory. This is useful for testing the production build before deploying.

## Project Structure

A brief overview of the key directories:

-   `public/`: Contains static assets that are copied directly to the build output directory without processing by Vite.
-   `src/`: Contains the main source code for the application.
    -   `assets/`: For static assets like images, fonts, etc., that are imported into your components.
    -   `components/`: Reusable React components.
        -   `ui/`: UI-specific components (e.g., buttons, modals).
    -   `App.tsx`: The main application component.
    -   `main.tsx`: The entry point of the application, where the React app is mounted to the DOM.
-   `index.html`: The main HTML page that serves as the entry point for the Vite application.
-   `vite.config.ts`: Vite configuration file.
-   `tailwind.config.js`: Tailwind CSS configuration.
-   `tsconfig.json`: TypeScript configuration for the project.
-   `eslint.config.js`: ESLint configuration.

## Learn More

-   [Vite Documentation](https://vitejs.dev/guide/)
-   [React Documentation](https://reactjs.org/docs/getting-started.html)
-   [TypeScript Documentation](https://www.typescriptlang.org/docs/)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs/) 