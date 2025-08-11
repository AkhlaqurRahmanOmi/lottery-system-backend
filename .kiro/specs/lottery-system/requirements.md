# Requirements Document

## Introduction

This document outlines the requirements for implementing a comprehensive Lottery Coupon Management System backend using NestJS, GraphQL, REST APIs, and PostgreSQL. The system will replace the existing product management system and provide functionality for administrators to generate unique coupon codes and collect user information through code redemption.

## Requirements

### Requirement 1: System Architecture Migration

**User Story:** As a developer, I want to migrate from the existing product management system to a lottery coupon management system, so that the codebase is clean and focused on lottery functionality.

#### Acceptance Criteria

1. WHEN migrating the system THEN the system SHALL remove all existing product and user modules
2. WHEN setting up the new architecture THEN the system SHALL maintain the existing NestJS structure with separate REST and GraphQL layers
3. WHEN updating the database THEN the system SHALL replace the existing Prisma schema with the lottery system schema
4. WHEN preserving shared services THEN the system SHALL keep common utilities like validation, logging, and response builders

### Requirement 2: Admin Authentication System

**User Story:** As a system administrator, I want to securely authenticate and manage my session, so that I can access the admin dashboard safely.

#### Acceptance Criteria

1. WHEN an admin attempts to login THEN the system SHALL validate username and password credentials
2. WHEN authentication is successful THEN the system SHALL create a secure JWT session token
3. WHEN a session expires THEN the system SHALL require re-authentication
4. WHEN an admin logs out THEN the system SHALL invalidate the session token
5. WHEN password reset is requested THEN the system SHALL provide a secure password reset mechanism

### Requirement 3: Coupon Code Generation System

**User Story:** As an administrator, I want to generate unique alphanumeric coupon codes in single or batch mode, so that I can distribute them for lottery campaigns.

#### Acceptance Criteria

1. WHEN generating coupon codes THEN the system SHALL create alphanumeric codes using only A-Z and 2-9 characters
2. WHEN setting code length THEN the system SHALL allow configurable length between 8-12 characters with default of 10
3. WHEN ensuring uniqueness THEN the system SHALL guarantee absolute uniqueness across all generated codes in the database
4. WHEN generating codes THEN the system SHALL exclude ambiguous characters (0, O, 1, I, L) to prevent user confusion
5. WHEN creating batch codes THEN the system SHALL support generating up to 1000 codes in a single batch
6. WHEN assigning batch tracking THEN the system SHALL assign a unique batch_id to all codes generated together
7. WHEN setting expiration THEN the system SHALL allow configurable expiration dates for codes
8. WHEN handling duplicates THEN the system SHALL retry generation up to 10 times if duplicate is detected
9. WHEN exporting codes THEN the system SHALL provide PDF and CSV export functionality with batch information

### Requirement 4: User Data Collection System

**User Story:** As an end user, I want to redeem my coupon code and submit my information to be eligible for rewards that admins will provide, so that I can participate in the lottery campaign.

#### Acceptance Criteria

1. WHEN validating a coupon THEN the system SHALL verify the code exists, is active, and not expired
2. WHEN displaying the form THEN the system SHALL only show the form after successful coupon validation
3. WHEN collecting user data THEN the system SHALL require name, email, phone, address, and product experience
4. WHEN validating email THEN the system SHALL ensure proper email format validation
5. WHEN validating phone THEN the system SHALL ensure proper phone number format validation
6. WHEN submitting the form THEN the system SHALL validate all required fields before processing
7. WHEN successful submission THEN the system SHALL mark the coupon as redeemed and link it to the user submission
8. WHEN preventing reuse THEN the system SHALL block any attempt to reuse an already redeemed coupon
9. WHEN completing submission THEN the system SHALL confirm successful registration without promising specific rewards
10. WHEN storing user data THEN the system SHALL maintain user information for admin review and reward distribution

### Requirement 5: Coupon Management System

**User Story:** As an administrator, I want to track and manage the lifecycle of all coupon codes, so that I can monitor campaign effectiveness and prevent fraud.

#### Acceptance Criteria

1. WHEN viewing coupons THEN the system SHALL display all coupons with their current status (active, redeemed, expired, deactivated)
2. WHEN tracking redemption THEN the system SHALL record the exact timestamp when a coupon is redeemed
3. WHEN linking data THEN the system SHALL associate redeemed coupons with the corresponding user submission
4. WHEN handling expired coupons THEN the system SHALL automatically mark coupons as expired based on expiration date
5. WHEN deactivating coupons THEN the system SHALL allow manual deactivation of active coupons
6. WHEN filtering coupons THEN the system SHALL provide search and filter capabilities by status, batch, date range
7. WHEN viewing batch details THEN the system SHALL show all coupons belonging to a specific batch

### Requirement 6: Data Management and Analytics

**User Story:** As an administrator, I want to view and analyze collected user data and redemption patterns, so that I can make informed decisions about lottery campaigns.

#### Acceptance Criteria

1. WHEN viewing submissions THEN the system SHALL display all user submissions with complete information including selected rewards
2. WHEN searching data THEN the system SHALL provide search and filter capabilities across user submissions
3. WHEN exporting data THEN the system SHALL generate Excel/CSV exports of user submissions with all fields
4. WHEN viewing analytics THEN the system SHALL display summary statistics including total coupons generated, redeemed, and conversion rates
5. WHEN tracking rewards THEN the system SHALL show reward selection statistics and popularity
6. WHEN monitoring activity THEN the system SHALL log all admin actions for audit purposes

### Requirement 7: Admin Reward Distribution System

**User Story:** As an administrator, I want to create and manage reward accounts (like Spotify, Netflix, YouTube Premium) and distribute them to eligible users, so that I can provide actual rewards to lottery participants.

#### Acceptance Criteria

1. WHEN creating reward accounts THEN the system SHALL allow admins to add reward account details (service name, account credentials, subscription duration)
2. WHEN managing reward inventory THEN the system SHALL track available and distributed reward accounts
3. WHEN reviewing submissions THEN the system SHALL allow admins to view all user submissions and select winners
4. WHEN distributing rewards THEN the system SHALL allow admins to assign specific reward accounts to specific users
5. WHEN tracking distribution THEN the system SHALL record which reward account was given to which user and when
6. WHEN managing reward types THEN the system SHALL support different reward categories (streaming services, gift cards, etc.)
7. WHEN handling reward status THEN the system SHALL track reward accounts as available, assigned, or expired

### Requirement 8: API Architecture

**User Story:** As a frontend developer, I want well-structured REST and GraphQL APIs, so that I can build both web and mobile interfaces efficiently.

#### Acceptance Criteria

1. WHEN accessing REST APIs THEN the system SHALL provide RESTful endpoints for all admin and user operations
2. WHEN using GraphQL THEN the system SHALL provide GraphQL queries, mutations, and subscriptions for real-time updates
3. WHEN handling authentication THEN the system SHALL implement JWT-based authentication for admin APIs
4. WHEN validating requests THEN the system SHALL provide comprehensive input validation and error handling
5. WHEN documenting APIs THEN the system SHALL generate Swagger/OpenAPI documentation for REST endpoints
6. WHEN ensuring consistency THEN the system SHALL maintain consistent response formats across all endpoints

### Requirement 9: Database Design and Performance

**User Story:** As a system administrator, I want a well-designed database that can handle concurrent users and large datasets efficiently, so that the system remains performant under load.

#### Acceptance Criteria

1. WHEN designing schema THEN the system SHALL implement the complete database schema as specified in the SRS document
2. WHEN ensuring performance THEN the system SHALL include appropriate indexes on frequently queried columns
3. WHEN maintaining integrity THEN the system SHALL enforce foreign key constraints and data validation at database level
4. WHEN handling concurrency THEN the system SHALL support at least 100 concurrent users without performance degradation
5. WHEN optimizing queries THEN the system SHALL ensure all database operations complete within 3 seconds
6. WHEN storing metadata THEN the system SHALL use JSON columns for flexible data storage where appropriate

### Requirement 10: Security and Validation

**User Story:** As a security-conscious administrator, I want the system to be secure against common vulnerabilities and validate all inputs, so that user data and system integrity are protected.

#### Acceptance Criteria

1. WHEN handling authentication THEN the system SHALL implement secure password hashing and JWT token management
2. WHEN validating inputs THEN the system SHALL prevent SQL injection through parameterized queries
3. WHEN processing user data THEN the system SHALL sanitize all inputs to prevent XSS attacks
4. WHEN transmitting data THEN the system SHALL enforce HTTPS encryption for all communications
5. WHEN logging activities THEN the system SHALL maintain audit logs of all admin actions
6. WHEN handling errors THEN the system SHALL provide informative error messages without exposing sensitive information