import logging
import re
from typing import Optional
from llama_cpp import Llama

logger = logging.getLogger(__name__)

class ConversationTitleGenerator:
    """Generate conversation titles from user queries using the loaded LLM"""
    
    def __init__(self, llm: Llama):
        self.llm = llm
        
    def generate_title(self, user_query: str, assistant_response: str = "") -> Optional[str]:
        """Generate a concise title for a conversation based on the user's query and optional response
        
        Args:
            user_query: The user's initial question or message
            assistant_response: Optional assistant response for additional context
            
        Returns:
            A concise title (3-6 words) or None if generation fails
        """
        try:
            # Clean and truncate the query for title generation
            clean_query = self._clean_query(user_query)
            
            # If query is too short or generic, use fallback
            if len(clean_query.strip()) < 5:
                return self._generate_fallback_title(clean_query)
            
            # Create a focused prompt for title generation
            prompt = self._create_title_prompt(clean_query, assistant_response)
            
            # Generate title with conservative settings
            output = self.llm(
                prompt,
                max_tokens=20,  # Keep titles short
                temperature=0.3,  # Lower temperature for more focused titles
                top_p=0.8,
                stop=["\n", ".", "?", "!", "<|eot_id|>", "<|start_header_id|>"],
                echo=False
            )
            
            # Extract and clean the generated title
            generated_text = output["choices"][0]["text"].strip()
            title = self._clean_title(generated_text)
            
            # Validate title length and content
            if self._is_valid_title(title):
                logger.info(f"Generated title: '{title}' for query: '{clean_query[:50]}...'")
                return title
            else:
                logger.warning(f"Generated invalid title: '{title}', using fallback")
                return self._generate_fallback_title(clean_query)
                
        except Exception as e:
            logger.error(f"Error generating conversation title: {e}")
            return self._generate_fallback_title(user_query)
    
    def _clean_query(self, query: str) -> str:
        """Clean the user query for title generation"""
        # Remove excessive whitespace and special characters
        cleaned = re.sub(r'\s+', ' ', query).strip()
        # Truncate if too long
        if len(cleaned) > 200:
            cleaned = cleaned[:200] + "..."
        return cleaned
    
    def _create_title_prompt(self, query: str, response: str = "") -> str:
        """Create a focused prompt for title generation"""
        # Use Llama-3.2's chat format for title generation
        system_msg = (
            "You are a helpful assistant that creates concise conversation titles. "
            "Generate a short, descriptive title (3-6 words) that captures the main topic or question. "
            "Do not use quotes, punctuation, or complete sentences. "
            "Examples: 'Python Data Analysis', 'React Component Help', 'Database Query Optimization'"
        )
        
        user_msg = f"Create a title for this conversation:\n\nUser: {query}"
        if response and len(response) > 0:
            # Include a snippet of the response for context
            response_snippet = response[:150] + "..." if len(response) > 150 else response
            user_msg += f"\n\nAssistant: {response_snippet}"
        
        user_msg += "\n\nTitle:"
        
        prompt = (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_msg}<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n\n{user_msg}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        )
        
        return prompt
    
    def _clean_title(self, title: str) -> str:
        """Clean and format the generated title"""
        # Remove common prefixes and suffixes
        title = re.sub(r'^(Title:|Conversation:|Chat:)\s*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*(conversation|chat|discussion)$', '', title, flags=re.IGNORECASE)
        
        # Remove quotes and excessive punctuation
        title = re.sub(r'["\'"`]', '', title)
        title = re.sub(r'[.!?]+$', '', title)
        
        # Clean whitespace
        title = re.sub(r'\s+', ' ', title).strip()
        
        # Capitalize properly
        title = self._capitalize_title(title)
        
        return title
    
    def _capitalize_title(self, title: str) -> str:
        """Apply proper title capitalization"""
        # Split into words and capitalize appropriately
        words = title.split()
        if not words:
            return title
            
        # Capitalize first and last words, and important words
        capitalized = []
        for i, word in enumerate(words):
            if i == 0 or i == len(words) - 1:  # First or last word
                capitalized.append(word.capitalize())
            elif word.lower() in ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']:
                capitalized.append(word.lower())  # Keep articles and prepositions lowercase
            else:
                capitalized.append(word.capitalize())
        
        return ' '.join(capitalized)
    
    def _is_valid_title(self, title: str) -> bool:
        """Validate that the generated title is appropriate"""
        if not title or len(title.strip()) == 0:
            return False
        
        # Check length (should be reasonable for a title)
        word_count = len(title.split())
        if word_count < 1 or word_count > 8:
            return False
        
        # Check for unwanted patterns
        unwanted_patterns = [
            r'^(how|what|when|where|why|who)\s',  # Don't start with question words
            r'\?$',  # Don't end with question marks
            r'^(please|help|can you)',  # Don't start with request words
            r'(conversation|chat|discussion)\s*(about|on)',  # Avoid meta references
        ]
        
        for pattern in unwanted_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                return False
        
        return True
    
    def _generate_fallback_title(self, query: str) -> str:
        """Generate a fallback title when LLM generation fails or produces invalid results"""
        # Extract key terms from the query
        clean_query = re.sub(r'[^\w\s]', '', query.lower())
        words = clean_query.split()
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
                     'how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'would', 'should',
                     'please', 'help', 'me', 'i', 'you', 'my', 'your', 'is', 'are', 'was', 'were'}
        
        key_words = [word for word in words if word not in stop_words and len(word) > 2]
        
        if key_words:
            # Take first 3-4 meaningful words and capitalize
            title_words = key_words[:4]
            title = ' '.join(word.capitalize() for word in title_words)
            
            # Ensure it's not too long
            if len(title) > 50:
                title = title[:47] + "..."
            
            return title
        else:
            # Ultimate fallback
            return "New Conversation"

# Utility function for easy import
def create_title_generator(llm: Llama) -> ConversationTitleGenerator:
    """Create a conversation title generator instance"""
    return ConversationTitleGenerator(llm)