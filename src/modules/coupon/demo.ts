import { CouponGeneratorService } from './coupon-generator.service';

/**
 * Demonstration script for the CouponGeneratorService
 * This shows the key functionality implemented in task 5.1
 */
async function demonstrateCouponGenerator() {
  const generator = new CouponGeneratorService();
  
  console.log('=== Coupon Generator Service Demo ===\n');
  
  // 1. Generate single codes
  console.log('1. Generating single coupon codes:');
  for (let i = 0; i < 5; i++) {
    const code = await generator.generateSingleCode({ codeLength: 10 });
    console.log(`   Code ${i + 1}: ${code} (Valid: ${generator.validateCodeFormat(code)})`);
  }
  
  // 2. Generate batch
  console.log('\n2. Generating batch of coupon codes:');
  const batchResult = await generator.generateBatch({ 
    quantity: 10, 
    codeLength: 8 
  });
  console.log(`   Batch ID: ${batchResult.batchId}`);
  console.log(`   Total Generated: ${batchResult.totalGenerated}`);
  console.log(`   Failed Attempts: ${batchResult.failedAttempts}`);
  console.log('   Codes:');
  batchResult.coupons.forEach((coupon, index) => {
    console.log(`     ${index + 1}. ${coupon.couponCode}`);
  });
  
  // 3. Show generation statistics
  console.log('\n3. Generation Statistics:');
  const stats = generator.getGenerationStats(10);
  console.log(`   Character Set Size: ${stats.characterSetSize}`);
  console.log(`   Safe Characters: ${stats.safeCharacters}`);
  console.log(`   Code Length: ${stats.codeLength}`);
  console.log(`   Total Possible Codes: ${stats.totalPossibleCodes.toLocaleString()}`);
  console.log(`   Recommended Max Batch: ${stats.recommendedMaxBatch.toLocaleString()}`);
  
  // 4. Demonstrate collision detection
  console.log('\n4. Collision Detection Demo:');
  const existingCodes = new Set(['TESTCODE12', 'SAMPLE3456']);
  console.log(`   Existing codes: ${Array.from(existingCodes).join(', ')}`);
  
  const newCode = await generator.generateSingleCode({}, existingCodes);
  console.log(`   New unique code: ${newCode}`);
  console.log(`   Collision avoided: ${!existingCodes.has(newCode)}`);
  
  // 5. Validate different code formats
  console.log('\n5. Code Format Validation:');
  const testCodes = [
    'ABCDEFGHJ2', // Valid
    'TESTCODE12', // Valid
    'SHORT',      // Too short
    'TOOLONGCODE123', // Too long
    'TESTC0DE12', // Contains 0 (ambiguous)
    'TESTCODE1L', // Contains 1 and L (ambiguous)
  ];
  
  testCodes.forEach(code => {
    const isValid = generator.validateCodeFormat(code);
    console.log(`   "${code}" -> ${isValid ? 'VALID' : 'INVALID'}`);
  });
  
  console.log('\n=== Demo Complete ===');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateCouponGenerator().catch(console.error);
}

export { demonstrateCouponGenerator };