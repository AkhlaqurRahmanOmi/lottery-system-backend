# Software Requirements Specification (SRS)
## Lottery Coupon Management System

---

## 1. INTRODUCTION

### 1.1 Purpose
This document specifies the requirements for a Lottery Coupon Management System that allows administrators to generate unique coupon codes and collect user information through code redemption.

### 1.2 Scope
The system provides:
- Admin panel for coupon generation and user data management
- User interface for coupon redemption and information submission
- Database management for coupons and user data

### 1.3 Document Conventions
- **Primary Actor**: Admin, End User
- **System**: Lottery Coupon Management System
- **Database**: MySQL/ Postgres

---

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective
A web-based application with two main interfaces:
- **Admin Dashboard**: Coupon management and analytics
- **User Portal**: Coupon redemption and form submission

### 2.2 Product Functions
- Generate unique coupon codes
- Validate and redeem coupons (one-time use)
- Collect user information
- Manage user data and redemption history

### 2.3 User Classes
- **System Administrator**: Full system access
- **End Users**: Coupon redemption only

---

## 3. SYSTEM FEATURES

### 3.1 Admin Authentication
**Priority**: High  
**Description**: Secure login system for administrators

**Functional Requirements**:
- FR-1.1: Admin must authenticate with username/password
- FR-1.2: Session management with timeout
- FR-1.3: Password reset functionality

### 3.2 Coupon Code Generation
**Priority**: High  
**Description**: Generate unique, one-time use alphanumeric coupon codes

**Functional Requirements**:
- FR-2.1: Generate single or batch coupon codes
- FR-2.2: Codes must be alphanumeric (A-Z, 0-9) format only
- FR-2.3: Default code length: 8-12 characters (configurable)
- FR-2.4: Ensure absolute code uniqueness across all generated codes
- FR-2.5: Exclude ambiguous characters (0, O, 1, I, l) to prevent confusion
- FR-2.6: Generate codes using secure random algorithm
- FR-2.7: Duplicate check before saving to database
- FR-2.8: Set expiration dates for codes
- FR-2.9: Print-friendly coupon display with clear font
- FR-2.10: Export codes to PDF/CSV with batch tracking

### 3.3 User Data Collection
**Priority**: High  
**Description**: Collect user information upon valid coupon redemption for admin review and reward distribution

**Functional Requirements**:
- FR-3.1: Validate coupon code before showing form
- FR-3.2: Collect required user information:
  - Name (required)
  - Email (required, validated format)
  - Phone (required, format validation)
  - Address (required)
  - Product Use Experience (required)
- FR-3.3: Form validation and error handling
- FR-3.4: Success confirmation after submission without promising specific rewards
- FR-3.5: Store user data for admin review and reward distribution

### 3.4 Coupon Management
**Priority**: High  
**Description**: Track and manage coupon lifecycle

**Functional Requirements**:
- FR-4.1: Mark coupons as used after redemption
- FR-4.2: Track redemption timestamp
- FR-4.3: Prevent reuse of redeemed coupons
- FR-4.4: Handle expired coupons

### 3.5 Data Management
**Priority**: High  
**Description**: View and manage collected user data

**Functional Requirements**:
- FR-5.1: View all user submissions
- FR-5.2: Search and filter user data
- FR-5.3: Export user data to Excel/CSV
- FR-5.4: View redemption analytics

### 3.6 Admin Reward Distribution System
**Priority**: High  
**Description**: Admin management of reward accounts and distribution to users

**Functional Requirements**:
- FR-6.1: Create and manage reward accounts (Spotify, Netflix, YouTube Premium, etc.)
- FR-6.2: Store encrypted reward account credentials securely
- FR-6.3: Review user submissions and select winners
- FR-6.4: Assign specific reward accounts to specific users
- FR-6.5: Track reward distribution history and status
- FR-6.6: Support different reward categories (streaming services, gift cards, etc.)
- FR-6.7: Manage reward account inventory (available, assigned, expired)

### 3.7 System Configuration (Future Enhancement)
**Priority**: Low  
**Description**: Configurable system settings

**Functional Requirements**:
- FR-7.1: Customize form fields
- FR-7.2: Configure coupon code format
- FR-7.3: Set system messages

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance Requirements
- NFR-1.1: System must support 100 concurrent users
- NFR-1.2: Response time < 3 seconds for all operations
- NFR-1.3: Database queries optimized for large datasets

### 4.2 Security Requirements
- NFR-2.1: Admin authentication with secure password policies
- NFR-2.2: SQL injection prevention
- NFR-2.3: XSS protection
- NFR-2.4: HTTPS encryption for data transmission

### 4.3 Reliability Requirements
- NFR-3.1: 99.5% system uptime
- NFR-3.2: Automated database backups
- NFR-3.3: Error logging and monitoring

### 4.4 Usability Requirements
- NFR-4.1: Responsive design for mobile/tablet
- NFR-4.2: Intuitive user interface
- NFR-4.3: Accessibility compliance (WCAG 2.1)

---

## 5. DATABASE DESIGN

### 5.1 Database Schema

```sql
-- Admin Management
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Coupon Code Management
CREATE TABLE coupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(20) UNIQUE NOT NULL, -- Alphanumeric codes up to 20 chars
    batch_id VARCHAR(50) NULL,
    code_length INT DEFAULT 10, -- Track individual code length
    created_by INT NOT NULL,
    status ENUM('active', 'redeemed', 'expired', 'deactivated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    redeemed_at TIMESTAMP NULL,
    redeemed_by INT NULL,
    generation_method ENUM('single', 'batch') DEFAULT 'single',
    metadata JSON NULL, -- For future extensibility
    FOREIGN KEY (created_by) REFERENCES admins(id),
    FOREIGN KEY (redeemed_by) REFERENCES user_submissions(id),
    UNIQUE KEY unique_coupon_code (coupon_code), -- Explicit uniqueness constraint
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_status (status),
    INDEX idx_batch_id (batch_id),
    INDEX idx_created_by (created_by),
    INDEX idx_expires_at (expires_at)
);

-- User Submissions
CREATE TABLE user_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    product_experience TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    additional_data JSON NULL, -- For future form fields
    assigned_reward_id INT NULL, -- Admin-assigned reward account
    reward_assigned_at TIMESTAMP NULL,
    reward_assigned_by INT NULL, -- Admin who assigned the reward
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (assigned_reward_id) REFERENCES reward_accounts(id),
    FOREIGN KEY (reward_assigned_by) REFERENCES admins(id),
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_email (email),
    INDEX idx_assigned_reward_id (assigned_reward_id),
    INDEX idx_submitted_at (submitted_at)
);

-- System Configuration (Future Enhancement)
CREATE TABLE system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- Default system configurations for coupon generation
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('coupon_code_length', '10', 'number', 'Default length for generated coupon codes'),
('coupon_code_chars', 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', 'string', 'Allowed characters (excludes 0,O,1,I,L)'),
('coupon_expiry_days', '30', 'number', 'Default expiry days for coupons'),
('max_batch_size', '1000', 'number', 'Maximum codes that can be generated in one batch');

-- Form Fields Configuration (Future Enhancement)
CREATE TABLE form_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    field_name VARCHAR(50) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type ENUM('text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio') NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    field_order INT NOT NULL,
    validation_rules JSON NULL,
    options JSON NULL, -- For select, checkbox, radio fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_field_order (field_order),
    INDEX idx_is_active (is_active)
);

-- Activity Logs (Future Enhancement)
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    user_type ENUM('admin', 'user') NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Reward Account Management
CREATE TABLE reward_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(100) NOT NULL, -- e.g., 'Spotify', 'Netflix', 'YouTube Premium'
    account_type VARCHAR(50) NOT NULL, -- e.g., 'Premium', 'Basic', 'Family'
    encrypted_credentials TEXT NOT NULL, -- Encrypted account credentials
    subscription_duration VARCHAR(50) NULL, -- e.g., '1 Month', '3 Months'
    description TEXT NULL,
    category ENUM('streaming_service', 'gift_card', 'subscription', 'digital_product', 'other') DEFAULT 'streaming_service',
    status ENUM('available', 'assigned', 'expired', 'deactivated') DEFAULT 'available',
    assigned_to_user_id INT NULL,
    assigned_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES user_submissions(id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_assigned_to_user_id (assigned_to_user_id),
    INDEX idx_created_by (created_by)
);

-- Remove the complex submission_rewards table as it's no longer needed for MVP
-- Link rewards to submissions (Future Enhancement - for multiple rewards per user)
-- CREATE TABLE submission_rewards (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     submission_id INT NOT NULL,
--     reward_id INT NOT NULL,
--     awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (submission_id) REFERENCES user_submissions(id),
--     FOREIGN KEY (reward_id) REFERENCES rewards(id),
--     INDEX idx_submission_id (submission_id),
--     INDEX idx_reward_id (reward_id)
-- );
```

### 5.2 Database Features for Extensibility

1. **JSON Columns**: Used for storing flexible metadata and configurations
2. **Enum Fields**: Easily extendable for new statuses and types
3. **Foreign Key Constraints**: Maintain data integrity
4. **Indexes**: Optimized for common queries
5. **Timestamp Tracking**: Audit trail for all operations
6. **Soft Delete Support**: Using status flags instead of deleting records

---

## 6. SYSTEM ARCHITECTURE

### 6.1 Technology Stack
- **Backend**: PHP 8.0+ / Node.js / Python Django
- **Database**: MySQL 8.0+
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla/React/Vue)
- **Web Server**: Apache/Nginx
- **Security**: HTTPS, Input Validation, SQL Prepared Statements

```

---

## 7. USER INTERFACE REQUIREMENTS

### 7.1 Admin Dashboard
- Clean, professional design
- Navigation: Dashboard, Generate Coupons, View Data, Settings
- Data tables with sorting, filtering, pagination
- Export functionality
- Mobile responsive

### 7.2 User Interface
- Simple, user-friendly design
- Single page for coupon entry
- Progressive form reveal after validation
- Success/error messaging
- Mobile-first design

---

## 8. ACCEPTANCE CRITERIA

### 8.1 Admin Functions
- [ ] Admin can login securely
- [ ] Admin can generate single/batch alphanumeric coupon codes
- [ ] Generated codes are guaranteed unique across entire system
- [ ] Admin can specify code length (8-12 characters)
- [ ] Admin can view generated coupons with status and batch information
- [ ] Admin can view all user submissions
- [ ] Admin can export coupon codes and user data to CSV/Excel
- [ ] Admin can print coupon codes with clear, readable format
- [ ] System prevents generation of ambiguous character codes (0,O,1,I,L)

### 8.2 User Functions
- [ ] User can enter coupon code on front page
- [ ] System validates coupon before showing form
- [ ] User can submit required information (without reward selection)
- [ ] System prevents reuse of redeemed coupons
- [ ] User receives confirmation after submission
- [ ] User data is stored for admin review and reward distribution

### 8.3 System Functions
- [ ] Database maintains data integrity
- [ ] System handles concurrent users
- [ ] All operations are logged
- [ ] System is responsive on mobile devices

---

## 9. FUTURE ENHANCEMENTS

1. **Multi-language Support**
2. **Email Notifications**
3. **SMS Integration**
4. **Advanced Analytics Dashboard**
5. **API Development**
6. **Mobile Application**
7. **Social Media Integration**
8. **Bulk Import/Export**
9. **Automated Reporting**
10. **Role-based Admin Access**

---

## 10. API SPECIFICATIONS

### 10.1 MVP REST API Endpoints

#### 10.1.1 Authentication APIs
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
GET  /api/auth/verify-session
```

#### 10.1.2 Admin - Coupon Management APIs
```
POST /api/admin/coupons/generate          // Generate single/batch coupons
GET  /api/admin/coupons                   // List all coupons with filters
GET  /api/admin/coupons/{id}             // Get specific coupon details
PUT  /api/admin/coupons/{id}/deactivate  // Deactivate coupon
GET  /api/admin/coupons/export           // Export coupons to CSV/PDF
GET  /api/admin/coupons/batches          // List all batches
GET  /api/admin/coupons/batch/{batchId}  // Get batch details
```

#### 10.1.3 Admin - User Data Management APIs
```
GET  /api/admin/submissions              // List all user submissions
GET  /api/admin/submissions/{id}         // Get specific submission
GET  /api/admin/submissions/export      // Export submissions to CSV
GET  /api/admin/analytics/summary       // Basic analytics (total coupons, redemptions)
```

#### 10.1.4 Public - User Redemption APIs
```
POST /api/coupons/validate               // Validate coupon code
POST /api/coupons/redeem                // Submit user form and redeem coupon
GET  /api/coupons/status/{code}         // Check coupon status (optional)
```

#### 10.1.5 Admin - Reward Distribution APIs
```
GET  /api/admin/reward-accounts          // List all reward accounts
POST /api/admin/reward-accounts          // Create new reward account
PUT  /api/admin/reward-accounts/{id}     // Update reward account
DELETE /api/admin/reward-accounts/{id}   // Delete reward account
POST /api/admin/submissions/{id}/assign-reward  // Assign reward to user
GET  /api/admin/reward-distribution      // View reward distribution history
```


---

## 11. FUTURE ENHANCEMENT APIs

### 11.1 Future REST API Endpoints

#### 11.1.1 Advanced Admin Management
```
GET  /api/admin/users                    // Admin user management
POST /api/admin/users                    // Create new admin
PUT  /api/admin/users/{id}               // Update admin
DELETE /api/admin/users/{id}             // Delete admin

GET  /api/admin/roles                    // Role management
POST /api/admin/roles                    // Create role
PUT  /api/admin/roles/{id}               // Update role permissions
```

#### 11.1.2 Rewards Management
```
GET  /api/admin/rewards                  // List all rewards
POST /api/admin/rewards                  // Create new reward
PUT  /api/admin/rewards/{id}             // Update reward
DELETE /api/admin/rewards/{id}           // Delete reward

POST /api/admin/submissions/{id}/assign-reward  // Assign reward to submission
GET  /api/admin/submissions/{id}/rewards        // Get submission rewards
```

#### 11.1.3 Advanced Analytics
```
GET  /api/admin/analytics/dashboard      // Comprehensive dashboard data
GET  /api/admin/analytics/conversion     // Conversion rates
GET  /api/admin/analytics/geographic     // Geographic distribution
GET  /api/admin/analytics/trends         // Time-based trends
GET  /api/admin/analytics/export         // Export analytics data
```

#### 11.1.4 Notification System
```
POST /api/admin/notifications/email      // Send email notifications
POST /api/admin/notifications/sms        // Send SMS notifications
GET  /api/admin/notifications/templates  // Email/SMS templates
POST /api/admin/notifications/templates  // Create templates
```

#### 11.1.5 System Configuration
```
GET  /api/admin/config                   // Get system configurations
PUT  /api/admin/config                   // Update system configurations
GET  /api/admin/config/form-fields       // Get custom form fields
POST /api/admin/config/form-fields       // Create custom form fields
PUT  /api/admin/config/form-fields/{id}  // Update form field
DELETE /api/admin/config/form-fields/{id} // Delete form field
```

#### 11.1.6 Advanced User Features
```
POST /api/users/register                 // User account creation
GET  /api/users/profile                  // Get user profile
PUT  /api/users/profile                  // Update user profile
GET  /api/users/redemption-history       // User's redemption history
POST /api/users/newsletter-subscribe     // Newsletter subscription
```

#### 11.1.7 Integration APIs
```
POST /api/webhooks/coupon-redeemed       // Webhook for external systems
GET  /api/integrations/social-media      // Social media integration
POST /api/integrations/crm               // CRM system integration
GET  /api/integrations/email-marketing   // Email marketing integration
```



---

## 13. RISK ANALYSIS

### 10.1 Technical Risks
- Database performance with large datasets
- Concurrent access handling
- Security vulnerabilities

### 10.2 Mitigation Strategies
- Database optimization and indexing
- Implement connection pooling
- Regular security audits
- Input validation and sanitization

## 11. COUPON CODE SPECIFICATIONS

### 11.1 Code Generation Rules
- **Format**: Alphanumeric only (A-Z, 0-9)
- **Length**: 8-12 characters (configurable, default: 10)
- **Character Set**: Excludes ambiguous characters (0, O, 1, I, L) to prevent user confusion
- **Allowed Characters**: A,B,C,D,E,F,G,H,J,K,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9
- **Pattern**: Random generation with no predictable sequence

### 11.2 Uniqueness Guarantee
- **Database Constraint**: Unique index on coupon_code column
- **Generation Process**: 
  1. Generate random code using allowed character set
  2. Check database for existing code
  3. If duplicate found, regenerate until unique
  4. Maximum retry attempts: 10 per code
- **Collision Handling**: If unable to generate unique code after retries, alert admin

### 11.3 Code Examples
```
Valid Codes: A7B9K3M2P4, XY8R6N4M9A, 5B7D9K2P6X
Invalid Codes: AB01CD (contains 0,1), HELLO123 (contains L), abc123 (lowercase)
```

---

**Document Version**: 1.2  
**Last Updated**: August 2025  
**Status**: Updated - Added Comprehensive API Specifications (MVP + Future)