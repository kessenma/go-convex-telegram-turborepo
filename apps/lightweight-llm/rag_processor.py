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
    Process a RAG query by determining its type and applying the appropriate
    processing strategy.
    
    Args:
        message: The user's query
        context: The document context
        
    Returns:
        Tuple of (enhanced_message, enhanced_context)
    """
    is_quant = is_quantitative_query(message)
    is_qual = is_qualitative_query(message)
    
    # Determine query type and process accordingly
    if is_quant and is_qual:
        return process_mixed_query(message, context)
    elif is_quant:
        return process_quantitative_query(message, context)
    elif is_qual:
        return process_qualitative_query(message, context)
    else:
        return process_general_query(message, context)

def process_quantitative_query(message: str, context: str) -> Tuple[str, str]:
    """Process a quantitative query focusing on numerical information"""
    # Prioritize sections with numerical content
    prioritized_context = prioritize_numeric_sections(context)
    
    # Format the prompt to emphasize quantitative aspects
    enhanced_context = format_quantitative_prompt(prioritized_context)
    
    return message, enhanced_context

def process_qualitative_query(message: str, context: str) -> Tuple[str, str]:
    """Process a qualitative query focusing on concepts and explanations"""
    # Prioritize sections most relevant to the query
    prioritized_context = prioritize_relevant_sections(message, context)
    
    # Format the prompt to emphasize qualitative aspects
    enhanced_context = format_qualitative_prompt(prioritized_context)
    
    return message, enhanced_context

def process_mixed_query(message: str, context: str) -> Tuple[str, str]:
    """Process a query with both quantitative and qualitative aspects"""
    # For mixed queries, combine both approaches
    # First prioritize by relevance
    relevant_context = prioritize_relevant_sections(message, context)
    
    # Then ensure numerical sections are highlighted
    prioritized_context = prioritize_numeric_sections(relevant_context)
    
    # Create a balanced prompt that addresses both aspects
    enhanced_context = (
        "You are a helpful AI assistant. Answer the question based on the provided document information. "
        "Pay special attention to both numerical data (statistics, measurements, quantities) AND "
        "conceptual explanations or qualitative descriptions in the document.\n\n"
        f"Document Information:\n{prioritized_context}"
    )
    
    return message, enhanced_context

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
