# Authentication Guide

## Overview

The 209jobs API supports multiple authentication methods to accommodate different use cases and security requirements. This guide covers all authentication methods, security best practices, and implementation details.

## Authentication Methods

### 1. JWT Token Authentication (Recommended)

JWT (JSON Web Token) authentication is the recommended method for most applications, especially web and mobile applications where users need to maintain sessions.

#### Features

- **Stateless**: No server-side session storage required
- **Secure**: Cryptographically signed tokens
- **Flexible**: Support for user roles and permissions
- **Automatic Expiry**: Built-in token expiration
- **Refresh Tokens**: Seamless token renewal

#### Getting a JWT Token

```bash
curl -X POST https://api.209jobs.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-secure-password"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "jobseeker",
      "emailVerified": true,
      "twoFactorEnabled": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJyb2xlIjoiam9ic2Vla2VyIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature_here",
    "refreshToken": "refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### Using JWT Tokens

Include the JWT token in the `Authorization` header using the `Bearer` scheme:

```bash
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Token Refresh

When your access token expires, use the refresh token to get a new access token:

```bash
curl -X POST https://api.209jobs.com/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### JavaScript Implementation

```javascript
class AuthManager {
  constructor() {
    this.baseURL = 'https://api.209jobs.com/v1';
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      this.token = data.data.token;
      this.refreshToken = data.data.refreshToken;

      localStorage.setItem('access_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);

      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('access_token', this.token);
      return this.token;
    } else {
      this.logout();
      throw new Error('Token refresh failed');
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      try {
        await this.refreshAccessToken();
        headers.Authorization = `Bearer ${this.token}`;

        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

### 2. API Key Authentication

API keys are ideal for server-to-server integrations, automated scripts, and applications that don't require user-specific authentication.

#### Features

- **Simple**: No token exchange required
- **Persistent**: Keys don't expire automatically
- **Secure**: Can be revoked and rotated
- **Rate Limited**: Per-key rate limiting
- **Scoped**: Keys can have specific permissions

#### Getting an API Key

API keys are generated through the dashboard:

1. Log in to your 209jobs account
2. Navigate to Settings > API Keys
3. Click "Generate New API Key"
4. Set permissions and restrictions
5. Copy and securely store your API key

#### Using API Keys

Include the API key in the `X-API-Key` header:

```bash
curl -X GET https://api.209jobs.com/v1/jobs \
  -H "X-API-Key: sk_live_1234567890abcdef..."
```

#### API Key Types

**Development Keys** (`sk_dev_...`):

- For testing and development
- Limited rate limits
- Access to staging environment

**Production Keys** (`sk_live_...`):

- For production applications
- Full rate limits
- Access to production environment

**Restricted Keys** (`sk_restricted_...`):

- Limited permissions
- Specific endpoint access only
- Lower rate limits

#### Python Implementation

```python
import requests
from typing import Optional

class APIKeyAuth:
    def __init__(self, api_key: str, base_url: str = "https://api.209jobs.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def get(self, endpoint: str, params: Optional[dict] = None):
        """Make GET request with API key authentication"""
        response = self.session.get(f"{self.base_url}{endpoint}", params=params)
        return self._handle_response(response)

    def post(self, endpoint: str, data: Optional[dict] = None):
        """Make POST request with API key authentication"""
        response = self.session.post(f"{self.base_url}{endpoint}", json=data)
        return self._handle_response(response)

    def put(self, endpoint: str, data: Optional[dict] = None):
        """Make PUT request with API key authentication"""
        response = self.session.put(f"{self.base_url}{endpoint}", json=data)
        return self._handle_response(response)

    def delete(self, endpoint: str):
        """Make DELETE request with API key authentication"""
        response = self.session.delete(f"{self.base_url}{endpoint}")
        return self._handle_response(response)

    def _handle_response(self, response):
        """Handle API response and errors"""
        if response.status_code == 401:
            raise Exception("Invalid API key")
        elif response.status_code == 403:
            raise Exception("API key does not have required permissions")
        elif response.status_code == 429:
            raise Exception("Rate limit exceeded")
        elif response.status_code >= 400:
            try:
                error_data = response.json()
                raise Exception(f"API Error: {error_data.get('message', 'Unknown error')}")
            except ValueError:
                raise Exception(f"HTTP Error {response.status_code}")

        return response.json()

# Usage example
client = APIKeyAuth('sk_live_1234567890abcdef...')
jobs = client.get('/jobs', params={'query': 'software engineer'})
```

## Two-Factor Authentication (2FA)

For enhanced security, 209jobs supports Time-based One-Time Password (TOTP) 2FA.

### Setting Up 2FA

#### Step 1: Enable 2FA

```bash
curl -X POST https://api.209jobs.com/v1/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "GENERATED_SECRET_FROM_QR_CODE",
    "token": "123456"
  }'
```

#### Step 2: Login with 2FA

When 2FA is enabled, the login process requires an additional step:

```bash
# Step 1: Initial login
curl -X POST https://api.209jobs.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Response when 2FA is required:

```json
{
  "success": false,
  "message": "Two-factor authentication required",
  "code": "2FA_REQUIRED",
  "data": {
    "sessionId": "session_123456789",
    "expiresIn": 300
  }
}
```

```bash
# Step 2: Verify 2FA token
curl -X POST https://api.209jobs.com/v1/auth/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123456789",
    "token": "123456"
  }'
```

### JavaScript 2FA Implementation

```javascript
class TwoFactorAuth {
  async loginWith2FA(email, password) {
    // Step 1: Initial login
    const loginResponse = await fetch('https://api.209jobs.com/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (loginData.code === '2FA_REQUIRED') {
      // Store session ID for 2FA verification
      this.sessionId = loginData.data.sessionId;
      return { requiresTwoFactor: true };
    } else if (loginData.success) {
      // User doesn't have 2FA enabled
      return {
        requiresTwoFactor: false,
        user: loginData.data.user,
        token: loginData.data.token,
      };
    } else {
      throw new Error(loginData.message);
    }
  }

  async verify2FA(token) {
    const response = await fetch('https://api.209jobs.com/v1/auth/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        token: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        user: data.data.user,
        token: data.data.token,
        refreshToken: data.data.refreshToken,
      };
    } else {
      throw new Error(data.message);
    }
  }

  async setup2FA(secret, token) {
    const response = await fetch('https://api.209jobs.com/v1/auth/2fa/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ secret, token }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data;
  }
}
```

## Role-Based Access Control (RBAC)

The 209jobs API implements role-based access control with three primary roles:

### User Roles

#### 1. Jobseeker (`jobseeker`)

**Permissions:**

- View public job listings
- Apply to jobs
- Create and manage job alerts
- Update own profile
- Save/unsave jobs
- View application history

**Restrictions:**

- Cannot create job postings
- Cannot view other users' applications
- Cannot create advertisements

#### 2. Employer (`employer`)

**Permissions:**

- All jobseeker permissions
- Create, update, and delete job postings
- View and manage job applications
- Create and manage advertisements
- Search jobseeker profiles
- View analytics for own content

**Restrictions:**

- Cannot view other employers' data
- Cannot access admin functions

#### 3. Admin (`admin`)

**Permissions:**

- All system permissions
- View all users and content
- Moderate content
- Access system analytics
- Manage user accounts
- Configure system settings

### Checking User Permissions

```javascript
function hasPermission(userRole, requiredPermission) {
  const permissions = {
    jobseeker: [
      'jobs:read',
      'jobs:apply',
      'alerts:create',
      'alerts:read',
      'alerts:update',
      'alerts:delete',
      'profile:update',
      'applications:read',
    ],
    employer: [
      'jobs:create',
      'jobs:read',
      'jobs:update',
      'jobs:delete',
      'applications:read',
      'ads:create',
      'ads:read',
      'ads:update',
      'ads:delete',
      'users:search',
      'analytics:read',
    ],
    admin: [
      'system:read',
      'system:write',
      'users:read',
      'users:write',
      'content:moderate',
      'analytics:admin',
    ],
  };

  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes(requiredPermission);
}

// Usage
if (hasPermission(user.role, 'jobs:create')) {
  // Allow job creation
} else {
  // Show access denied message
}
```

## Security Best Practices

### 1. Token Storage

**Browser Applications:**

```javascript
// Store tokens securely
const storeTokens = (accessToken, refreshToken) => {
  // Use httpOnly cookies for maximum security (server-side implementation required)
  // Or use localStorage/sessionStorage with proper XSS protection
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

// Clear tokens on logout
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.clear();
};
```

**Mobile Applications:**

```swift
// iOS Keychain (Swift)
import Security

class TokenManager {
    private let service = "com.209jobs.app"

    func storeToken(_ token: String, for key: String) {
        let data = token.data(using: .utf8)!

        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ] as [String: Any]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func getToken(for key: String) -> String? {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: kCFBooleanTrue!,
            kSecMatchLimit as String: kSecMatchLimitOne
        ] as [String: Any]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        if status == noErr {
            let data = dataTypeRef as! Data
            return String(data: data, encoding: .utf8)
        }

        return nil
    }
}
```

### 2. Token Validation

**Server-side validation (Node.js):**

```javascript
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = user;
    next();
  });
};

// Usage in Express routes
app.get('/api/protected', validateToken, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
```

### 3. Rate Limiting by Authentication

Different rate limits apply based on authentication method:

```python
# Rate limits per minute
RATE_LIMITS = {
    'unauthenticated': 20,
    'jwt_token': 100,
    'api_key_dev': 50,
    'api_key_production': 200,
    'admin': 500
}

def get_rate_limit(request):
    if request.headers.get('X-API-Key'):
        api_key = request.headers['X-API-Key']
        if api_key.startswith('sk_dev_'):
            return RATE_LIMITS['api_key_dev']
        elif api_key.startswith('sk_live_'):
            return RATE_LIMITS['api_key_production']
    elif request.headers.get('Authorization'):
        token = request.headers['Authorization'].replace('Bearer ', '')
        user = decode_jwt(token)
        if user.get('role') == 'admin':
            return RATE_LIMITS['admin']
        else:
            return RATE_LIMITS['jwt_token']

    return RATE_LIMITS['unauthenticated']
```

### 4. API Key Management

**Best Practices:**

- Use environment variables for API keys
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage and set up alerts
- Implement key scoping and restrictions

```bash
# Environment variables
export JOBS_API_KEY_DEV="sk_dev_1234567890abcdef..."
export JOBS_API_KEY_PROD="sk_live_9876543210fedcba..."

# Key rotation script
#!/bin/bash
OLD_KEY=$JOBS_API_KEY_PROD
NEW_KEY=$(curl -X POST https://api.209jobs.com/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Key", "permissions": ["jobs:read", "jobs:write"]}' \
  | jq -r '.data.key')

# Update environment variable
export JOBS_API_KEY_PROD=$NEW_KEY

# Revoke old key after deployment
curl -X DELETE https://api.209jobs.com/v1/api-keys/$OLD_KEY \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Error Handling

### Authentication Errors

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "AUTH_REQUIRED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

| Code                       | Status | Description                      | Action                     |
| -------------------------- | ------ | -------------------------------- | -------------------------- |
| `AUTH_REQUIRED`            | 401    | No authentication provided       | Provide valid credentials  |
| `INVALID_TOKEN`            | 401    | Token is invalid or malformed    | Refresh or re-authenticate |
| `TOKEN_EXPIRED`            | 401    | Token has expired                | Refresh token              |
| `INVALID_CREDENTIALS`      | 401    | Username/password incorrect      | Check credentials          |
| `2FA_REQUIRED`             | 422    | Two-factor authentication needed | Provide 2FA token          |
| `INSUFFICIENT_PERMISSIONS` | 403    | User lacks required permissions  | Check user role            |
| `API_KEY_INVALID`          | 401    | API key is invalid               | Check API key              |
| `RATE_LIMIT_EXCEEDED`      | 429    | Too many requests                | Wait and retry             |

### Error Handling Implementation

```javascript
class APIError extends Error {
  constructor(response, data) {
    super(data.message);
    this.name = 'APIError';
    this.code = data.code;
    this.status = response.status;
    this.timestamp = data.timestamp;
  }
}

const handleAPIError = async response => {
  const data = await response.json();

  switch (response.status) {
    case 401:
      if (data.code === '2FA_REQUIRED') {
        // Handle 2FA requirement
        return { requiresTwoFactor: true, sessionId: data.data.sessionId };
      } else if (data.code === 'TOKEN_EXPIRED') {
        // Attempt token refresh
        return await refreshToken();
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
      break;

    case 403:
      // Show access denied message
      throw new APIError(response, data);

    case 429:
      // Implement exponential backoff
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      // Retry the request
      break;

    default:
      throw new APIError(response, data);
  }
};
```

## Testing Authentication

### Unit Tests

```javascript
// Jest test examples
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const auth = new AuthManager();
    const user = await auth.login('test@example.com', 'password123');

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(auth.token).toBeDefined();
  });

  test('should handle invalid credentials', async () => {
    const auth = new AuthManager();

    await expect(
      auth.login('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });

  test('should refresh expired token', async () => {
    const auth = new AuthManager();
    auth.token = 'expired_token';
    auth.refreshToken = 'valid_refresh_token';

    const newToken = await auth.refreshAccessToken();
    expect(newToken).toBeDefined();
    expect(newToken).not.toBe('expired_token');
  });
});
```

### Integration Tests

```python
import pytest
import requests

class TestAuthentication:
    def test_jwt_authentication(self):
        # Test JWT login
        response = requests.post('https://api.209jobs.com/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        })

        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'token' in data['data']

        # Test authenticated request
        token = data['data']['token']
        auth_response = requests.get(
            'https://api.209jobs.com/v1/jobs',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert auth_response.status_code == 200

    def test_api_key_authentication(self):
        response = requests.get(
            'https://api.209jobs.com/v1/jobs',
            headers={'X-API-Key': 'sk_test_1234567890abcdef...'}
        )

        assert response.status_code == 200

    def test_invalid_authentication(self):
        response = requests.get(
            'https://api.209jobs.com/v1/jobs',
            headers={'Authorization': 'Bearer invalid_token'}
        )

        assert response.status_code == 401
```

## Conclusion

The 209jobs API authentication system provides flexible, secure access control suitable for various application types. By following the security best practices outlined in this guide and implementing proper error handling, you can build robust integrations that protect user data and provide excellent user experiences.

For additional security considerations and advanced authentication scenarios, please refer to our [Security Documentation](./SECURITY.md) and contact our support team for assistance.
