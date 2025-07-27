import requests
import psutil
import time
import os
import logging
import threading
from typing import Dict, Any, Optional

class StatusReporter:
    """Utility class for reporting service status to Convex backend"""
    
    def __init__(self, service_name: str, convex_url: str):
        self.service_name = service_name
        self.convex_url = convex_url
        self.start_time = time.time()
        self.logger = logging.getLogger(__name__)
        
        # Test connectivity on initialization
        self.test_connectivity()
        
    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage statistics"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            
            # Get CPU percent with a small interval for accurate reading
            # First call returns 0, so we call it twice with a small delay
            process.cpu_percent()  # Initialize
            time.sleep(0.1)  # Small delay
            cpu_percent = process.cpu_percent()
            
            # System memory
            system_memory = psutil.virtual_memory()
            
            return {
                "processMemoryMb": round(memory_info.rss / 1024 / 1024, 2),
                "processCpuPercent": round(cpu_percent, 2),
                "processMemoryPercent": round(process.memory_percent(), 2),
                "rssMb": round(memory_info.rss / 1024 / 1024, 2),
                "vmsMb": round(memory_info.vms / 1024 / 1024, 2),
                "systemMemoryTotalGb": round(system_memory.total / 1024 / 1024 / 1024, 2),
                "systemMemoryAvailableGb": round(system_memory.available / 1024 / 1024 / 1024, 2),
                "systemMemoryUsedPercent": round(system_memory.percent, 2),
                "availableMb": round(system_memory.available / 1024 / 1024, 2),
                "percent": round(system_memory.percent, 2)
            }
        except Exception as e:
            self.logger.error(f"Error getting memory usage: {e}")
            return {}
    
    def get_uptime(self) -> float:
        """Get service uptime in seconds"""
        return time.time() - self.start_time
    
    def send_status_update(self, 
                          status: str,
                          ready: bool,
                          message: str,
                          model_loaded: Optional[bool] = None,
                          model_loading: Optional[bool] = None,
                          model: Optional[str] = None,
                          error: Optional[str] = None,
                          degraded_mode: Optional[bool] = None) -> bool:
        """Send status update to Convex backend"""
        try:
            payload = {
                "serviceName": self.service_name,
                "status": status,
                "ready": ready,
                "message": message,
                "timestamp": int(time.time() * 1000),  # milliseconds
                "uptime": self.get_uptime(),
                "memoryUsage": self.get_memory_usage()
            }
            
            # Add optional fields if provided
            if model_loaded is not None:
                payload["modelLoaded"] = model_loaded
            if model_loading is not None:
                payload["modelLoading"] = model_loading
            if model is not None:
                payload["model"] = model
            if error is not None:
                payload["error"] = error
            if degraded_mode is not None:
                payload["degradedMode"] = degraded_mode
            
            # Add debug logging
            self.logger.info(f"Attempting to send status update to: {self.convex_url}/updateServiceStatus")
            self.logger.debug(f"Payload: {payload}")
            
            response = requests.post(
                f"{self.convex_url}/updateServiceStatus",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.debug(f"Status update sent successfully for {self.service_name}")
                return True
            else:
                self.logger.error(f"Failed to send status update: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error sending status update: {e}")
            self.logger.error(f"Convex URL being used: {self.convex_url}")
            return False
    
    def send_startup_status(self):
        """Send initial startup status with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                success = self.send_status_update(
                    status="starting",
                    ready=False,
                    message="Service is starting up"
                )
                if success:
                    return True
                    
                if attempt < max_retries - 1:
                    self.logger.info(f"Startup status failed, retrying in 2 seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(2)
                    
            except Exception as e:
                self.logger.error(f"Startup status attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    
        self.logger.error("Failed to send startup status after all retries")
        return False
    
    def send_healthy_status(self, model_name: Optional[str] = None):
        """Send healthy status with optional model info"""
        return self.send_status_update(
            status="healthy",
            ready=True,
            message="Service is running normally",
            model_loaded=True if model_name else None,
            model_loading=False if model_name else None,
            model=model_name
        )
    
    def send_loading_status(self, message: str = "Loading model"):
        """Send loading status"""
        return self.send_status_update(
            status="loading",
            ready=False,
            message=message,
            model_loading=True,
            model_loaded=False
        )
    
    def send_error_status(self, error_message: str):
        """Send error status"""
        return self.send_status_update(
            status="error",
            ready=False,
            message="Service encountered an error",
            error=error_message,
            model_loaded=False
        )
    
    def send_degraded_status(self, message: str):
        """Send degraded status"""
        return self.send_status_update(
            status="degraded",
            ready=True,
            message=message,
            degraded_mode=True
        )
    
    def start_periodic_reporting(self, interval_seconds: int = 30, get_status_callback=None):
        """Start periodic status reporting in a background thread"""
        def periodic_report():
            while True:
                try:
                    if get_status_callback:
                        status_info = get_status_callback()
                        self.send_status_update(**status_info)
                    else:
                        # Default healthy status if no callback provided
                        self.send_healthy_status()
                    time.sleep(interval_seconds)
                except Exception as e:
                    self.logger.error(f"Error in periodic status reporting: {e}")
                    time.sleep(interval_seconds)
        
        thread = threading.Thread(target=periodic_report, daemon=True)
        thread.start()
        self.logger.info(f"Started periodic status reporting every {interval_seconds} seconds")
        return thread
    
    def test_connectivity(self):
        """Test basic connectivity to Convex backend"""
        try:
            self.logger.info(f"Testing connectivity to Convex backend at: {self.convex_url}")
            
            # Try a simple GET request to the health endpoint first
            health_url = f"{self.convex_url}/api/health"
            response = requests.get(health_url, timeout=5)
            
            if response.status_code == 200:
                self.logger.info("✅ Successfully connected to Convex backend health endpoint")
            else:
                self.logger.warning(f"⚠️ Health endpoint returned status {response.status_code}")
                
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"❌ Connection failed to Convex backend: {e}")
            self.logger.error("This suggests the convex-backend service is not reachable")
        except requests.exceptions.Timeout as e:
            self.logger.error(f"❌ Connection timeout to Convex backend: {e}")
        except Exception as e:
            self.logger.error(f"❌ Unexpected error testing connectivity: {e}")