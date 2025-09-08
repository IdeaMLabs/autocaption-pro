// Test Language Selection Flow
// Tests the complete language selection and translation functionality

const BASE_URL = process.env.BASE_URL || "http://localhost:8787";

async function testLanguageFlow() {
  console.log("🧪 Starting Language Flow Tests...\n");

  try {
    // Test 1: Checkout with language selection
    await testCheckoutWithLanguages();
    
    // Test 2: Process endpoint with languages
    await testProcessWithLanguages();
    
    // Test 3: Status endpoint returns language info
    await testStatusWithLanguages();
    
    console.log("\n✅ All language flow tests completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Language flow tests failed:", error);
    process.exit(1);
  }
}

async function testCheckoutWithLanguages() {
  console.log("1. Testing checkout session with language selection...");
  
  const testData = {
    spoken_lang: "auto",
    caption_lang: "spanish"
  };
  
  try {
    const response = await fetch(`${BASE_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok && (result.id || result.url)) {
      console.log("   ✅ Checkout session created successfully");
      console.log(`   📝 Session ID: ${result.id || 'N/A'}`);
      return result;
    } else {
      throw new Error(`Checkout failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Checkout test failed: ${error.message}`);
    throw error;
  }
}

async function testProcessWithLanguages() {
  console.log("\n2. Testing process endpoint with language parameters...");
  
  const testCases = [
    {
      name: "Auto detect to English",
      data: {
        video_url: "https://www.youtube.com/watch?v=test123",
        spoken_lang: "auto",
        caption_lang: "en"
      }
    },
    {
      name: "English to Spanish translation",
      data: {
        video_url: "https://www.youtube.com/watch?v=test456",
        spoken_lang: "en",
        caption_lang: "es"
      }
    },
    {
      name: "French to German translation",
      data: {
        video_url: "https://www.youtube.com/watch?v=test789",
        spoken_lang: "fr",
        caption_lang: "de"
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`   Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      console.log(`   Debug: Response status: ${response.status}`);
      console.log(`   Debug: Response body:`, result);
      
      if (response.ok && (result.job_id || result.state)) {
        console.log(`   ✅ ${testCase.name}: Processing started`);
        console.log(`   📝 Job ID: ${result.job_id}`);
        console.log(`   🗣️ Spoken: ${result.spoken_lang}`);
        console.log(`   📝 Caption: ${result.caption_lang}`);
        
        // Store job ID for status test
        testCase.jobId = result.job_id;
      } else {
        throw new Error(`Processing failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name} failed: ${error.message}`);
      throw error;
    }
  }
  
  return testCases;
}

async function testStatusWithLanguages() {
  console.log("\n3. Testing status endpoint returns language information...");
  
  // Create a test job first
  const processResponse = await fetch(`${BASE_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_url: "https://www.youtube.com/watch?v=statustest",
      spoken_lang: "auto",
      caption_lang: "fr"
    })
  });
  
  const processResult = await processResponse.json();
  const jobId = processResult.job_id;
  
  console.log(`   Testing status for job: ${jobId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/status?job_id=${jobId}`);
    const result = await response.json();
    
    console.log(`   Debug: Status response:`, result);
    
    if (response.ok) {
      console.log("   ✅ Status endpoint responded successfully");
      console.log(`   📊 Status: ${result.state || result.status || 'N/A'}`);
      console.log(`   🗣️ Spoken Language: ${result.spoken_lang || 'N/A'}`);
      console.log(`   📝 Caption Language: ${result.caption_lang || 'N/A'}`);
      
      // Verify language fields are present
      if (result.spoken_lang && result.caption_lang) {
        console.log("   ✅ Language metadata properly returned");
      } else {
        throw new Error("Language metadata missing from status response");
      }
    } else {
      throw new Error(`Status check failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Status test failed: ${error.message}`);
    throw error;
  }
}

async function testTranslationScenario() {
  console.log("\n4. Testing complete translation scenario...");
  
  const testData = {
    video_url: "https://www.youtube.com/watch?v=translation-test",
    spoken_lang: "en",
    caption_lang: "es"
  };
  
  // Start processing
  const processResponse = await fetch(`${BASE_URL}/process`, {
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testData)
  });
  
  const processResult = await processResponse.json();
  console.log(`   🔄 Started translation job: ${processResult.job_id}`);
  
  // Wait for processing (simulated)
  console.log("   ⏳ Waiting for processing to complete...");
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Check final status
  const statusResponse = await fetch(`${BASE_URL}/status?job_id=${processResult.job_id}`);
  const statusResult = await statusResponse.json();
  
  console.log(`   📊 Final status: ${statusResult.status}`);
  if (statusResult.captions) {
    console.log(`   📝 Captions: ${statusResult.captions.substring(0, 100)}...`);
  }
  
  if (statusResult.captions && statusResult.captions.includes("Translated from")) {
    console.log("   ✅ Translation indicator found in output");
  }
}

// Run tests if called directly
if (require.main === module) {
  testLanguageFlow()
    .then(() => {
      console.log("\n🎉 Language flow testing completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Language flow testing failed:", error);
      process.exit(1);
    });
}

module.exports = { testLanguageFlow };