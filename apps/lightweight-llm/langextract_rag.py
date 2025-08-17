"""
LangExtract RAG Module
=====================

This module uses LangExtract to provide more sophisticated query classification
and information extraction for the RAG system.
"""

import re
import logging
import os
logger = logging.getLogger(__name__)
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass

try:
    import langextract as lx
    LANGEXTRACT_AVAILABLE = True
    logger.info("LangExtract library imported successfully")
except ImportError as e:
    LANGEXTRACT_AVAILABLE = False
    logger.warning(f"LangExtract not available: {e}. Install with: uv add langextract")
    # Create a dummy lx module for fallback
    class DummyLangExtract:
        class data:
            class ExampleData:
                def __init__(self, text, extractions):
                    self.text = text
                    self.extractions = extractions
            
            class Extraction:
                def __init__(self, extraction_class, extraction_text, attributes=None):
                    self.extraction_class = extraction_class
                    self.extraction_text = extraction_text
                    self.attributes = attributes or {}
    
    lx = DummyLangExtract()


@dataclass
class QueryClassification:
    """Classification result for a query"""
    query_type: str  # 'quantitative', 'qualitative', 'mixed', 'general'
    confidence: float
    key_entities: List[str]
    expected_answer_type: str
    extraction_focus: List[str]

@dataclass
class ExtractedEntity:
    """Extracted entity from document"""
    entity_type: str
    text: str
    context: str
    attributes: Dict[str, Any]
    relevance_score: float

class LangExtractRAGProcessor:
    """Enhanced RAG processor using LangExtract for better query understanding and information extraction"""
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize the LangExtract RAG processor
        
        Args:
            model_name: Model to use for extraction. If None, reads LANGEXTRACT_MODEL env var (default: local Ollama model).
        """
        # Resolve configuration from args or environment
        resolved_model = model_name or os.getenv("LANGEXTRACT_MODEL", "ollama/llama3.2:1b")
        enabled = os.getenv("LANGEXTRACT_ENABLED", "true").lower() == "true"
        
        self.model_name = resolved_model
        self.extractor = None
        
        if not enabled:
            logger.info("LangExtract disabled via LANGEXTRACT_ENABLED=false - using fallback classification")
            return
        
        if LANGEXTRACT_AVAILABLE:
            try:
                # Initialize with configured model
                self.extractor = lx.LangExtract(model=self.model_name)
                logger.info(f"LangExtract initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize LangExtract: {e}")
                self.extractor = None
        else:
            logger.warning("LangExtract not available - falling back to basic classification")
    
    def classify_query(self, query: str) -> QueryClassification:
        """
        Classify a query using LangExtract for more sophisticated analysis
        
        Args:
            query: The user's query
            
        Returns:
            QueryClassification with detailed analysis
        """
        if not self.extractor:
            return self._fallback_classify_query(query)
        
        try:
            # Define extraction task for query classification
            classification_prompt = """
            Analyze the given query and classify it based on the type of information being requested.
            Extract the query type, key entities, and expected answer characteristics.
            """
            
            # Examples for query classification
            examples = [
                lx.data.ExampleData(
                    text="How much did the company spend on marketing last quarter?",
                    extractions=[
                        lx.data.Extraction(
                            extraction_class="query_type",
                            extraction_text="quantitative",
                            attributes={
                                "confidence": 0.95,
                                "expected_answer": "numeric_value",
                                "focus": ["spending", "marketing", "financial_data"]
                            }
                        ),
                        lx.data.Extraction(
                            extraction_class="key_entity",
                            extraction_text="marketing spend",
                            attributes={"category": "financial_metric"}
                        ),
                        lx.data.Extraction(
                            extraction_class="key_entity", 
                            extraction_text="last quarter",
                            attributes={"category": "time_period"}
                        )
                    ]
                ),
                lx.data.ExampleData(
                    text="Explain the company's marketing strategy and approach",
                    extractions=[
                        lx.data.Extraction(
                            extraction_class="query_type",
                            extraction_text="qualitative",
                            attributes={
                                "confidence": 0.90,
                                "expected_answer": "descriptive_explanation",
                                "focus": ["strategy", "approach", "methodology"]
                            }
                        ),
                        lx.data.Extraction(
                            extraction_class="key_entity",
                            extraction_text="marketing strategy",
                            attributes={"category": "business_concept"}
                        )
                    ]
                )
            ]
            
            # Perform extraction
            result = self.extractor.extract(
                text=query,
                prompt=classification_prompt,
                examples=examples
            )
            
            return self._parse_classification_result(result, query)
            
        except Exception as e:
            logger.error(f"Error in LangExtract query classification: {e}")
            return self._fallback_classify_query(query)
    
    def extract_relevant_information(self, context: str, query: str, query_classification: QueryClassification) -> List[ExtractedEntity]:
        """
        Extract relevant information from context based on query classification
        
        Args:
            context: Document context
            query: User query
            query_classification: Classification result from classify_query
            
        Returns:
            List of extracted entities relevant to the query
        """
        if not self.extractor:
            return self._fallback_extract_information(context, query, query_classification)
        
        try:
            # Create extraction prompt based on query type
            if query_classification.query_type == "quantitative":
                extraction_prompt = """
                Extract numeric values, financial figures, quantities, measurements, and statistical data.
                Focus on exact numbers, percentages, dates, and quantifiable metrics.
                Include context around each number to understand what it represents.
                """
                
                examples = [
                    lx.data.ExampleData(
                        text="The company reported revenue of $2.5 million in Q3 2023, representing a 15% increase from the previous quarter.",
                        extractions=[
                            lx.data.Extraction(
                                extraction_class="financial_figure",
                                extraction_text="$2.5 million",
                                attributes={
                                    "type": "revenue",
                                    "period": "Q3 2023",
                                    "context": "quarterly revenue"
                                }
                            ),
                            lx.data.Extraction(
                                extraction_class="percentage",
                                extraction_text="15% increase",
                                attributes={
                                    "type": "growth_rate",
                                    "comparison": "previous quarter",
                                    "context": "revenue growth"
                                }
                            )
                        ]
                    )
                ]
                
            elif query_classification.query_type == "qualitative":
                extraction_prompt = """
                Extract concepts, processes, strategies, relationships, and descriptive information.
                Focus on explanations, methodologies, approaches, and qualitative characteristics.
                Include context that explains how things work or why they are important.
                """
                
                examples = [
                    lx.data.ExampleData(
                        text="The company's marketing strategy focuses on digital channels and customer engagement through personalized content.",
                        extractions=[
                            lx.data.Extraction(
                                extraction_class="strategy",
                                extraction_text="marketing strategy focuses on digital channels",
                                attributes={
                                    "type": "business_approach",
                                    "domain": "marketing",
                                    "context": "channel strategy"
                                }
                            ),
                            lx.data.Extraction(
                                extraction_class="method",
                                extraction_text="customer engagement through personalized content",
                                attributes={
                                    "type": "engagement_method",
                                    "approach": "personalization",
                                    "context": "customer interaction"
                                }
                            )
                        ]
                    )
                ]
            else:
                # Mixed or general extraction
                extraction_prompt = """
                Extract both quantitative data (numbers, figures, measurements) and qualitative information 
                (concepts, processes, explanations) that are relevant to the query.
                """
                
                examples = [
                    lx.data.ExampleData(
                        text="The new product launch strategy resulted in 25% market share growth through innovative digital marketing campaigns.",
                        extractions=[
                            lx.data.Extraction(
                                extraction_class="quantitative",
                                extraction_text="25% market share growth",
                                attributes={"type": "performance_metric"}
                            ),
                            lx.data.Extraction(
                                extraction_class="qualitative",
                                extraction_text="innovative digital marketing campaigns",
                                attributes={"type": "strategy_description"}
                            )
                        ]
                    )
                ]
            
            # Perform extraction
            result = self.extractor.extract(
                text=context,
                prompt=extraction_prompt,
                examples=examples
            )
            
            return self._parse_extraction_result(result, query_classification)
            
        except Exception as e:
            logger.error(f"Error in LangExtract information extraction: {e}")
            return self._fallback_extract_information(context, query, query_classification)
    
    def _parse_classification_result(self, result, query: str) -> QueryClassification:
        """Parse LangExtract result into QueryClassification"""
        try:
            query_type = "general"
            confidence = 0.5
            key_entities = []
            expected_answer_type = "general_response"
            extraction_focus = []
            
            if hasattr(result, 'extractions') and result.extractions:
                for extraction in result.extractions:
                    if extraction.extraction_class == "query_type":
                        query_type = extraction.extraction_text.lower()
                        if hasattr(extraction, 'attributes'):
                            confidence = extraction.attributes.get('confidence', 0.5)
                            expected_answer_type = extraction.attributes.get('expected_answer', 'general_response')
                            extraction_focus = extraction.attributes.get('focus', [])
                    elif extraction.extraction_class == "key_entity":
                        key_entities.append(extraction.extraction_text)
            
            return QueryClassification(
                query_type=query_type,
                confidence=confidence,
                key_entities=key_entities,
                expected_answer_type=expected_answer_type,
                extraction_focus=extraction_focus
            )
            
        except Exception as e:
            logger.error(f"Error parsing classification result: {e}")
            return self._fallback_classify_query(query)
    
    def _parse_extraction_result(self, result, query_classification: QueryClassification) -> List[ExtractedEntity]:
        """Parse LangExtract result into ExtractedEntity list"""
        entities = []
        
        try:
            if hasattr(result, 'extractions') and result.extractions:
                for extraction in result.extractions:
                    entity = ExtractedEntity(
                        entity_type=extraction.extraction_class,
                        text=extraction.extraction_text,
                        context=getattr(extraction, 'context', ''),
                        attributes=getattr(extraction, 'attributes', {}),
                        relevance_score=self._calculate_relevance_score(extraction, query_classification)
                    )
                    entities.append(entity)
            
            # Sort by relevance score
            entities.sort(key=lambda x: x.relevance_score, reverse=True)
            
        except Exception as e:
            logger.error(f"Error parsing extraction result: {e}")
        
        return entities
    
    def _calculate_relevance_score(self, extraction, query_classification: QueryClassification) -> float:
        """Calculate relevance score for an extraction"""
        score = 0.5  # Base score
        
        # Boost score if extraction type matches query type
        if extraction.extraction_class.lower() in query_classification.query_type.lower():
            score += 0.3
        
        # Boost score if extraction contains key entities
        for entity in query_classification.key_entities:
            if entity.lower() in extraction.extraction_text.lower():
                score += 0.2
        
        return min(score, 1.0)
    
    def _fallback_classify_query(self, query: str) -> QueryClassification:
        """Fallback classification when LangExtract is not available"""
        # Import the existing classification logic
        from quantitative_rag import is_quantitative_query
        from qualitative_rag import is_qualitative_query
        
        is_quant = is_quantitative_query(query)
        is_qual = is_qualitative_query(query)
        
        if is_quant and is_qual:
            query_type = "mixed"
            confidence = 0.7
        elif is_quant:
            query_type = "quantitative"
            confidence = 0.8
        elif is_qual:
            query_type = "qualitative"
            confidence = 0.8
        else:
            query_type = "general"
            confidence = 0.6
        
        # Extract basic key entities using regex
        key_entities = re.findall(r'\b(?:cost|price|amount|value|strategy|process|method|approach)\b', query.lower())
        
        return QueryClassification(
            query_type=query_type,
            confidence=confidence,
            key_entities=key_entities,
            expected_answer_type="numeric_value" if is_quant else "descriptive_explanation",
            extraction_focus=key_entities
        )
    
    def _fallback_extract_information(self, context: str, query: str, query_classification: QueryClassification) -> List[ExtractedEntity]:
        """Fallback extraction when LangExtract is not available"""
        entities = []
        
        # Basic regex-based extraction for quantitative data
        if query_classification.query_type in ["quantitative", "mixed"]:
            # Extract currency amounts
            currency_matches = re.finditer(r'\$[\d,]+(?:\.\d{2})?', context)
            for match in currency_matches:
                entities.append(ExtractedEntity(
                    entity_type="financial_figure",
                    text=match.group(),
                    context=context[max(0, match.start()-50):match.end()+50],
                    attributes={"type": "currency"},
                    relevance_score=0.7
                ))
            
            # Extract percentages
            percent_matches = re.finditer(r'\d+(?:\.\d+)?%', context)
            for match in percent_matches:
                entities.append(ExtractedEntity(
                    entity_type="percentage",
                    text=match.group(),
                    context=context[max(0, match.start()-50):match.end()+50],
                    attributes={"type": "percentage"},
                    relevance_score=0.6
                ))
        
        return entities

# Global instance
langextract_processor = None

def get_langextract_processor() -> LangExtractRAGProcessor:
    """Get or create the global LangExtract processor instance"""
    global langextract_processor
    if langextract_processor is None:
        langextract_processor = LangExtractRAGProcessor()
    return langextract_processor

def enhanced_process_rag_query(message: str, context: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Enhanced RAG query processing using LangExtract
    
    Returns:
        Tuple of (enhanced_message, enhanced_context, metadata)
    """
    processor = get_langextract_processor()
    
    # Classify the query
    classification = processor.classify_query(message)
    
    # Extract relevant information from context
    extracted_entities = processor.extract_relevant_information(context, message, classification)
    
    # Create enhanced context based on extracted entities
    if extracted_entities:
        # Prioritize context based on extracted entities
        entity_contexts = []
        for entity in extracted_entities[:5]:  # Top 5 most relevant
            if entity.context and entity.context not in entity_contexts:
                entity_contexts.append(entity.context)
        
        if entity_contexts:
            enhanced_context = "\n\n".join(entity_contexts)
            # If enhanced context is too short, supplement with original
            if len(enhanced_context) < len(context) * 0.3:
                enhanced_context = enhanced_context + "\n\n" + context[:1000]
        else:
            enhanced_context = context
    else:
        enhanced_context = context
    
    # Create enhanced system message based on classification
    if classification.query_type == "quantitative":
        system_msg = (
            "You are a helpful AI assistant specialized in extracting precise quantitative information from documents. "
            "Focus on providing exact numbers, figures, percentages, and measurements. "
            "When answering, highlight specific numeric values and their context.\n\n"
            f"Document Information:\n{enhanced_context}"
        )
    elif classification.query_type == "qualitative":
        system_msg = (
            "You are a helpful AI assistant specialized in providing clear explanations and descriptions. "
            "Focus on explaining concepts, processes, strategies, and relationships. "
            "Provide comprehensive yet concise explanations.\n\n"
            f"Document Information:\n{enhanced_context}"
        )
    elif classification.query_type == "mixed":
        system_msg = (
            "You are a helpful AI assistant that excels at both extracting specific quantitative information "
            "and providing clear qualitative explanations. Address both numeric and descriptive aspects of the query.\n\n"
            f"Document Information:\n{enhanced_context}"
        )
    else:
        system_msg = (
            "You are a helpful AI assistant. Answer questions based on the provided document information. "
            "Be concise and accurate.\n\n"
            f"Document Information:\n{enhanced_context}"
        )
    
    # Metadata for debugging and analysis
    metadata = {
        "classification": {
            "query_type": classification.query_type,
            "confidence": classification.confidence,
            "key_entities": classification.key_entities,
            "expected_answer_type": classification.expected_answer_type
        },
        "extracted_entities": [
            {
                "type": entity.entity_type,
                "text": entity.text,
                "relevance_score": entity.relevance_score
            }
            for entity in extracted_entities[:3]  # Top 3 for metadata
        ],
        "langextract_available": LANGEXTRACT_AVAILABLE
    }
    
    return message, system_msg, metadata
