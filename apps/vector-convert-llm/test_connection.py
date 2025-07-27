#!/usr/bin/env python3
"""
Simple connection test script for debugging Convex backend connectivity
"""

import requests
import os
import time
import json

def test_convex_connection():
    convex_url = os.environ.get('CONVEX_URL', 'http://convex-backend:3211')
    
    print(f"🔍 Testing connection to Convex backend at: {convex_url}")
    print("=" * 60)
    
    # Test 1: Basic connectivity
    print("1. Testing basic connectivity...")
    try:
        response = requests.get(f"{convex_url}/api/health", timeout=5)
        print(f"   ✅ Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    except requests.exceptions.Timeout as e:
        print(f"   ❌ Timeout: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Test 2: Status update endpoint
    print("\n2. Testing status update endpoint...")
    try:
        test_payload = {
            "serviceName": "vector-convert-llm-test",
            "status": "testing",
            "ready": False,
            "message": "Connection test",
            "timestamp": int(time.time() * 1000)
        }
        
        response = requests.post(
            f"{convex_url}/updateServiceStatus",
            json=test_payload,
            timeout=10
        )
        
        print(f"   Status update endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Status update successful")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Status update failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Status update error: {e}")
        return False
    
    # Test 3: Network resolution
    print("\n3. Testing network resolution...")
    try:
        import socket
        host = convex_url.replace('http://', '').replace('https://', '').split(':')[0]
        port = int(convex_url.split(':')[-1])
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"   ✅ Network connection to {host}:{port} successful")
        else:
            print(f"   ❌ Network connection to {host}:{port} failed")
            
    except Exception as e:
        print(f"   ❌ Network test error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Connection test completed!")
    return True

if __name__ == "__main__":
    test_convex_connection()