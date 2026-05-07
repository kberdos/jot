Jot
===

Core repository for CS1377's final project. Authored by Kazuya Erdos, Lyra Ymeraga, Emily Olson, and Rachel Brooks.

## Prerequisites
- `pnpm` is preferred
- NextJS with the [App Router](https://nextjs.org/docs/app) is required.
- Since this project is not development-ready on Google Cloud, you *must* be added as a test user to the deployment. CS1377 staff have all been added.

- You must also have access to the environment secrets to the run the project locally:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```


## Running locally

To get started, run

```bash
pnpm i # install deps
pnpm dev # start the dev server
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `app/` : App Router root that contains the pages and API routes.
    - `app/page.tsx` : Home page that handles login, board creation/deletion, and the "my boards" / "shared boards" dashboard.
    - `app/boards/[board_id]/page.tsx` : Main board page. Loads board state, subscribes to Supabase realtime updates, and renders the board overlay.
    - `app/api/gemini/route.ts` : Server route for JotChat's Gemini calls and board-editing tool actions.
    - `app/api/board-share/route.ts` : Server route for adding, listing, and removing people with access to a board.
    - `app/api/shared-boards/route.ts` : Server route for loading boards shared with the current user.
- `components/` : Contains the React components that make up the board UI.
    - `Canvas.tsx`, `NoteCard.tsx`, `Section.tsx`, and `Arrow.tsx` : The interactive board surface and board objects.
    - `CanvasToolbar.tsx`, `useCanvasGestures.ts`, and `useCanvasHotkeys.ts` : Canvas controls, pan/zoom gestures, and keyboard shortcuts split out from the main canvas.
    - `BoardNavbar.tsx`, `BoardShareDialog.tsx`, and `BoardPreview.tsx` : Board controls, sharing UI, and dashboard previews.
    - `JotChat.tsx`, `TableView.tsx`, `Collab.tsx`, and `Overlay.tsx` : Chat, alternate table view, collaborator cursors, and the main board wrapper.
- `util/` : Contains shared state, data helpers, and service clients.
    - `util/objects/` : Zustand stores and types for boards, notes, arrows, sections, camera state, chat state, and collaborators.
    - `util/auth/` : Supabase auth helpers and auth state.
    - `util/supabase/` : Supabase browser and server clients.
    - `util/tableData.ts`, `util/noteCoordinates.ts`, and `util/pointerfunctions.ts` : Board helper functions used by multiple components.
- `assets/` : Image assets.
- `public/` : Static files served directly.
