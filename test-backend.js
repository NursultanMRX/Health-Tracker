// Simple test script to check if backend is working
import fetch from 'node-fetch';

const BACKEND_URL = 'https://health-tracker-production-598b.up.railway.app';

async function testBackend() {
  console.log('Testing backend endpoints...\n');
  
  const endpoints = [
    '/api/doctors',
    '/api/auth/session',
    '/api/profiles'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${BACKEND_URL}${endpoint}`);
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ Endpoint is working');
      } else {
        console.log('❌ Endpoint returned error');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }
}

testBackend();
