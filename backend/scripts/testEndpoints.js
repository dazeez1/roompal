/**
 * Test All API Endpoints
 * Comprehensive endpoint testing script
 */

const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5002/api';
let accessToken = null;
let refreshToken = null;
let testUserId = null;
let testPropertyId = null;
let testConversationId = null;

/**
 * Test helper functions
 */
const testEndpoint = async (name, method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'N/A';
    const message = error.response?.data?.message || error.message;
    console.log(`❌ ${name}: ${status} - ${message}`);
    return { success: false, error: message };
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log('🧪 Testing All API Endpoints\n');
  console.log('='.repeat(60));

  // 1. Health Check
  console.log('\n📡 Health Check');
  await testEndpoint('GET /health', 'GET', '/health');

  // 2. Authentication Tests
  console.log('\n🔐 Authentication Endpoints');
  const registerResult = await testEndpoint(
    'POST /auth/register',
    'POST',
    '/auth/register',
    {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    }
  );

  if (registerResult.success) {
    accessToken = registerResult.data.data?.tokens?.accessToken;
    refreshToken = registerResult.data.data?.tokens?.refreshToken;
    testUserId = registerResult.data.data?.user?._id;
  }

  // Login test
  const loginResult = await testEndpoint(
    'POST /auth/login',
    'POST',
    '/auth/login',
    {
      email: 'test@example.com',
      password: 'password123',
    }
  );

  if (loginResult.success && !accessToken) {
    accessToken = loginResult.data.data?.tokens?.accessToken;
    refreshToken = loginResult.data.data?.tokens?.refreshToken;
    testUserId = loginResult.data.data?.user?._id;
  }

  if (!accessToken) {
    console.log('\n⚠️  No access token available. Some tests will be skipped.');
    return;
  }

  // Get current user
  await testEndpoint('GET /auth/me', 'GET', '/auth/me', null, accessToken);

  // 3. Property Tests
  console.log('\n🏠 Property Endpoints');
  await testEndpoint('GET /properties', 'GET', '/properties');
  await testEndpoint('GET /properties (with filters)', 'GET', '/properties?location=Lagos&minPrice=1000000&maxPrice=5000000');

  // Create property
  const createPropertyResult = await testEndpoint(
    'POST /properties',
    'POST',
    '/properties',
    {
      title: 'Test Property',
      description: 'This is a test property description with enough characters to pass validation.',
      location: 'Lagos, Nigeria',
      price: 2000000,
      apartmentType: 'Apartments / Flats',
      bedrooms: 2,
      bathrooms: 2,
    },
    accessToken
  );

  if (createPropertyResult.success) {
    testPropertyId = createPropertyResult.data.data?.property?._id;
  }

  if (testPropertyId) {
    await testEndpoint('GET /properties/:id', 'GET', `/properties/${testPropertyId}`);
    await testEndpoint('GET /properties/my/properties', 'GET', '/properties/my/properties', null, accessToken);
  }

  // 4. Roommate Tests
  console.log('\n👫 Roommate Endpoints');
  await testEndpoint('GET /roommates', 'GET', '/roommates');

  // Create roommate profile
  await testEndpoint(
    'POST /roommates/profile',
    'POST',
    '/roommates/profile',
    {
      gender: 'Male',
      preferredGender: 'No preference',
      budget: 500000,
      preferredLocation: 'Lagos, Nigeria',
      lifestyle: 'Balanced',
      cleanlinessLevel: 3,
      smoking: false,
      pets: false,
      occupation: 'Software Engineer',
      bio: 'Looking for a clean and respectful roommate.',
      isActive: true,
    },
    accessToken
  );

  await testEndpoint('GET /roommates/me', 'GET', '/roommates/me', null, accessToken);
  await testEndpoint('GET /roommates/matches', 'GET', '/roommates/matches', null, accessToken);

  // 5. Message Tests
  console.log('\n💬 Message Endpoints');
  await testEndpoint('GET /messages/conversations', 'GET', '/messages/conversations', null, accessToken);
  await testEndpoint('GET /messages/unread/count', 'GET', '/messages/unread/count', null, accessToken);

  // Get conversations first to find a conversation ID
  const conversationsResult = await testEndpoint(
    'GET /messages/conversations',
    'GET',
    '/messages/conversations',
    null,
    accessToken
  );

  if (conversationsResult.success && conversationsResult.data.data?.conversations?.length > 0) {
    testConversationId = conversationsResult.data.data.conversations[0]._id;
    await testEndpoint(
      'GET /messages/:conversationId',
      'GET',
      `/messages/${testConversationId}`,
      null,
      accessToken
    );
  }

  // Send message (need another user ID - this is simplified)
  console.log('\n✅ All endpoint tests completed!');
  console.log('\n📝 Note: Some tests may fail if data doesn\'t exist.');
  console.log('   Run "npm run seed:all" to populate test data first.');
};

// Run tests
runTests().catch(console.error);
