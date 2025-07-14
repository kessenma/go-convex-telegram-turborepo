# LLM Integration Guide for Legal/Academic Document Chat

This guide outlines your options for integrating a Large Language Model (LLM) into your RAG (Retrieval-Augmented Generation) system for legal and academic document analysis.

## 🎯 Current Status

✅ **Completed:**
- Document upload and storage system
- Vector embedding infrastructure (ready for local embeddings)
- RAG chat interface with document selection
- Vector search API endpoints
- Chat API structure (placeholder LLM integration)

🔄 **Next Steps:**
- Choose and integrate LLM
- Set up local embedding service
- Implement proper prompt engineering for legal/academic use

## 🤖 LLM Options for Your Use Case

### 1. **Microsoft Phi-3 (Recommended for Legal/Academic)**
- **Size**: 3.8B parameters (Phi-3-mini)
- **Strengths**: Excellent reasoning, good for professional documents
- **Memory**: ~8GB RAM
- **Speed**: Fast inference on CPU/GPU
- **License**: MIT (commercial friendly)

### 2. **Meta Llama 3.1 8B**
- **Size**: 8B parameters
- **Strengths**: Strong general performance, good instruction following
- **Memory**: ~16GB RAM
- **Speed**: Moderate inference speed
- **License**: Custom (check for commercial use)

### 3. **Llama 3.2 3B (Lightweight Option)**
- **Size**: 3B parameters
- **Strengths**: Smaller, faster, still capable
- **Memory**: ~6GB RAM
- **Speed**: Very fast inference
- **License**: Custom (check for commercial use)

## 🏗️ Architecture Options

### Option A: Go Server Integration (Recommended)
```
User → Next.js → Go Server (with LLM) → Convex DB
                     ↓
              Local Embedding Service
```

**Pros:**
- Single additional service
- Go is fast and efficient
- Direct integration with your existing bot

**Implementation:**
1. Add LLM inference to your Go server using:
   - `ollama` (easiest)
   - `llama.cpp` Go bindings
   - HTTP calls to Python service

### Option B: Separate LLM Container
```
User → Next.js → LLM Container → Convex DB
                     ↓
              Embedding Container
```

**Pros:**
- Isolated LLM service
- Easy to scale/replace
- Language flexibility

## 🚀 Quick Start Implementation

### Step 1: Set Up Local Embeddings (Replace OpenAI)

```bash
# Install sentence-transformers server
pip install sentence-transformers fastapi uvicorn
```

Create `embedding-server.py`:
```python
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dimensions

@app.post("/embeddings")
async def create_embedding(text: str):
    embedding = model.encode([text])[0]
    return {"embedding": embedding.tolist()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Step 2: Update Convex Schema for Local Embeddings

Update your vector index dimensions from 1536 (OpenAI) to 384 (MiniLM):

```typescript
// In schema.ts
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 384, // Changed from 1536
  filterFields: ["isActive"]
})
```

### Step 3: Choose LLM Integration Method

#### Method A: Ollama (Easiest)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Phi-3
ollama pull phi3:mini

# Or pull Llama
ollama pull llama3.1:8b
```

Update your Go server:
```go
func callLLM(prompt string) (string, error) {
    resp, err := http.Post("http://localhost:11434/api/generate", 
        "application/json", 
        strings.NewReader(fmt.Sprintf(`{
            "model": "phi3:mini",
            "prompt": "%s",
            "stream": false
        }`, prompt)))
    // Handle response...
}
```

#### Method B: Docker Container
Create `docker-compose.yml` addition:
```yaml
services:
  llm-service:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
  
  embedding-service:
    build: ./embedding-service
    ports:
      - "8001:8001"
```

### Step 4: Update Chat API

Replace the placeholder in `/api/RAG/chat/route.ts`:

```typescript
async function generateLLMResponse(
  userMessage: string, 
  context: string, 
  conversationHistory?: { role: 'user' | 'assistant'; content: string; }[]
): Promise<string> {
  const prompt = `You are a legal/academic research assistant. Answer the user's question based on the provided context from their documents.

Context:
${context}

Conversation History:
${conversationHistory?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'None'}

User Question: ${userMessage}

Provide a detailed, accurate answer based on the context. If the context doesn't contain enough information, say so clearly.`;

  // Call your LLM service (Go server or Docker container)
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'phi3:mini',
      prompt: prompt,
      stream: false
    })
  });

  const result = await response.json();
  return result.response;
}
```

## 📋 Implementation Checklist

### Phase 1: Local Embeddings
- [ ] Set up sentence-transformers server
- [ ] Update Convex schema dimensions (1536 → 384)
- [ ] Update embedding generation in Convex functions
- [ ] Test vector search with new embeddings

### Phase 2: LLM Integration
- [ ] Choose LLM (Phi-3 recommended)
- [ ] Set up Ollama or alternative
- [ ] Update Go server or create LLM service
- [ ] Implement chat API integration
- [ ] Test end-to-end chat functionality

### Phase 3: Legal/Academic Optimization
- [ ] Implement legal-specific prompts
- [ ] Add citation formatting
- [ ] Implement document confidence scoring
- [ ] Add legal disclaimer handling

## 🔧 Code Changes Needed

### 1. Update Embedding Service URL
In `embeddings.ts`, replace OpenAI calls:
```typescript
// Replace this:
const response = await fetch("https://api.openai.com/v1/embeddings", {
  // OpenAI config
});

// With this:
const response = await fetch("http://localhost:8001/embeddings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: text })
});
```

### 2. Update Vector Dimensions
In `schema.ts`:
```typescript
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 384, // Changed from 1536
  filterFields: ["isActive"]
})
```

### 3. Add LLM Service to Go Server
Add to your `main.go`:
```go
func handleLLMRequest(w http.ResponseWriter, r *http.Request) {
    // Parse request
    // Call Ollama or your LLM service
    // Return response
}
```

## 💡 Legal/Academic Specific Features

### Prompt Engineering for Legal Use
```typescript
const legalPrompt = `You are a legal research assistant. When answering:
1. Always cite specific document sections
2. Distinguish between facts and legal opinions
3. Note any jurisdictional limitations
4. Highlight conflicting information
5. Use precise legal terminology

Context: ${context}
Question: ${userMessage}`;
```

### Academic Research Features
```typescript
const academicPrompt = `You are an academic research assistant. When answering:
1. Provide detailed citations
2. Note methodology limitations
3. Highlight contradictory findings
4. Suggest related research areas
5. Maintain scholarly tone

Context: ${context}
Question: ${userMessage}`;
```

## 🎯 Next Steps

1. **Choose your LLM**: I recommend starting with Phi-3 mini for legal/academic use
2. **Set up local embeddings**: Replace OpenAI with sentence-transformers
3. **Integrate with Go server**: Add LLM endpoints to your existing bot
4. **Test with legal documents**: Upload some legal/academic PDFs and test
5. **Optimize prompts**: Fine-tune for your specific use case

Would you like me to help implement any of these steps? I can start with the local embedding setup or help you integrate Ollama with your Go server.