import logging
import json
import time
from typing import Dict, Any, Optional, Generator
from datetime import datetime
from config import config
from rag_processor import process_rag_query
from conversation_title import ConversationTitleGenerator

logger = logging.getLogger(__name__)

class ChatHandler:
    """Handles chat interactions and message processing"""
    
    def __init__(self, model_manager):
        self.model_manager = model_manager
        self.conversation_cache = {}
        self.last_activity = {}

    async def process_message(self, message: str, context: str = "", conversation_history: Optional[list] = None, max_length: Optional[int] = 512, temperature: Optional[float] = 0.7, conversation_id: Optional[str] = None, is_new_conversation: Optional[bool] = False) -> Dict[str, Any]:
        """Process a message and return a unified response for the API"""
        try:
            history = conversation_history or []
            # Ensure a model is loaded
            if not self.model_manager.current_model:
                default_model = config.default_model
                self.model_manager.load_model(default_model)
            # Build prompt
            if context:
                prompt = self._build_rag_prompt(message, history, context, "")
            else:
                prompt = self._build_conversation_prompt(message, history)
            # Generate response synchronously
            full_response = ""
            for chunk in self.model_manager.generate(
                prompt,
                model_name=self.model_manager.current_model,
                max_tokens=max_length or 512,
                temperature=temperature or 0.7,
            ):
                if chunk:
                    full_response += chunk
            
            # Generate conversation title if this is a new conversation
            generated_title = None
            if is_new_conversation and len(history) == 0:
                try:
                    logger.info(f"Generating title for new conversation: {conversation_id}")
                    current_provider = self.model_manager.get_current_provider()
                    if current_provider and hasattr(current_provider, 'llm'):
                        title_generator = ConversationTitleGenerator(current_provider.llm)
                        generated_title = title_generator.generate_title(message, full_response)
                        logger.info(f"Generated title: {generated_title}")
                    else:
                        logger.warning("No current provider available for title generation")
                        generated_title = "New Conversation"
                except Exception as e:
                    logger.error(f"Error generating conversation title: {e}")
                    generated_title = "New Conversation"
            
            # Model info
            current_name = self.model_manager.current_model
            mc = config.get_model_config(current_name) if current_name else None
            model_info = {
                "name": mc.name if mc else current_name,
                "provider": mc.provider.value if mc else None,
                "model_path": mc.model_path if mc else None,
                "context_window": mc.context_window if mc else None,
                "threads": mc.threads if mc else None,
                "gpu_layers": mc.gpu_layers if mc else None,
            }
            usage = {
                "prompt_tokens": None,
                "completion_tokens": None,
                "total_tokens": None,
            }
            return {
                "response": full_response,
                "model_info": model_info,
                "usage": usage,
                "rag_metadata": None,
                "generated_title": generated_title,
            }
        except Exception as e:
            logger.error(f"Error in process_message: {e}")
            raise
    
    def process_chat_message(self, data: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """Process a chat message and yield response chunks"""
        try:
            # Extract message data
            message = data.get('message', '')
            conversation_id = data.get('conversationId')
            user_id = data.get('userId')
            model_name = data.get('model', config.default_model)
            use_rag = data.get('useRag', False)
            rag_documents = data.get('ragDocuments', [])
            
            # Validate required fields
            if not message or not conversation_id or not user_id:
                yield {
                    'type': 'error',
                    'error': 'Missing required fields: message, conversationId, or userId'
                }
                return
            
            # Update activity tracking
            self.last_activity[conversation_id] = time.time()
            
            # Load conversation history
            conversation_history = self._get_conversation_history(conversation_id)
            
            # Process with RAG if requested
            if use_rag and rag_documents:
                yield from self._process_rag_message(
                    message, conversation_history, rag_documents, model_name
                )
            else:
                yield from self._process_regular_message(
                    message, conversation_history, model_name
                )
            
            # Generate conversation title if this is the first message
            if len(conversation_history) == 0:
                yield from self._generate_conversation_title(
                    conversation_id, message, model_name
                )
            
            # Update conversation cache
            self._update_conversation_cache(conversation_id, message, "assistant")
            
        except Exception as e:
            logger.error(f"Error processing chat message: {e}")
            yield {
                'type': 'error',
                'error': f'Failed to process message: {str(e)}'
            }
    
    def _process_regular_message(self, message: str, history: list, model_name: str) -> Generator[Dict[str, Any], None, None]:
        """Process a regular chat message without RAG"""
        try:
            # Build conversation prompt
            prompt = self._build_conversation_prompt(message, history)
            
            # Yield start of response
            yield {
                'type': 'start',
                'model': model_name,
                'timestamp': datetime.now().isoformat()
            }
            
            # Generate response
            full_response = ""
            for chunk in self.model_manager.generate(prompt, model_name=model_name):
                if chunk:
                    full_response += chunk
                    yield {
                        'type': 'chunk',
                        'content': chunk
                    }
            
            # Yield end of response
            yield {
                'type': 'end',
                'full_response': full_response,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in regular message processing: {e}")
            yield {
                'type': 'error',
                'error': f'Failed to generate response: {str(e)}'
            }
    
    def _process_rag_message(self, message: str, history: list, documents: list, model_name: str) -> Generator[Dict[str, Any], None, None]:
        """Process a message with RAG enhancement"""
        try:
            # Yield start of RAG processing
            yield {
                'type': 'rag_start',
                'message': 'Processing documents...'
            }
            
            # Process with RAG
            rag_result = process_rag_query(message, documents)
            
            if rag_result.get('error'):
                yield {
                    'type': 'error',
                    'error': f'RAG processing failed: {rag_result["error"]}'
                }
                return
            
            # Build enhanced prompt with RAG context
            enhanced_prompt = self._build_rag_prompt(
                message, history, rag_result.get('enhanced_context', ''), 
                rag_result.get('system_message', '')
            )
            
            # Yield RAG completion
            yield {
                'type': 'rag_complete',
                'context_used': len(rag_result.get('enhanced_context', '')),
                'query_type': rag_result.get('query_type', 'general')
            }
            
            # Yield start of response
            yield {
                'type': 'start',
                'model': model_name,
                'timestamp': datetime.now().isoformat()
            }
            
            # Generate response
            full_response = ""
            for chunk in self.model_manager.generate(enhanced_prompt, model_name=model_name):
                if chunk:
                    full_response += chunk
                    yield {
                        'type': 'chunk',
                        'content': chunk
                    }
            
            # Yield end of response
            yield {
                'type': 'end',
                'full_response': full_response,
                'timestamp': datetime.now().isoformat(),
                'rag_info': {
                    'query_type': rag_result.get('query_type', 'general'),
                    'context_length': len(rag_result.get('enhanced_context', '')),
                    'documents_processed': len(documents)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in RAG message processing: {e}")
            yield {
                'type': 'error',
                'error': f'Failed to process RAG message: {str(e)}'
            }
    
    def _generate_conversation_title(self, conversation_id: str, first_message: str, model_name: str) -> Generator[Dict[str, Any], None, None]:
        """Generate a title for the conversation"""
        try:
            yield {
                'type': 'title_generating',
                'message': 'Generating conversation title...'
            }
            
            # Get the current model from model_manager
            current_provider = self.model_manager.get_current_provider()
            if current_provider and hasattr(current_provider, 'llm'):
                title_generator = ConversationTitleGenerator(current_provider.llm)
                title = title_generator.generate_title(first_message)
            else:
                title = "New Conversation"
            
            yield {
                'type': 'title_generated',
                'title': title,
                'conversation_id': conversation_id
            }
            
        except Exception as e:
            logger.error(f"Error generating conversation title: {e}")
            yield {
                'type': 'title_error',
                'error': f'Failed to generate title: {str(e)}'
            }
    
    def _build_conversation_prompt(self, message: str, history: list) -> str:
        """Build a conversation prompt from message and history"""
        prompt_parts = []
        
        # Add system message
        prompt_parts.append("<|begin_of_text|><|start_header_id|>system<|end_header_id|>")
        prompt_parts.append("You are a helpful AI assistant. Provide clear, accurate, and helpful responses.")
        prompt_parts.append("<|eot_id|>")
        
        # Add conversation history
        for entry in history[-10:]:  # Limit to last 10 exchanges
            if entry.get('role') == 'user':
                prompt_parts.append("<|start_header_id|>user<|end_header_id|>")
                prompt_parts.append(entry.get('content', ''))
                prompt_parts.append("<|eot_id|>")
            elif entry.get('role') == 'assistant':
                prompt_parts.append("<|start_header_id|>assistant<|end_header_id|>")
                prompt_parts.append(entry.get('content', ''))
                prompt_parts.append("<|eot_id|>")
        
        # Add current message
        prompt_parts.append("<|start_header_id|>user<|end_header_id|>")
        prompt_parts.append(message)
        prompt_parts.append("<|eot_id|>")
        prompt_parts.append("<|start_header_id|>assistant<|end_header_id|>")
        
        return "".join(prompt_parts)
    
    def _build_rag_prompt(self, message: str, history: list, context: str, system_message: str) -> str:
        """Build a RAG-enhanced prompt"""
        prompt_parts = []
        
        # Add enhanced system message
        prompt_parts.append("<|begin_of_text|><|start_header_id|>system<|end_header_id|>")
        if system_message:
            prompt_parts.append(system_message)
        else:
            prompt_parts.append("You are a helpful AI assistant. Use the provided context to answer questions accurately.")
        
        if context:
            prompt_parts.append("\n\nContext:")
            prompt_parts.append(context)
        
        prompt_parts.append("<|eot_id|>")
        
        # Add conversation history (limited)
        for entry in history[-5:]:  # Limit to last 5 exchanges for RAG
            if entry.get('role') == 'user':
                prompt_parts.append("<|start_header_id|>user<|end_header_id|>")
                prompt_parts.append(entry.get('content', ''))
                prompt_parts.append("<|eot_id|>")
            elif entry.get('role') == 'assistant':
                prompt_parts.append("<|start_header_id|>assistant<|end_header_id|>")
                prompt_parts.append(entry.get('content', ''))
                prompt_parts.append("<|eot_id|>")
        
        # Add current message
        prompt_parts.append("<|start_header_id|>user<|end_header_id|>")
        prompt_parts.append(message)
        prompt_parts.append("<|eot_id|>")
        prompt_parts.append("<|start_header_id|>assistant<|end_header_id|>")
        
        return "".join(prompt_parts)
    
    def _get_conversation_history(self, conversation_id: str) -> list:
        """Get conversation history from cache or external source"""
        # For now, return empty history - this would typically fetch from a database
        return self.conversation_cache.get(conversation_id, [])
    
    def _update_conversation_cache(self, conversation_id: str, message: str, role: str):
        """Update conversation cache with new message"""
        if conversation_id not in self.conversation_cache:
            self.conversation_cache[conversation_id] = []
        
        self.conversation_cache[conversation_id].append({
            'role': role,
            'content': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Limit cache size
        if len(self.conversation_cache[conversation_id]) > 50:
            self.conversation_cache[conversation_id] = self.conversation_cache[conversation_id][-50:]
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get current model status"""
        return {
            'available_models': self.model_manager.get_available_models(),
            'current_model': self.model_manager.get_current_model(),
            'service_info': {
                'name': config.service_name,
                'port': config.port,
                'docker_container': config.docker_container
            }
        }
    
    def switch_model(self, model_name: str) -> Dict[str, Any]:
        """Switch to a different model"""
        try:
            if self.model_manager.load_model(model_name):
                return {
                    'success': True,
                    'message': f'Successfully switched to {model_name}',
                    'current_model': model_name
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to load model {model_name}'
                }
        except Exception as e:
            logger.error(f"Error switching model: {e}")
            return {
                'success': False,
                'error': f'Error switching model: {str(e)}'
            }
    
    def cleanup_inactive_conversations(self, max_age_seconds: int = 3600):
        """Clean up inactive conversations from cache"""
        current_time = time.time()
        inactive_conversations = [
            conv_id for conv_id, last_time in self.last_activity.items()
            if current_time - last_time > max_age_seconds
        ]
        
        for conv_id in inactive_conversations:
            if conv_id in self.conversation_cache:
                del self.conversation_cache[conv_id]
            if conv_id in self.last_activity:
                del self.last_activity[conv_id]
        
        if inactive_conversations:
            logger.info(f"Cleaned up {len(inactive_conversations)} inactive conversations")
