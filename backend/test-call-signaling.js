// Test script for video call signaling
// Run this with: node test-call-signaling.js

const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000'; // Change to your backend URL

console.log('🧪 Testing Video Call Signaling Events...\n');

// Create two mock clients (users)
const user1 = io(SOCKET_URL);
const user2 = io(SOCKET_URL);

const USER1_ID = 'test-user-1';
const USER2_ID = 'test-user-2';

// User 1 setup
user1.on('connect', () => {
  console.log('✅ User 1 connected:', user1.id);
  user1.emit('user-online', { userId: USER1_ID });
});

user1.on('call-accepted', (callData) => {
  console.log('✅ User 1 received: call-accepted', callData);
});

user1.on('call-rejected', (callData) => {
  console.log('❌ User 1 received: call-rejected', callData);
});

user1.on('call-ended', (callData) => {
  console.log('📞 User 1 received: call-ended', callData);
});

// User 2 setup
user2.on('connect', () => {
  console.log('✅ User 2 connected:', user2.id);
  user2.emit('user-online', { userId: USER2_ID });
  
  // Start test after both users are connected
  setTimeout(runTests, 1000);
});

user2.on('incoming-call', (callData) => {
  console.log('📞 User 2 received: incoming-call', callData);
  
  // Auto-accept the call after 2 seconds
  setTimeout(() => {
    console.log('📞 User 2 accepting call...');
    user2.emit('accept-call', callData);
  }, 2000);
});

user2.on('call-ended', (callData) => {
  console.log('📞 User 2 received: call-ended', callData);
  process.exit(0); // End test
});

function runTests() {
  console.log('\n🚀 Starting call signaling test...\n');
  
  // Simulate User 1 calling User 2
  const callData = {
    callId: `test-call-${Date.now()}`,
    callerId: USER1_ID,
    callerName: 'Test User 1',
    callerAvatar: null,
    recipientId: USER2_ID,
    type: 'video',
    channel: `test-channel-${Date.now()}`,
    timestamp: Date.now()
  };
  
  console.log('📞 User 1 initiating call to User 2...');
  user1.emit('initiate-call', callData);
  
  // End call after 5 seconds
  setTimeout(() => {
    console.log('📞 User 1 ending call...');
    user1.emit('end-call', callData);
  }, 5000);
}

// Error handling
user1.on('connect_error', (error) => {
  console.error('❌ User 1 connection error:', error.message);
});

user2.on('connect_error', (error) => {
  console.error('❌ User 2 connection error:', error.message);
});

console.log('Connecting to Socket.IO server at:', SOCKET_URL);
console.log('Make sure your backend server is running!\n');