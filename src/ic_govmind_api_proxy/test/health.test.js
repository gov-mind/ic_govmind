// Simple health check test for IC GovMind API Proxy
// Run with: node test/health.test.js

import http from 'http';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

console.log('🧪 Testing IC GovMind API Proxy Health Check...');

const testHealthCheck = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.status === 'OK') {
            console.log('✅ Health check passed');
            console.log('📊 Response:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.log('❌ Health check failed');
            console.log('Status Code:', res.statusCode);
            console.log('Response:', data);
            reject(new Error(`Health check failed: ${res.statusCode}`));
          }
        } catch (error) {
          console.log('❌ Failed to parse response');
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed');
      console.log('Error:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const runTests = async () => {
  try {
    await testHealthCheck();
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.log('\n💥 Tests failed:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   npm start  (or npm run dev)');
    process.exit(1);
  }
};

// Run tests
runTests(); 