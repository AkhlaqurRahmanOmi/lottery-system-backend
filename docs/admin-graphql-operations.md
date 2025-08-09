# Admin GraphQL Operations

This document describes the GraphQL operations available for admin management in the lottery system.

## Authentication

All admin operations require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Queries

### Get Admin by ID

Retrieve a specific admin by ID (requires SUPER_ADMIN role):

```graphql
query GetAdmin($id: Int!) {
  admin(id: $id) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

### Get All Admins

Retrieve all admins with filtering and pagination (requires SUPER_ADMIN role):

```graphql
query GetAdmins($query: AdminQueryInput) {
  admins(query: $query) {
    data {
      id
      username
      email
      role
      isActive
      createdAt
      updatedAt
      lastLogin
    }
    total
    page
    limit
    totalPages
    hasNextPage
    hasPreviousPage
  }
}
```

Example variables:
```json
{
  "query": {
    "page": 1,
    "limit": 10,
    "search": "admin",
    "role": "ADMIN",
    "isActive": true,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### Search Admins

Search admins by username or email (requires SUPER_ADMIN role):

```graphql
query SearchAdmins($searchTerm: String!, $limit: Int) {
  searchAdmins(searchTerm: $searchTerm, limit: $limit) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

### Get Admin Statistics

Get admin statistics (requires SUPER_ADMIN role):

```graphql
query GetAdminStatistics {
  adminStatistics {
    total
    active
    inactive
    superAdmins
    regularAdmins
  }
}
```

### Get My Profile

Get current admin's profile (self-service):

```graphql
query GetMyProfile {
  myProfile {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

## Mutations

### Create Admin

Create a new admin account (requires SUPER_ADMIN role):

```graphql
mutation CreateAdmin($input: CreateAdminInput!) {
  createAdmin(input: $input) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

Example variables:
```json
{
  "input": {
    "username": "newadmin",
    "email": "newadmin@example.com",
    "password": "SecurePassword123!",
    "role": "ADMIN"
  }
}
```

### Update Admin

Update an admin account (requires SUPER_ADMIN role or self-update for basic fields):

```graphql
mutation UpdateAdmin($id: Int!, $input: UpdateAdminInput!) {
  updateAdmin(id: $id, input: $input) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

Example variables:
```json
{
  "id": 1,
  "input": {
    "username": "updatedadmin",
    "email": "updated@example.com",
    "role": "SUPER_ADMIN",
    "isActive": true
  }
}
```

### Update My Profile

Update current admin's profile (self-service):

```graphql
mutation UpdateMyProfile($input: AdminProfileUpdateInput!) {
  updateMyProfile(input: $input) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

Example variables:
```json
{
  "input": {
    "username": "myupdatedusername",
    "email": "myupdated@example.com",
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewPassword123!"
  }
}
```

### Change Password

Change current admin's password (self-service):

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input)
}
```

Example variables:
```json
{
  "input": {
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewPassword123!"
  }
}
```

### Reset Admin Password

Reset another admin's password (requires SUPER_ADMIN role):

```graphql
mutation ResetAdminPassword($input: PasswordResetInput!) {
  resetAdminPassword(input: $input)
}
```

Example variables:
```json
{
  "input": {
    "adminId": 1,
    "newPassword": "NewPassword123!"
  }
}
```

### Deactivate Admin

Deactivate an admin account (requires SUPER_ADMIN role):

```graphql
mutation DeactivateAdmin($id: Int!) {
  deactivateAdmin(id: $id) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

### Reactivate Admin

Reactivate an admin account (requires SUPER_ADMIN role):

```graphql
mutation ReactivateAdmin($id: Int!) {
  reactivateAdmin(id: $id) {
    id
    username
    email
    role
    isActive
    createdAt
    updatedAt
    lastLogin
  }
}
```

### Delete Admin

Permanently delete an admin account (requires SUPER_ADMIN role):

```graphql
mutation DeleteAdmin($id: Int!) {
  deleteAdmin(id: $id)
}
```

## Error Handling

The GraphQL operations return appropriate error responses:

- `UnauthorizedException`: When authentication is required or invalid
- `ForbiddenException`: When the user lacks required permissions
- `NotFoundException`: When the requested admin is not found
- `ConflictException`: When there are conflicts (e.g., duplicate username/email)
- `BadRequestException`: For validation errors or invalid requests

## Authorization Rules

1. **SUPER_ADMIN** role can:
   - View all admins
   - Create new admins
   - Update any admin (including role changes)
   - Reset passwords for other admins
   - Deactivate/reactivate other admins
   - Delete other admins (if they haven't created coupons)

2. **ADMIN** role can:
   - View their own profile
   - Update their own profile (basic fields only)
   - Change their own password

3. **Self-service restrictions**:
   - Admins cannot deactivate themselves
   - Admins cannot delete themselves
   - Admins cannot change their own role
   - Admins cannot reset their own password through the admin reset endpoint

## Input Validation

All inputs are validated according to the following rules:

- **Username**: Minimum 3 characters, alphanumeric and underscores only
- **Email**: Valid email format
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- **Role**: Must be either "ADMIN" or "SUPER_ADMIN"

## Audit Logging

All admin operations are logged for audit purposes, including:
- Admin creation, updates, and deletions
- Password changes and resets
- Profile updates
- Account activation/deactivation

The audit logs include timestamp, performing admin, target admin, and operation details.