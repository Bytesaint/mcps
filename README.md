# MPCS UI Prototype

This is the Phase 1 UI Prototype for the MPCS (Mobile Phone Comparison System).
It is a single-page application built with React, TypeScript, Vite, and TailwindCSS.

## Project Structure

- `src/pages`: Page components (Dashboard, Phones, Rules, etc.)
- `src/components`: Reusable UI components (Button, Modal, Table, etc.)
- `src/mock`: Mock data layer and Context provider
- `src/actionMap.ts`: Central registry of all Action IDs

## Prerequisites

- Node.js (v16+)
- npm

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

3.  **Build for Production**
    ```bash
    npm run build
    ```

## Key Features

- **Action IDs**: specific `data-action` attributes on all interactive elements for future analytics/automation.
- **Mock Data**: Local state management simulating a real backend.
- **Responsive Design**: Mobile-friendly layout with collapsible sidebar.

## Important Note

This is a UI-only prototype. Changes are saved to local memory and will be reset upon page reload.
