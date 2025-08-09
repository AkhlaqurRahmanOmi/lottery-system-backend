# GraphQL Authentication Operations

This document describes the GraphQL authentication operations available in the lottery system.

## Mutations

### Login
Authenticate an admin user and receive JWT tokens with profile information.

```graphql
mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    accessToken
    refreshToken
    expiresIn
    admin {
      id
      username
      email
      role
      lastLogin
    }
  }
}
```

**Variables:**
```json
{
  "loginInput": {
    "username": "admin",
    "password": "password123"
  }
}
```

### Refresh Token
Generate a new access token using a valid refresh token.

```graphql
mutation RefreshToken($refreshTokenInput: RefreshTokenInput!) {
  refreshToken(refreshTokenInput: $refreshTokenInput) {
    accessToken
    expiresIn
  }
}
```

**Variables:**
```json
{
  "refreshTokenInput": {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout
Logout the authenticated admin user and invalidate the session.

```graphql
mutation Logout {
  logout {
    message
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Queries

### Me (Current Admin Profile)
Get the current authenticated admin's profile information.

```graphql
query Me {
  me {
    id
    username
    email
    role
    lastLogin
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Types

### LoginInput
```graphql
input LoginInput {
  username: String!
  password: String!
}
```

### RefreshTokenInput
```graphql
input RefreshTokenInput {
  refreshToken: String!
}
```

### AuthResponse
```graphql
type AuthResponse {
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
  admin: AdminProfile!
}
```

### TokenResponse
```graphql
type TokenResponse {
  accessToken: String!
  expiresIn: Int!
}
```

### LogoutResponse
```graphql
type LogoutResponse {
  message: String!
}
```

### AdminProfile
```graphql
type AdminProfile {
  id: Int!
  username: String!
  email: String!
  role: AdminRole!
  lastLogin: DateTime
}
```

### AdminRole
```graphql
enum AdminRole {
  SUPER_ADMIN
  ADMIN
}
```

## Error Handling

All GraphQL operations include comprehensive error handling:

- **BadRequestException**: Invalid input data or missing required fields
- **UnauthorizedException**: Invalid credentials, expired tokens, or insufficient permissions
- **Proper logging**: All authentication attempts and errors are logged for security monitoring

## Security Features

1. **JWT Authentication**: Secure token-based authentication with access and refresh tokens
2. **Input Validation**: Comprehensive validation of all input parameters
3. **Error Logging**: Security-focused logging for audit trails
4. **Session Management**: Proper session invalidation on logout
5. **Role-based Access**: Support for different admin roles (ADMIN, SUPER_ADMIN)

## Usage Examples

### Complete Authentication Flow

1. **Login:**
```graphql
mutation {
  login(loginInput: { username: "admin", password: "password123" }) {
    accessToken
    refreshToken
    expiresIn
    admin {
      id
      username
      email
      role
    }
  }
}
```

2. **Access Protected Resources:**
```graphql
query {
  me {
    id
    username
    email
    role
    lastLogin
  }
}
```

3. **Refresh Token When Needed:**
```graphql
mutation {
  refreshToken(refreshTokenInput: { refreshToken: "your-refresh-token" }) {
    accessToken
    expiresIn
  }
}
```

4. **Logout:**
```graphql
mutation {
  logout {
    message
  }
}
```