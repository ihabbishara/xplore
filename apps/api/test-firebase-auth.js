#!/usr/bin/env node

/**
 * Test script for Firebase Authentication
 * This script tests the Firebase authentication implementation
 */

const express = require('express');
const cors = require('cors');

// Create a minimal Express app
const app = express();
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint that requires authentication
app.get('/api/test/auth', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    
    // Log the token for debugging
    console.log('Received token:', token.substring(0, 20) + '...');
    
    // For testing, we'll just return success
    // In the real implementation, this would verify the Firebase token
    res.json({
      message: 'Authentication successful',
      tokenType: token.length > 200 ? 'Firebase ID Token' : 'JWT Token',
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the test server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`
🚀 Firebase Auth Test Server Running
===================================
Server URL: http://localhost:${PORT}
Health Check: http://localhost:${PORT}/health
Test Auth: http://localhost:${PORT}/api/test/auth

To test authentication:
1. Send a GET request to /api/test/auth with Authorization header
2. Use format: Authorization: Bearer YOUR_TOKEN

Example with curl:
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" http://localhost:${PORT}/api/test/auth
  `);
});