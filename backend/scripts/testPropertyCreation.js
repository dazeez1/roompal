/**
 * Test Property Creation Endpoint
 * Tests the simplified property creation with FormData
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5002/api';

async function testPropertyCreation() {
  console.log('🧪 Testing Property Creation Endpoint\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login to get token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'kvngdrey8@gmail.com',
      password: '@damilare2001R',
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const accessToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');
    console.log('   Token:', accessToken.substring(0, 20) + '...');

    // Step 2: Create FormData
    console.log('\n2️⃣ Creating FormData...');
    const formData = new FormData();
    
    // Add required fields
    formData.append('title', 'Test Property - 2-Bedroom Apartment in Lagos');
    formData.append('description', 'This is a test property listing with all required fields filled out properly. It has modern amenities and is located in a prime area.');
    formData.append('location', 'Lagos, Ikeja');
    formData.append('price', '2500000');
    formData.append('apartmentType', 'Apartments / Flats');
    formData.append('bedrooms', '2');
    formData.append('bathrooms', '2');

    // Create a dummy image file (1x1 pixel PNG)
    const dummyImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Add image to FormData
    formData.append('images', dummyImage, {
      filename: 'test-image.png',
      contentType: 'image/png',
    });

    console.log('✅ FormData created with:');
    console.log('   - title:', formData.getBuffer('title').toString());
    console.log('   - location:', formData.getBuffer('location').toString());
    console.log('   - price:', formData.getBuffer('price').toString());
    console.log('   - 1 image file');

    // Step 3: Create Property
    console.log('\n3️⃣ Creating property...');
    const createResponse = await axios.post(`${BASE_URL}/properties`, formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (createResponse.data.success) {
      console.log('✅ Property created successfully!');
      console.log('   Property ID:', createResponse.data.data.property._id);
      console.log('   Title:', createResponse.data.data.property.title);
      console.log('   Location:', createResponse.data.data.property.location);
      console.log('   Price:', createResponse.data.data.property.price);
      console.log('   Images:', createResponse.data.data.property.images.length);
      console.log('   Status:', createResponse.data.data.property.isApproved ? 'Approved' : 'Pending Approval');
    } else {
      console.error('❌ Property creation failed:', createResponse.data.message);
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.message);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run test
testPropertyCreation();
