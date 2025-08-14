# LangExtract Integration for Enhanced RAG

This document explains the integration of Google's LangExtract library into the RAG chatbot system for improved query classification and information extraction.

## Overview

LangExtract enhances the RAG system by providing:

1. **Sophisticated Query Classification**: Better understanding of whether queries are quantitative, qualitative, or mixed
2. **Precise Information Extraction**: Structured extraction of relevant entities from documents
3. **Source Grounding**: Maps extractions to their exact locations in source text
4. **Flexible LLM Support**: Works with both cloud and local models

## Architecture

### New Components

- `langextract_rag.py`: Main LangExtract integration module
- `LangExtractRAGProcessor`: Core processor class
- Enhanced query classification with confidence scores
- Structured entity extraction with relevance scoring

### Integration Points

- `main.py`: Updated to use enhanced RAG processing
- New `/classify-query` endpoint for testing query classification
- Enhanced chat responses with RAG metadata
- Fallback to original processors if LangExtract fails

## Installation

### Option 1: Automatic Setup
```bash
cd apps/lightweight-llm
python install_langextract.py
```

### Option 2: Manual Setup
```bash
pip install langextract

# For local model support (recommended)
# Install Ollama: https://ollama.ai/
ollama pull llama3.2:1b
```

## Configuration

The system is configured to use local Ollama models by default to avoid API key requirements:

```python
# Default configuration in langextract_rag.py
model_name = "ollama/llama3.2:1b"
```

### Using Cloud Models (Optional)

To use cloud models like Gemini, set up API keys:

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

Then modify the model configuration:
```python
model_name = "gemini/gemini-1.5-flash"
```

## Features

### Enhanced Query Classification

The system now classifies queries with detailed analysis:

```python
classification = processor.classify_query("How much did we spend on marketing?")
# Returns:
# - query_type: "quantitative"
# - confidence: 0.95
# - key_entities: ["marketing spend"]
# - expected_answer_type: "numeric_value"
# - extraction_focus: ["spending", "marketing", "financial_data"]
```

### Structured Information Extraction

Extracts relevant entities with context and relevance scores:

```python
entities = processor.extract_relevant_information(context, query, classification)
# Returns list of ExtractedEntity objects with:
# - entity_type: "financial_figure"
# - text: "$450,000"
# - context: "Marketing expenses totaled $450,000 in Q3..."
# - relevance_score: 0.85
```

### Enhanced Chat Responses

Chat responses now include detailed metadata:

```json
{
  "response": "The company spent $450,000 on marketing in Q3 2023...",
  "rag_metadata": {
    "classification": {
      "query_type": "quantitative",
      "confidence": 0.95,
      "key_entities": ["marketing spend"],
      "expected_answer_type": "numeric_value"
    },
    "extracted_entities": [
      {
        "type": "financial_figure",
        "text": "$450,000",
        "relevance_score": 0.85
      }
    ],
    "langextract_available": true
  }
}
```

## API Endpoints

### New Endpoint: Query Classification

```bash
POST /classify-query
Content-Type: application/json

{
  "query": "How much did we spend on marketing?"
}
```

Response:
```json
{
  "query_type": "quantitative",
  "confidence": 0.95,
  "key_entities": ["marketing spend"],
  "expected_answer_type": "numeric_value",
  "extraction_focus": ["spending", "marketing", "financial_data"],
  "langextract_available": true
}
```

### Enhanced Chat Endpoint

The existing `/chat` endpoint now returns enhanced metadata in the `rag_metadata` field.

## Testing

Run the integration tests:

```bash
cd apps/lightweight-llm
python test_langextract_integration.py
```

This will test:
- Query classification accuracy
- Information extraction functionality
- Complete RAG processing pipeline
- API compatibility

## Fallback Behavior

The system gracefully handles LangExtract unavailability:

1. **LangExtract Available**: Uses sophisticated classification and extraction
2. **LangExtract Unavailable**: Falls back to original regex-based classification
3. **Both Fail**: Uses basic default prompting

This ensures the system remains functional even if LangExtract cannot be installed or configured.

## Performance Considerations

- **Local Models**: Slower but no API costs or external dependencies
- **Cloud Models**: Faster but requires API keys and internet connectivity
- **Caching**: Consider implementing query classification caching for repeated queries
- **Batch Processing**: LangExtract supports batch processing for multiple queries

## Monitoring and Debugging

Check the enhanced logging for insights:

```
INFO:langextract_rag:LangExtract classification: quantitative (confidence: 0.95)
INFO:langextract_rag:Extracted 3 relevant entities
INFO:main:Using enhanced RAG processor with LangExtract
```

The `/model-info` endpoint now includes LangExtract status:

```json
{
  "langextract": {
    "available": true,
    "model": "ollama/llama3.2:1b"
  }
}
```

## Troubleshooting

### Common Issues

1. **LangExtract Import Error**
   ```bash
   pip install langextract
   ```

2. **Ollama Model Not Found**
   ```bash
   ollama pull llama3.2:1b
   ```

3. **Ollama Not Running**
   ```bash
   ollama serve
   ```

4. **API Key Issues (for cloud models)**
   ```bash
   export GOOGLE_API_KEY="your-key"
   ```

### Verification

Check system status:
```bash
curl http://localhost:8082/model-info
```

Test query classification:
```bash
curl -X POST http://localhost:8082/classify-query \
  -H "Content-Type: application/json" \
  -d '{"query": "How much revenue did we generate?"}'
```

## Future Enhancements

Potential improvements:
- Query classification caching
- Custom extraction schemas for domain-specific use cases
- Integration with document preprocessing pipeline
- Real-time extraction visualization
- Multi-language support

## Contributing

When contributing to the LangExtract integration:

1. Ensure backward compatibility with existing RAG processors
2. Add comprehensive error handling and fallbacks
3. Include tests for new functionality
4. Update documentation for new features
5. Consider performance implications of new extractions