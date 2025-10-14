// Simple Node.js script to validate Agora credentials
// Run with: node validate-agora.js

require('dotenv').config({ path: '.env.local' });

const APP_ID = process.env.VITE_AGORA_APP_ID;
const TOKEN = process.env.VITE_AGORA_TEMP_TOKEN;

console.log('🔍 Validating Agora Credentials...\n');

console.log('Environment Variables:');
console.log('- VITE_AGORA_APP_ID:', APP_ID ? `${APP_ID.substring(0, 8)}...` : '❌ NOT FOUND');
console.log('- VITE_AGORA_TEMP_TOKEN:', TOKEN ? `${TOKEN.substring(0, 20)}...` : '❌ NOT FOUND');

console.log('\nValidation Checks:');

// Check App ID format
if (!APP_ID) {
  console.log('❌ App ID is missing');
} else if (APP_ID.length !== 32) {
  console.log(`❌ App ID should be 32 characters, got ${APP_ID.length}`);
} else if (!/^[a-f0-9]+$/i.test(APP_ID)) {
  console.log('❌ App ID should only contain hexadecimal characters (a-f, 0-9)');
} else {
  console.log('✅ App ID format looks correct');
}

// Check Token format
if (!TOKEN) {
  console.log('❌ Token is missing');
} else if (!TOKEN.startsWith('007')) {
  console.log('❌ Token should start with "007"');
} else if (TOKEN.length < 100) {
  console.log(`❌ Token seems too short (${TOKEN.length} chars), should be longer`);
} else {
  console.log('✅ Token format looks correct');
}

console.log('\n📋 Next Steps:');
console.log('1. If any checks failed, update your .env.local file');
console.log('2. Make sure to restart your dev server after changes');
console.log('3. Use the AgoraTest component in your app to test connection');

if (APP_ID && TOKEN) {
  console.log('\n🎯 Ready to test! Your credentials look properly formatted.');
} else {
  console.log('\n⚠️  Please fix the missing credentials before testing.');
}