# Xplore API Security Guidelines

## Overview

The Xplore API implements comprehensive security measures to protect against common web vulnerabilities and ensure data integrity. This document outlines the security features, best practices, and guidelines for developers.

## Security Features

### 1. HTTPS Enforcement

All production API requests must use HTTPS. HTTP requests are automatically redirected to HTTPS.

**Implementation:**
- Automatic 301 redirect from HTTP to HTTPS in production
- Strict Transport Security (HSTS) header with 1-year max-age
- Includes subdomains and preload directive

### 2. Security Headers (Helmet.js)

The API uses Helmet.js to set various HTTP headers for enhanced security:

- **Content-Security-Policy**: Restricts resource loading to prevent XSS
- **X-Frame-Options**: Prevents clickjacking (SAMEORIGIN)
- **X-Content-Type-Options**: Prevents MIME type sniffing (nosniff)
- **X-XSS-Protection**: Legacy XSS protection for older browsers
- **X-DNS-Prefetch-Control**: Controls DNS prefetching (off)
- **Strict-Transport-Security**: Forces HTTPS connections

### 3. Rate Limiting

Protects against brute force attacks and API abuse:

**Authentication Endpoints** (`/api/auth/*`):
- Development: 10 requests per 15 minutes per IP
- Production: 5 requests per 15 minutes per IP
- Skips counting successful requests in production

**General API Endpoints** (`/api/*`):
- Development: 100 requests per 5 minutes per IP
- Production: 50 requests per 5 minutes per IP

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until next request allowed (when limited)

### 4. CSRF Protection

Cross-Site Request Forgery protection for state-changing operations:

**Getting CSRF Token:**
```bash
GET /api/csrf-token
Response: { "csrfToken": "..." }
```

**Using CSRF Token:**
- Include token in `X-CSRF-Token` header for POST/PUT/DELETE requests
- Token is tied to session via secure cookie
- Automatic validation on all state-changing routes

**Excluded Endpoints:**
- `/health` - Health check
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/refresh` - Token refresh
- `/api/auth/firebase` - Firebase authentication

### 5. Input Sanitization

All user inputs are sanitized to prevent XSS attacks:

**Sanitized Elements:**
- Request body (JSON)
- Query parameters
- URL parameters
- Dangerous HTML tags and attributes are removed
- SQL injection characters are escaped

**Allowed HTML Tags:**
`<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`, `<ul>`, `<ol>`, `<li>`

**Allowed Attributes:**
- `href` and `target` on `<a>` tags only

### 6. Error Handling

Secure error responses that don't leak sensitive information:

**Development:**
- Full error messages and stack traces for debugging
- Detailed validation errors

**Production:**
- Generic error messages for server errors
- No stack traces exposed
- Errors logged internally with full details

## Authentication & Authorization

### JWT Token Management

**Access Tokens:**
- 15-minute expiration
- Used for API requests
- Sent in `Authorization: Bearer <token>` header

**Refresh Tokens:**
- 7-day expiration
- Used to obtain new access tokens
- Stored in httpOnly, secure cookies

### Firebase Authentication

Alternative authentication method:
- Firebase ID tokens accepted
- Verified using Firebase Admin SDK
- Same authorization rules apply

## API Security Best Practices

### 1. Request Headers

Always include these headers in your requests:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token> (for state-changing requests)
```

### 2. Response Validation

- Always validate response status codes
- Check for error responses before processing data
- Verify response content-type is `application/json`

### 3. Error Handling

```javascript
try {
  const response = await fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    // Handle specific error codes
    switch (error.error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Wait and retry
        break;
      case 'CSRF_TOKEN_INVALID':
        // Refresh CSRF token
        break;
      default:
        // Handle generic error
    }
  }
} catch (error) {
  // Network or parsing error
}
```

### 4. Secure Data Storage

- Never store sensitive data in localStorage
- Use secure, httpOnly cookies for refresh tokens
- Clear sensitive data on logout
- Implement proper session management

## Security Checklist for Developers

- [ ] Always use HTTPS in production
- [ ] Include CSRF tokens in all state-changing requests
- [ ] Handle rate limit responses appropriately
- [ ] Validate and sanitize all user inputs on the client side too
- [ ] Never expose sensitive data in error messages
- [ ] Implement proper error handling for all API calls
- [ ] Use secure storage for tokens and sensitive data
- [ ] Regular security audits and dependency updates
- [ ] Monitor for suspicious activity patterns
- [ ] Implement request signing for critical operations

## Environment-Specific Configurations

### Development
- Relaxed CORS for localhost origins
- More lenient rate limits
- Detailed error messages
- Unsafe-inline allowed in CSP for hot reloading

### Production
- Strict CORS with whitelisted origins
- Strict rate limits
- Generic error messages
- Strict CSP without unsafe directives
- HTTPS enforcement
- Secure cookies with SameSite=Strict

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to: security@xplore.app
3. Include detailed steps to reproduce
4. Allow 48 hours for initial response

## Security Update Process

1. Regular dependency updates (weekly)
2. Security patch deployment within 24 hours
3. Critical vulnerabilities patched immediately
4. Security audit logging for all changes

## Compliance

The API is designed to be compliant with:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- OWASP Top 10 security guidelines
- PCI DSS for payment processing (when implemented)

## Monitoring & Alerts

Security events are monitored and logged:
- Failed authentication attempts
- Rate limit violations
- CSRF token failures
- Input sanitization modifications
- Suspicious request patterns

Alerts are triggered for:
- Multiple failed auth attempts from same IP
- Unusual traffic patterns
- Security header bypass attempts
- Potential SQL injection attempts

---

Last Updated: January 2025
Version: 1.0