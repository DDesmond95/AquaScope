# Developer Guide

This document provides technical details for developers working on AquaScope Kuching.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Mapping**: React-Leaflet
- **GIS Logic**: Turf.js
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Project Structure

- `app/`: Next.js pages and layouts.
- `components/`: Reusable UI components.
  - `FloodMap.tsx`: The core mapping component using Leaflet.
- `lib/`: Utility functions and shared logic.
- `docs/`: Project documentation.
- `.github/workflows/`: CI/CD pipelines.

## Key Components

### FloodMap.tsx
This component handles the rendering of:
- Google Maps base layers.
- The flood overlay (Firetree.net tiles).
- GeoJSON layers for land parcels and infrastructure.
- User interactions (context menu, search).

## Deployment to GitHub Pages

The project is pre-configured for deployment to GitHub Pages at `https://ddesmond95.github.io/AquaScope/`.

1. **Configuration**: `next.config.ts` has been updated with:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     basePath: '/AquaScope',
     assetPrefix: '/AquaScope',
     trailingSlash: true,
     // ...
   };
   ```
2. **Repository Name**: If you rename your repository, you **MUST** update both `basePath` and `assetPrefix` in `next.config.ts` to match the new repository name.
3. **Workflow**: The GitHub Action `.github/workflows/deploy.yml` handles the build and deployment automatically on every push to `main`.

## Mock Data
Currently, land parcels and infrastructure are provided as mock GeoJSON in `components/FloodMap.tsx`. In a production environment, these should be fetched from a real GIS API (e.g., ArcGIS or a custom GeoServer).
