"""
Quantitative RAG Module
=======================

This module handles quantitative (numeric) queries for the RAG system.
It specializes in identifying and extracting numeric information from documents.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

def extract_numeric_values(text: str) -> List[str]:
    """Extract currency amounts and numeric values from text"""
    # Match currency amounts like $6,000 or 6,000 or 6000
    currency_regex = r'\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)'
    matches = re.findall(currency_regex, text)
    return [match[0] for match in matches if match[0]]

def is_quantitative_query(query: str) -> bool:
    """Determine if a query is asking for quantitative/numeric information"""
    # Check for terms related to numeric values
    numeric_terms = [
        'how much', 'amount', 'value', 'cost', 'price', 'fee', 'payment',
        'salary', 'compensation', 'severance', 'benefit', 'dollar', 
        'figure', 'sum', 'total', 'number', 'quantity', 'count',
        'percentage', 'rate', 'ratio', 'average', 'mean', 'median',
        'minimum', 'maximum', 'range', 'estimate', 'calculation'
    ]
    
    # Check if any numeric terms are in the query
    for term in numeric_terms:
        if term in query.lower():
            return True
    
    # Check if the query contains numeric values
    if extract_numeric_values(query):
        return True
    
    # Check for question patterns that typically expect numeric answers
    numeric_patterns = [
        r'how (many|much)',
        r'what (is|was|are|were) the (cost|price|value|amount|total|sum)',
        r'(calculate|compute|determine|find) the (value|amount|total|sum)',
    ]
    
    for pattern in numeric_patterns:
        if re.search(pattern, query.lower()):
            return True
    
    return False

def prioritize_numeric_sections(text: str, query: str) -> str:
    """Prioritize sections of text containing numeric values relevant to the query"""
    if not text:
        return text
    
    # Extract numeric values from query
    query_values = extract_numeric_values(query)
    
    # Split text into paragraphs
    paragraphs = text.split('\n\n')
    
    # Find paragraphs containing numeric values
    relevant_paragraphs = []
    other_paragraphs = []
    
    for paragraph in paragraphs:
        # Check if paragraph contains query values
        if query_values and any(value in paragraph for value in query_values):
            relevant_paragraphs.append(paragraph)
            continue
            
        # Check if paragraph contains dollar amounts
        if re.search(r'\$\d+', paragraph):
            relevant_paragraphs.append(paragraph)
        else:
            # Check if paragraph contains any numeric values
            if extract_numeric_values(paragraph):
                relevant_paragraphs.append(paragraph)
            else:
                other_paragraphs.append(paragraph)
    
    # If we found relevant paragraphs, prioritize them
    if relevant_paragraphs:
        # Put relevant paragraphs first, then include some other paragraphs for context
        prioritized_text = '\n\n'.join(relevant_paragraphs + other_paragraphs[:5])
        
        # If the prioritized text is significantly shorter, use it
        if len(prioritized_text) < len(text) * 0.8:
            return prioritized_text
    
    # Otherwise return the original text
    return text

def format_quantitative_prompt(message: str, context: str) -> Tuple[str, str]:
    """Format the prompt for quantitative queries"""
    enhanced_message = message
    
    # Create an enhanced system message for numeric queries
    enhanced_context = (
        "You are a helpful AI assistant specialized in extracting precise information from documents. "
        "Answer questions based on the provided document information. Be concise and accurate. "
        "When the question asks about numeric values, dollar amounts, or figures, make sure to "
        "extract and include these specific numbers in your response. "
        "If you find specific dollar amounts or numeric values in the document that are relevant to the query, "
        "highlight them in your response.\n\n"
        f"Document Information:\n{context}"
    )
    
    return enhanced_message, enhanced_context
