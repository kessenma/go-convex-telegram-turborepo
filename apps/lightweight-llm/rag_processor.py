"""
RAG Processor Module
===================

This module provides a unified interface for RAG processing,
combining both qualitative and quantitative approaches.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

# Import specialized modules
from quantitative_rag import (
    is_quantitative_query, 
    prioritize_numeric_sections, 
    format_quantitative_prompt
)
from qualitative_rag import (
    is_qualitative_query, 
    prioritize_relevant_sections, 
    format_qualitative_prompt
)

def process_rag_query(message: str, context: str) -> Tuple[str, str]:
    """
    Process a RAG query using the appropriate specialized module.
    This is the original/fallback processor.
    
    Args:
        message: The user's query
        context: The document context
        
    Returns:
        Tuple of (enhanced_message, enhanced_context)
    """
    # Check if this is a mixed query (contains both qualitative and quantitative aspects)
    is_mixed = is_quantitative_query(message) and is_qualitative_query(message)
    
    # Process based on query type
    if is_mixed:
        return process_mixed_query(message, context)
    elif is_quantitative_query(message):
        return process_quantitative_query(message, context)
    elif is_qualitative_query(message):
        return process_qualitative_query(message, context)
    else:
        # Default to a general approach for unclassified queries
        return process_general_query(message, context)

def process_quantitative_query(message: str, context: str) -> Tuple[str, str]:
    """Process a quantitative (numeric) query"""
    # Prioritize sections with numeric values
    enhanced_context = prioritize_numeric_sections(context, message)
    
    # Format the prompt for quantitative queries
    return format_quantitative_prompt(message, enhanced_context or context)

def process_qualitative_query(message: str, context: str) -> Tuple[str, str]:
    """Process a qualitative (descriptive) query"""
    # Prioritize relevant sections based on key terms
    enhanced_context = prioritize_relevant_sections(context, message)
    
    # Format the prompt for qualitative queries
    return format_qualitative_prompt(message, enhanced_context or context)

def process_mixed_query(message: str, context: str) -> Tuple[str, str]:
    """Process a mixed query (both qualitative and quantitative aspects)"""
    # For mixed queries, we'll use a combined approach
    
    # First, try to prioritize sections with numeric values
    numeric_context = prioritize_numeric_sections(context, message)
    
    # Then, within those sections, prioritize based on key terms
    if numeric_context and numeric_context != context:
        enhanced_context = prioritize_relevant_sections(numeric_context, message)
    else:
        # If numeric prioritization didn't change much, start with key term prioritization
        relevant_context = prioritize_relevant_sections(context, message)
        enhanced_context = prioritize_numeric_sections(relevant_context or context, message)
    
    # Create a combined prompt that addresses both aspects
    enhanced_message = message
    
    # Create an enhanced system message for mixed queries
    enhanced_context_prompt = (
        "You are a helpful AI assistant that excels at both extracting specific information and providing clear explanations. "
        "Answer questions based on the provided document information. Be thorough yet concise. "
        "Pay special attention to any numeric values, dollar amounts, or figures mentioned in the document that relate to the query. "
        "Also focus on explaining relevant concepts, processes, and relationships mentioned in the document. "
        "Provide a well-structured response that addresses all aspects of the query.\n\n"
        f"Document Information:\n{enhanced_context or context}"
    )
    
    return enhanced_message, enhanced_context_prompt

def process_general_query(message: str, context: str) -> Tuple[str, str]:
    """Process a general query that doesn't clearly fit into qualitative or quantitative categories"""
    # For general queries, use a balanced approach
    enhanced_message = message
    
    # Create a general-purpose system message
    enhanced_context = (
        "You are a helpful AI assistant. Answer questions based on the provided document information. "
        "Be concise and accurate. Pay attention to all details in the document, including any specific "
        "numbers, dates, values, concepts, or explanations that might be relevant to the query.\n\n"
        f"Document Information:\n{context}"
    )
    
    return enhanced_message, enhanced_context
