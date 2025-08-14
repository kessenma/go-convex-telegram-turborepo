# RAG Modules for Lightweight LLM

This directory contains specialized modules for handling different types of RAG (Retrieval-Augmented Generation) queries. These modules provide a modular and extensible approach to processing different types of queries without hardcoding patterns in the main application.

## Overview

The RAG system consists of three main modules:

1. **quantitative_rag.py** - Handles numeric/quantitative queries (e.g., "What is the severance amount?")
2. **qualitative_rag.py** - Handles descriptive/qualitative queries (e.g., "What is the purpose of the program?")
3. **rag_processor.py** - Provides a unified interface that combines both approaches

## How It Works

The system automatically detects the type of query and applies the appropriate processing:

1. **Query Classification**: Determines if a query is quantitative, qualitative, mixed, or general
2. **Context Prioritization**: Prioritizes relevant sections of the document based on query type
3. **Prompt Enhancement**: Creates specialized prompts tailored to the query type
4. **Fallback Mechanism**: Falls back to general processing if specialized modules fail

## Query Types

### Quantitative Queries

Queries asking for numeric information, such as:
- "How much is the severance payment?"
- "What is the total amount?"
- "What is the dollar value of the benefit?"

These queries are processed by `quantitative_rag.py`, which:
- Extracts numeric values from the query
- Prioritizes document sections containing matching numeric values
- Creates prompts that instruct the LLM to focus on extracting precise numeric information

### Qualitative Queries

Queries asking for descriptive information, such as:
- "What is the purpose of the program?"
- "How does the benefit work?"
- "Explain the eligibility criteria"

These queries are processed by `qualitative_rag.py`, which:
- Extracts key terms from the query
- Prioritizes document sections containing these key terms
- Creates prompts that instruct the LLM to focus on providing clear explanations

### Mixed Queries

Queries containing both quantitative and qualitative aspects, such as:
- "Explain how the severance amount is calculated"
- "What are the eligibility requirements for the $6,000 benefit?"

These queries are processed by combining both approaches, prioritizing sections that contain both numeric values and key terms.

## Extending the System

You can extend the system by:

1. **Adding New Query Types**: Create new specialized modules for other types of queries
2. **Enhancing Detection Logic**: Improve the query classification in each module
3. **Customizing Prompts**: Modify the prompt templates for different query types
4. **Adding Pre/Post Processing**: Add additional processing steps for specific use cases

## Usage

The system is automatically used by the main application. When a query is received:

1. The `format_chat_prompt` function in `main.py` calls `process_rag_query` from `rag_processor.py`
2. The processor determines the query type and applies the appropriate processing
3. The enhanced prompt is returned to the main application for LLM processing

## Example

For a query like "What is the severance amount in this document?":

1. The system identifies this as a quantitative query
2. It prioritizes document sections containing dollar amounts
3. It creates a prompt that instructs the LLM to focus on extracting the specific numeric value
4. The LLM responds with the precise severance amount ($6,000)

## Benefits

This modular approach offers several advantages:

1. **Maintainability**: No hardcoded patterns in the main application
2. **Extensibility**: Easy to add new query types and processing logic
3. **Flexibility**: Different processing strategies for different query types
4. **Robustness**: Fallback mechanisms ensure the system works even if specialized processing fails
5. **Performance**: Prioritizing relevant sections improves response quality and reduces token usage
