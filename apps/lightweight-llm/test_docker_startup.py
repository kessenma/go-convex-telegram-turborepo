#!/usr/bin/env python3
"""
Test Docker Startup Script
==========================

Quick test to verify the docker startup script works correctly.
"""

import os
import sys
import tempfile
import logging

# Add the current directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_docker_startup_imports():
    """Test that docker_startup.py can be imported without errors"""
    try:
        import docker_startup
        print("✅ docker_startup.py imports successfully")
        return True
    except Exception as e:
        print(f"❌ docker_startup.py import failed: {e}")
        return False

def test_model_path_consistency():
    """Test that model paths are consistent across files"""
    # Check main.py default
    with open('main.py', 'r') as f:
        main_content = f.read()
        if 'llama-3.2-1b-instruct-q4.gguf' in main_content:
            print("✅ main.py uses correct Llama 3.2 model path")
        else:
            print("❌ main.py model path inconsistent")
            return False
    
    # Check docker_startup.py default
    with open('docker_startup.py', 'r') as f:
        startup_content = f.read()
        if 'llama-3.2-1b-instruct-q4.gguf' in startup_content:
            print("✅ docker_startup.py uses correct Llama 3.2 model path")
        else:
            print("❌ docker_startup.py model path inconsistent")
            return False
    
    # Check Dockerfile
    with open('Dockerfile', 'r') as f:
        dockerfile_content = f.read()
        if 'llama-3.2-1b-instruct-q4.gguf' in dockerfile_content:
            print("✅ Dockerfile uses correct Llama 3.2 model path")
        else:
            print("❌ Dockerfile model path inconsistent")
            return False
    
    return True

def test_logger_availability():
    """Test that logger is properly defined in docker_startup"""
    try:
        import docker_startup
        # Check if logger is accessible
        if hasattr(docker_startup, 'logger'):
            print("✅ Logger is properly defined in docker_startup.py")
            return True
        else:
            print("❌ Logger not found in docker_startup.py")
            return False
    except Exception as e:
        print(f"❌ Error checking logger: {e}")
        return False

def test_environment_variables():
    """Test environment variable handling"""
    # Test with INSTALL_LANGEXTRACT=false
    os.environ['INSTALL_LANGEXTRACT'] = 'false'
    os.environ['MODEL_PATH'] = './test-model.gguf'
    
    try:
        import docker_startup
        
        # Test install_langextract_if_requested
        result = docker_startup.install_langextract_if_requested()
        if result == False:
            print("✅ INSTALL_LANGEXTRACT=false handled correctly")
        else:
            print("❌ INSTALL_LANGEXTRACT=false not handled correctly")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Environment variable test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Docker Startup Configuration...")
    print("=" * 50)
    
    tests = [
        test_docker_startup_imports,
        test_model_path_consistency,
        test_logger_availability,
        test_environment_variables
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Docker startup should work correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)