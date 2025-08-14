"""
Qualitative RAG Module
======================

This module handles qualitative (descriptive) queries for the RAG system.
It specializes in identifying and extracting descriptive information from documents.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

def is_qualitative_query(query: str) -> bool:
    """Determine if a query is asking for qualitative/descriptive information"""
    # Check for terms related to qualitative information
    qualitative_terms = [
        'describe', 'explain', 'elaborate', 'summarize', 'detail',
        'what is', 'what are', 'how does', 'why is', 'why are',
        'definition', 'meaning', 'purpose', 'reason', 'cause',
        'effect', 'impact', 'influence', 'relationship', 'difference',
        'similarity', 'compare', 'contrast', 'advantage', 'disadvantage',
        'benefit', 'drawback', 'feature', 'characteristic', 'property',
        'quality', 'attribute', 'aspect', 'element', 'component',
        'process', 'procedure', 'method', 'technique', 'approach',
        'strategy', 'policy', 'rule', 'regulation', 'guideline'
    ]
    
    # Check if any qualitative terms are in the query
    for term in qualitative_terms:
        if term in query.lower():
            return True
    
    # Check for question patterns that typically expect descriptive answers
    qualitative_patterns = [
        r'(what|who|where|when|why|how)',
        r'(describe|explain|elaborate on|summarize|detail)',
        r'(tell me about|provide information on|give details about)',
    ]
    
    for pattern in qualitative_patterns:
        if re.search(pattern, query.lower()):
            return True
    
    return False

def extract_key_terms(query: str) -> List[str]:
    """Extract key terms from a query for context matching"""
    # Remove common stop words
    stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                 'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 
                 'about', 'against', 'between', 'into', 'through', 'during', 
                 'before', 'after', 'above', 'below', 'from', 'up', 'down', 
                 'of', 'off', 'over', 'under', 'again', 'further', 'then', 
                 'once', 'here', 'there', 'when', 'where', 'why', 'how', 
                 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 
                 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 
                 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 
                 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 
                 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 
                 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 
                 'shouldn', 'wasn', 'weren', 'won', 'wouldn', 'what', 'which', 'who'}
    
    # Tokenize and filter out stop words
    words = re.findall(r'\b\w+\b', query.lower())
    key_terms = [word for word in words if word not in stop_words and len(word) > 2]
    
    return key_terms

def prioritize_relevant_sections(text: str, query: str) -> str:
    """Prioritize sections of text relevant to the query based on key terms"""
    if not text:
        return text
    
    # Extract key terms from query
    key_terms = extract_key_terms(query)
    
    if not key_terms:
        return text
    
    # Split text into paragraphs
    paragraphs = text.split('\n\n')
    
    # Score paragraphs based on key term matches
    scored_paragraphs = []
    for paragraph in paragraphs:
        score = 0
        for term in key_terms:
            # Count occurrences of the term in the paragraph
            count = len(re.findall(r'\b' + re.escape(term) + r'\b', paragraph.lower()))
            score += count
        
        scored_paragraphs.append((paragraph, score))
    
    # Sort paragraphs by score (descending)
    scored_paragraphs.sort(key=lambda x: x[1], reverse=True)
    
    # If we have paragraphs with scores > 0, prioritize them
    relevant_paragraphs = [p for p, s in scored_paragraphs if s > 0]
    other_paragraphs = [p for p, s in scored_paragraphs if s == 0]
    
    if relevant_paragraphs:
        # Put relevant paragraphs first, then include some other paragraphs for context
        prioritized_text = '\n\n'.join(relevant_paragraphs + other_paragraphs[:5])
        
        # If the prioritized text is significantly shorter, use it
        if len(prioritized_text) < len(text) * 0.8:
            return prioritized_text
    
    # Otherwise return the original text
    return text

def format_qualitative_prompt(message: str, context: str) -> Tuple[str, str]:
    """Format the prompt for qualitative queries"""
    enhanced_message = message
    
    # Create an enhanced system message for descriptive queries
    enhanced_context = (
        "You are a helpful AI assistant specialized in providing clear explanations and descriptions. "
        "Answer questions based on the provided document information. Be thorough yet concise. "
        "Focus on explaining concepts, processes, relationships, and characteristics mentioned in the document. "
        "Provide well-structured explanations that address all aspects of the query.\n\n"
        f"Document Information:\n{context}"
    )
    
    return enhanced_message, enhanced_context
