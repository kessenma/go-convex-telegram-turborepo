# Embedding Atlas Integration

## What We've Built

I've integrated a custom embedding visualization system into your RAG data page that:

1. **Fetches embedding data** from your Convex database via a new API endpoint
2. **Visualizes embeddings** in a 2D scatter plot showing document relationships
3. **Shows metadata** including document titles, chunk information, and embedding details
4. **Provides interactive features** like hover tooltips and detailed views

## Current Implementation

### Components Created:
- `EmbeddingAtlasViewer.tsx` - Main visualization component
- `apps/web/app/api/embeddings/atlas-data/route.ts` - API endpoint for embedding data
- `getAllEmbeddingsForAtlas` query in `embeddings.ts` - Convex query with document metadata

### Features:
- ✅ 2D scatter plot visualization of embeddings
- ✅ Color-coded points for different documents
- ✅ Hover tooltips with document details
- ✅ Statistics display (total embeddings, documents)
- ✅ Detailed grid view of embedding metadata
- ✅ Loading states and error handling

## How to Enhance with Full Embedding Atlas

The current implementation uses a simple 2D projection. To use the full Apple Embedding Atlas library:

### 1. Proper Data Coordinator
```typescript
// You'll need to implement a proper Mosaic coordinator
import { Coordinator } from "@observablehq/mosaic-core";

const coordinator = new Coordinator();
```

### 2. Better 2D Projections
```typescript
// Add UMAP or t-SNE for better 2D projections
import { UMAP } from 'umap-js';

const umap = new UMAP({
  nComponents: 2,
  nNeighbors: 15,
  minDist: 0.1
});

const projection = umap.fit(embeddings);
```

### 3. Enhanced Features
- **Clustering**: Automatic grouping of similar embeddings
- **Search**: Find similar embeddings to a query
- **Filtering**: Filter by document type, date, etc.
- **Density visualization**: Show embedding density contours

## Usage

The embedding visualization is now available on your RAG data page at `/RAG-data`. Users can:

1. Click "Show Atlas" to load the visualization
2. Hover over points to see document details
3. View detailed metadata in the grid below
4. Refresh data with the refresh button

## Data Flow

1. **Convex Database** → `document_embeddings` table with 384D vectors
2. **API Endpoint** → `/api/embeddings/atlas-data` transforms data for visualization
3. **Component** → Renders 2D scatter plot and metadata views
4. **User Interaction** → Hover, click, and explore embeddings

## Next Steps

1. **Install proper Mosaic coordinator** for full Embedding Atlas features
2. **Add UMAP/t-SNE** for better 2D projections
3. **Implement clustering** to group similar documents
4. **Add search functionality** to find similar embeddings
5. **Enhance interactivity** with selection and filtering

The foundation is solid - you now have a working embedding visualization that can be enhanced with the full Embedding Atlas capabilities as needed!