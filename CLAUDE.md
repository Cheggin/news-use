# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application using React + TypeScript frontend with Convex as the real-time backend platform. The project uses Vite for building and Tailwind CSS for styling.

## Development Commands

```bash
# Start development (frontend + backend in parallel)
npm run dev

# Run only frontend (Vite)
npm run dev:frontend

# Run only backend (Convex)
npm run dev:backend

# Build for production
npm run build

# Run linting
npm run lint
```

## Architecture

### Convex Backend (`/convex`)
- **Schema**: Define database tables in `convex/schema.ts` using Convex's schema builder
- **Functions**: Write queries, mutations, and actions in separate files under `/convex`
  - Queries: Read-only functions that fetch data
  - Mutations: Functions that modify database state
  - Actions: Functions that can call external APIs or perform side effects
- **Generated types**: Located in `convex/_generated/` (auto-generated, don't edit)

### Frontend Integration
- **Provider Setup**: The Convex provider wraps the app in `src/main.tsx`
- **Hooks**: Use `useQuery`, `useMutation`, and `useAction` from `convex/react` to interact with backend
- **Real-time**: All queries are real-time by default - components re-render when data changes

### Key Patterns

**Defining Convex Functions**:
```typescript
// In convex/myFunctions.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getData = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Using in React Components**:
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function Component() {
  const data = useQuery(api.myFunctions.getData, { id: "123" });
  const mutate = useMutation(api.myFunctions.updateData);
}
```

## Configuration Details

- **Convex Deployment**: `dev:determined-gazelle-105`
- **TypeScript**: Strict mode enabled with path alias `@/` → `./src/`
- **ESLint**: Configured with TypeScript and React rules (relaxed for learning)
- **Tailwind**: Dark/light mode support with CSS variables

## Important Notes

- Convex functions run on Convex's servers, not locally
- The `convex/_generated/` directory is auto-generated - never edit these files
- Use Convex validators (`v.string()`, `v.number()`, etc.) for type-safe arguments
- Authentication context exists but no auth provider is configured yet