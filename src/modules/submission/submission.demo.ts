/**
 * Submission Service Demo
 * 
 * This demo shows how to use the SubmissionService for processing user submissions
 * without reward selection, as per the updated requirements.
 */

import { SubmissionService, UserSubmissionData } from './submission.service';

// Example usage of the SubmissionService
export class SubmissionServiceDemo {
  constructor(private readonly submissionService: SubmissionService) {}

  /**
   * Demo: Process a valid user submission
   */
  async demoValidSubmission() {
    console.log('=== Demo: Valid User Submission ===');
    
    const submissionData: UserSubmissionData = {
      couponCode: 'ABC123DEF4',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      address: '123 Main Street, Anytown, ST 12345',
      productExperience: 'I have been using this product for 2 years and find it very reliable. The quality is excellent and customer service is responsive.',
      selectedRewardId: 1, // User selects Netflix subscription
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    try {
      const result = await this.submissionService.processUserSubmission(submissionData);
      console.log('✅ Submission successful:', {
        id: result.id,
        name: result.name,
        email: result.email,
        submittedAt: result.submittedAt,
        couponId: result.couponId,
      });
    } catch (error) {
      console.error('❌ Submission failed:', error.message);
    }
  }

  /**
   * Demo: Validate coupon before showing form
   */
  async demoCouponValidation() {
    console.log('\n=== Demo: Coupon Validation ===');
    
    const testCoupons = ['ABC123DEF4', 'INVALID123', 'EXPIRED456'];
    
    for (const couponCode of testCoupons) {
      const validation = await this.submissionService.validateCouponCode(couponCode);
      console.log(`Coupon ${couponCode}: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!validation.isValid) {
        console.log(`  Error: ${validation.error}`);
      }
    }
  }

  /**
   * Demo: Input sanitization
   */
  async demoInputSanitization() {
    console.log('\n=== Demo: Input Sanitization ===');
    
    const maliciousData: UserSubmissionData = {
      couponCode: 'ABC123DEF4',
      name: 'John<script>alert("xss")</script>Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St<img src=x onerror=alert(1)>',
      productExperience: 'Great product with javascript:void(0) and onclick=alert(1)',
      selectedRewardId: 2, // User selects Spotify subscription
    };

    try {
      const result = await this.submissionService.processUserSubmission(maliciousData);
      console.log('✅ Sanitized submission:', {
        name: result.name, // Should have XSS removed
        address: result.address, // Should have XSS removed
        productExperience: result.productExperience, // Should have XSS removed
      });
    } catch (error) {
      console.error('❌ Sanitization demo failed:', error.message);
    }
  }

  /**
   * Demo: Admin reward assignment
   */
  async demoRewardAssignment() {
    console.log('\n=== Demo: Admin Reward Assignment ===');
    
    const submissionId = 1;
    const rewardAccountId = 1;
    const adminId = 1;

    try {
      const result = await this.submissionService.assignRewardToSubmission(
        {
          submissionId,
          rewardAccountId,
          notes: 'Assigned Netflix Premium account for excellent feedback',
        },
        adminId
      );

      console.log('✅ Reward assigned successfully:', {
        submissionId: result.id,
        assignedRewardId: result.assignedRewardId,
        rewardAssignedAt: result.rewardAssignedAt,
        rewardAssignedBy: result.rewardAssignedBy,
      });
    } catch (error) {
      console.error('❌ Reward assignment failed:', error.message);
    }
  }

  /**
   * Demo: Get submission analytics
   */
  async demoAnalytics() {
    console.log('\n=== Demo: Submission Analytics ===');
    
    try {
      const stats = await this.submissionService.getSubmissionStatistics();
      console.log('📊 Submission Statistics:', {
        total: stats.total,
        withAssignedRewards: stats.withAssignedRewards,
        withoutAssignedRewards: stats.withoutAssignedRewards,
        rewardAssignmentRate: `${stats.rewardAssignmentRate}%`,
      });

      const analytics = await this.submissionService.getSubmissionAnalytics();
      console.log('📈 Detailed Analytics:', {
        totalSubmissions: analytics.totalSubmissions,
        rewardAssignmentRate: `${analytics.rewardAssignmentRate}%`,
        submissionsByDate: analytics.submissionsByDate.slice(0, 3), // Show first 3 days
      });
    } catch (error) {
      console.error('❌ Analytics demo failed:', error.message);
    }
  }

  /**
   * Demo: Search and filter submissions
   */
  async demoSearchAndFilter() {
    console.log('\n=== Demo: Search and Filter ===');
    
    try {
      // Search by email
      const emailResults = await this.submissionService.searchSubmissionsByEmail('john');
      console.log(`🔍 Found ${emailResults.length} submissions matching "john"`);

      // Get submissions without rewards (for admin review)
      const unassignedSubmissions = await this.submissionService.getSubmissionsWithoutRewards();
      console.log(`📋 ${unassignedSubmissions.length} submissions awaiting reward assignment`);

      // Get recent submissions
      const recentSubmissions = await this.submissionService.getRecentSubmissions(5);
      console.log(`⏰ ${recentSubmissions.length} most recent submissions`);
    } catch (error) {
      console.error('❌ Search demo failed:', error.message);
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos() {
    console.log('🚀 Starting Submission Service Demo\n');
    
    await this.demoCouponValidation();
    await this.demoValidSubmission();
    await this.demoInputSanitization();
    await this.demoRewardAssignment();
    await this.demoAnalytics();
    await this.demoSearchAndFilter();
    
    console.log('\n✨ Demo completed!');
  }
}

/**
 * Key Features Demonstrated:
 * 
 * 1. User Form Submission Processing (WITHOUT reward selection)
 *    - Users submit coupon code + personal info
 *    - System validates coupon and processes submission
 *    - No reward selection during submission process
 * 
 * 2. Coupon Validation and Redemption
 *    - Validates coupon exists, is active, and not expired
 *    - Prevents reuse of already redeemed coupons
 *    - Links coupon to user submission
 * 
 * 3. Data Validation and Sanitization
 *    - Email and phone format validation
 *    - XSS prevention through input sanitization
 *    - Required field validation
 * 
 * 4. Admin Reward Assignment
 *    - Admins can assign actual reward accounts to users
 *    - Tracks who assigned what reward and when
 *    - Validates reward availability before assignment
 * 
 * 5. Analytics and Reporting
 *    - Submission statistics and conversion rates
 *    - Reward assignment analytics
 *    - Date-based submission tracking
 * 
 * 6. Search and Management
 *    - Search submissions by email
 *    - Filter submissions without assigned rewards
 *    - Get recent submissions for admin review
 */