# React Calendar Application

## Project Overview

This is a React-based calendar application that allows users to create and manage events. It leverages the FullCalendar library for displaying calendar events and provides a sidebar interface for adding both single and recurring events. The application also includes functionality for saving and loading schedules, with an option for basic encryption of the saved data.

## Features

*   **Event Management:** Add, view, edit, and delete single and recurring events.
*   **Recurring Events:** Support for complex weekly recurrence patterns over a defined period.
*   **Relative Events:** Create events that are relative to other events (single or recurring) or the calendar's start date, with customizable offsets (days before/after/on the same day).
*   **Soft Delete/Restore:** Events can be soft-deleted (removed from the main view but retained) and restored.
*   **Permanent Delete:** Option to permanently remove soft-deleted events and their dependents.
*   **Schedule Save/Load:** Save the current calendar schedule to a file and load a schedule from a file, with password-based encryption.
*   **Debug Mode:** A hidden debug option for saving/loading unencrypted data with randomized titles (for development purposes).

## Technologies Used

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Calendar:** FullCalendar
*   **Encryption:** Crypto-JS
*   **Testing:** Jest, React Testing Library
*   **Build Tool:** tsup

## Architecture

To be added.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   pnpm (preferred package manager)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd calendar-app
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running in Development Mode

To start the development server with hot-reloading:

```bash
pnpm dev
```

Open your browser to `http://localhost:3000` (or the address shown in your terminal).

### Building for Production

To build the application for production:

```bash
pnpm build
```

This will create a `dist` directory with the optimized production build.

### Running Tests

To run all tests:

```bash
pnpm test
```

## Development Conventions

*   **Coding Style:** Standard React and TypeScript conventions are followed.
*   **Testing:** Tests are written using Jest and React Testing Library, located in the `test` directory with `.test.tsx` extension.
*   **State Management:** React's built-in state management (`useState`, `useEffect`, `useMemo`) is used.

## Known Issues / TODOs

*   **Comprehensive Testing:** More extensive test coverage is needed for `App.tsx`, `SaveLoadControls.tsx`, and `eventUtils.tsx` to cover all edge cases and new functionalities (e.g., dependent event deletion, debug mode).
*   **UI/UX Refinements:** Further styling and layout adjustments may be needed for optimal user experience across different screen sizes and interactions.
