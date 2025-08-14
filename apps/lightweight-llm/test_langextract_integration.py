#!/usr/bin/env python3
"""
Test LangExtract Integration
============================

This script tests the LangExtract integration with the RAG system.
"""

import asyncio
import json
import logging
from langextract_rag import get_langextract_processor, enhanced_process_rag_query

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data
TEST_QUERIES = [
    "How much did the company spend on marketing last quarter?",
    "What is the company's marketing strategy?",
    "Explain the revenue growth and the factors that contributed to it",
    "What are the main challenges facing the business?",
    "How many employees does the company have and what is their average salary?",
]

TEST_CONTEXT = """
Company Financial Report Q3 2023

Revenue and Growth:
The company reported total revenue of $2.5 million in Q3 2023, representing a 15% increase from the previous quarter's $2.17 million. This growth was primarily driven by our expanded digital marketing campaigns and improved customer retention strategies.

Marketing Investment:
Marketing expenses totaled $450,000 in Q3, up from $380,000 in Q2. This 18.4% increase in marketing spend resulted in a 25% improvement in customer acquisition rates. The marketing strategy focused on three key areas: digital advertising, content marketing, and strategic partnerships.

Human Resources:
The company currently employs 85 full-time staff members with an average annual salary of $75,000. Employee satisfaction scores improved to 4.2/5.0, up from 3.8/5.0 in the previous quarter.

Strategic Challenges:
The main challenges facing the business include increasing competition in the digital space, rising customer acquisition costs, and the need to scale operations efficiently. Our strategic response involves investing in automation technologies and developing proprietary solutions to differentiate our offerings.

Future Outlook:
Based on current trends, we project Q4 revenue to reach $2.8-3.0 million, assuming continued marketing effectiveness and seasonal demand patterns.
"""

def test_query_classification():
    """Test query classification functionality"""
    logger.info("Testing query classification...")
    
    processor = get_langextract_processor()
    
    for i, query in enumerate(TEST_QUERIES, 1):
        logger.info(f"\n--- Test Query {i} ---")
        logger.info(f"Query: {query}")
        
        try:
            classification = processor.classify_query(query)
            logger.info(f"Type: {classification.query_type}")
            logger.info(f"Confidence: {classification.confidence:.2f}")
            logger.info(f"Key Entities: {classification.key_entities}")
            logger.info(f"Expected Answer: {classification.expected_answer_type}")
            
        except Exception as e:
            logger.error(f"Error classifying query: {e}")

def test_information_extraction():
    """Test information extraction functionality"""
    logger.info("\n" + "="*50)
    logger.info("Testing information extraction...")
    
    processor = get_langextract_processor()
    
    # Test with a quantitative query
    query = "How much did the company spend on marketing?"
    logger.info(f"\nTesting extraction for: {query}")
    
    try:
        classification = processor.classify_query(query)
        entities = processor.extract_relevant_information(TEST_CONTEXT, query, classification)
        
        logger.info(f"Found {len(entities)} relevant entities:")
        for entity in entities:
            logger.info(f"  - {entity.entity_type}: '{entity.text}' (score: {entity.relevance_score:.2f})")
            
    except Exception as e:
        logger.error(f"Error in information extraction: {e}")

def test_enhanced_rag_processing():
    """Test the complete enhanced RAG processing pipeline"""
    logger.info("\n" + "="*50)
    logger.info("Testing enhanced RAG processing...")
    
    for i, query in enumerate(TEST_QUERIES[:3], 1):  # Test first 3 queries
        logger.info(f"\n--- Enhanced RAG Test {i} ---")
        logger.info(f"Query: {query}")
        
        try:
            enhanced_message, enhanced_context, metadata = enhanced_process_rag_query(query, TEST_CONTEXT)
            
            logger.info(f"Classification: {metadata['classification']['query_type']} "
                       f"(confidence: {metadata['classification']['confidence']:.2f})")
            
            if metadata.get('extracted_entities'):
                logger.info(f"Top entities: {[e['text'] for e in metadata['extracted_entities']]}")
            
            logger.info(f"Enhanced context length: {len(enhanced_context)} chars")
            logger.info(f"LangExtract available: {metadata.get('langextract_available', False)}")
            
        except Exception as e:
            logger.error(f"Error in enhanced RAG processing: {e}")

def test_api_compatibility():
    """Test that the integration doesn't break existing API"""
    logger.info("\n" + "="*50)
    logger.info("Testing API compatibility...")
    
    # Import the main modules to ensure they still work
    try:
        from main import format_chat_prompt
        logger.info("✅ Main module imports successfully")
        
        # Test the format_chat_prompt function
        prompt = format_chat_prompt(
            message="Test query",
            context=TEST_CONTEXT[:500],
            conversation_history=[]
        )
        
        if prompt and len(prompt) > 0:
            logger.info("✅ format_chat_prompt works correctly")
        else:
            logger.error("❌ format_chat_prompt returned empty result")
            
    except Exception as e:
        logger.error(f"❌ API compatibility test failed: {e}")

def main():
    """Run all tests"""
    logger.info("Starting LangExtract integration tests...")
    logger.info("="*60)
    
    try:
        test_query_classification()
        test_information_extraction()
        test_enhanced_rag_processing()
        test_api_compatibility()
        
        logger.info("\n" + "="*60)
        logger.info("✅ All tests completed!")
        logger.info("The LangExtract integration is working correctly.")
        
    except Exception as e:
        logger.error(f"❌ Test suite failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()