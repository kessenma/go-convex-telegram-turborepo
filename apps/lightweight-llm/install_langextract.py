#!/usr/bin/env python3
"""
LangExtract Installation and Setup Script
=========================================

This script helps install and configure LangExtract for the RAG system.
"""

import subprocess
import sys
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_langextract():
    """Install LangExtract using pip"""
    try:
        logger.info("Installing LangExtract...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "langextract"])
        logger.info("LangExtract installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install LangExtract: {e}")
        return False

def check_ollama():
    """Check if Ollama is available"""
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"Ollama is available: {result.stdout.strip()}")
            return True
        else:
            logger.warning("Ollama is not available")
            return False
    except FileNotFoundError:
        logger.warning("Ollama is not installed or not in PATH")
        return False

def check_llama_model():
    """Check if the required Llama model is available in Ollama"""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            models = result.stdout
            if "llama3.2:1b" in models:
                logger.info("Llama 3.2 1B model is available in Ollama")
                return True
            else:
                logger.warning("Llama 3.2 1B model not found in Ollama")
                logger.info("You can install it with: ollama pull llama3.2:1b")
                return False
        else:
            logger.error("Failed to list Ollama models")
            return False
    except FileNotFoundError:
        logger.warning("Cannot check Ollama models - Ollama not available")
        return False

def test_langextract():
    """Test LangExtract installation"""
    try:
        import langextract as lx
        logger.info("LangExtract import successful!")
        
        # Try to create a simple extractor (this will fail without proper setup, but that's OK)
        try:
            extractor = lx.LangExtract(model="ollama/llama3.2:1b")
            logger.info("LangExtract initialization successful!")
            return True
        except Exception as e:
            logger.warning(f"LangExtract initialization failed (this is expected if Ollama/model not available): {e}")
            return False
            
    except ImportError as e:
        logger.error(f"LangExtract import failed: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("Setting up LangExtract for RAG system...")
    
    # Install LangExtract
    if not install_langextract():
        logger.error("Failed to install LangExtract. Exiting.")
        return False
    
    # Check Ollama availability
    ollama_available = check_ollama()
    if ollama_available:
        model_available = check_llama_model()
        if not model_available:
            logger.info("To use LangExtract with local models, install the Llama model:")
            logger.info("  ollama pull llama3.2:1b")
    else:
        logger.info("To use LangExtract with local models, install Ollama:")
        logger.info("  Visit: https://ollama.ai/")
    
    # Test the installation
    test_success = test_langextract()
    
    if test_success:
        logger.info("✅ LangExtract setup completed successfully!")
        logger.info("The RAG system will now use enhanced query classification.")
    else:
        logger.info("⚠️  LangExtract installed but not fully functional.")
        logger.info("The RAG system will fall back to basic classification.")
        logger.info("For full functionality, ensure Ollama and llama3.2:1b are available.")
    
    logger.info("\nNext steps:")
    logger.info("1. Start your lightweight LLM service: python main.py")
    logger.info("2. Test the new /classify-query endpoint")
    logger.info("3. Check the enhanced RAG metadata in chat responses")
    
    return True

if __name__ == "__main__":
    main()