// Simple test script to verify title saving functionality
// Run this with: node test-title-saving.js

const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";
const WEB_API_URL = process.env.WEB_API_URL || "http://localhost:3000";

async function testTitleSaving() {
  console.log("Testing title saving functionality...");
  
  // Use a real conversation ID from your database
  const testConversationId = "kh7dsk72s5rzzc63z6yjfv1mx97nvcv9"; // From your example
  const testTitle = "Test Title from Script";
  
  try {
    // Test the web API endpoint
    console.log("Testing web API endpoint...");
    const response = await fetch(`${WEB_API_URL}/api/conversations/update-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        title: testTitle,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Web API endpoint works:", result);
    } else {
      const error = await response.text();
      console.log("❌ Web API endpoint failed:", response.status, error);
    }
    
    // Test the Convex HTTP endpoint directly
    console.log("Testing Convex HTTP endpoint...");
    const convexResponse = await fetch(`${CONVEX_HTTP_URL}/api/updateConversationTitle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        title: testTitle,
      }),
    });
    
    if (convexResponse.ok) {
      const result = await convexResponse.json();
      console.log("✅ Convex HTTP endpoint works:", result);
    } else {
      const error = await convexResponse.text();
      console.log("❌ Convex HTTP endpoint failed:", convexResponse.status, error);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testTitleSaving();