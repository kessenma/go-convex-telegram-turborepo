#!/usr/bin/env python3
"""
Docker Startup Script for Lightweight LLM
==========================================

This script handles the startup process for the Docker container,
including optional LangExtract installation.
"""

import os
import sys
import subprocess
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_langextract_if_requested():
    """Install LangExtract if requested via environment variable"""
    install_langextract = os.getenv("INSTALL_LANGEXTRACT", "false").lower() == "true"
    
    if install_langextract:
        logger.info("Installing LangExtract as requested...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "langextract"])
            logger.info("LangExtract installed successfully!")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install LangExtract: {e}")
            logger.info("Continuing without LangExtract...")
            return False
    else:
        logger.info("LangExtract installation not requested (set INSTALL_LANGEXTRACT=true to enable)")
        return False

def check_model_file():
    """Check if the model file exists"""
    model_path = os.getenv("MODEL_PATH", "./llama-3.2-1b-instruct-q4.gguf")
    
    if os.path.exists(model_path):
        logger.info(f"Model file found: {model_path}")
        file_size = os.path.getsize(model_path) / (1024 * 1024)  # Size in MB
        logger.info(f"Model file size: {file_size:.1f} MB")
        return True
    else:
        logger.error(f"Model file not found: {model_path}")
        return False

def start_main_application():
    """Start the main application"""
    logger.info("Starting main application...")
    
    try:
        # Import main to ensure all modules are loaded
        import main
        
        # Start uvicorn server
        import uvicorn
        port = int(os.getenv("PORT", 8082))
        logger.info(f"Starting server on port {port}")
        
        # Run the server
        uvicorn.run(
            main.app,  # Pass the app object directly instead of string
            host="0.0.0.0",
            port=port,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start main application: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)

def main():
    """Main startup function"""
    logger.info("=" * 50)
    logger.info("Starting Lightweight LLM Docker Container")
    logger.info("=" * 50)
    
    # Check model file
    if not check_model_file():
        logger.error("Model file check failed. Exiting.")
        sys.exit(1)
    
    # Optionally install LangExtract
    langextract_installed = install_langextract_if_requested()
    
    if langextract_installed:
        logger.info("LangExtract is available - enhanced RAG processing enabled")
    else:
        logger.info("LangExtract not available - using fallback RAG processing")
    
    # Start the main application
    start_main_application()

if __name__ == "__main__":
    main()