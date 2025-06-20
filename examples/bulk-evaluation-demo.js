const FlagVaultSDK = require('../dist/index.js').default;

async function demonstrateBulkEvaluation() {
  // Initialize SDK
  const sdk = new FlagVaultSDK({
    apiKey: 'test_your-api-key', // Replace with your actual API key
    baseUrl: 'http://localhost:3001', // For local testing
  });

  console.log('=== FlagVault Bulk Evaluation Demo ===\n');

  try {
    // Method 1: Preload all flags
    console.log('1. Preloading all flags...');
    await sdk.preloadFlags();
    console.log('✓ Flags preloaded into cache\n');

    // Method 2: Get all flags and evaluate locally
    console.log('2. Fetching all flags...');
    const allFlags = await sdk.getAllFlags();
    console.log(`✓ Fetched ${allFlags.size} flags\n`);

    // Display flag metadata
    console.log('Flag Metadata:');
    for (const [key, flag] of allFlags) {
      console.log(`- ${key}:`);
      console.log(`  Enabled: ${flag.isEnabled}`);
      console.log(`  Rollout: ${flag.rolloutPercentage ?? 'None'}%`);
      console.log(`  Seed: ${flag.rolloutSeed ?? 'None'}`);
    }
    console.log();

    // Method 3: Evaluate flags for different users
    console.log('3. Evaluating flags for different users:');
    const users = ['user-123', 'user-456', 'user-789', 'user-abc', 'user-def'];
    
    // Pick a flag with rollout (if any)
    const rolloutFlag = Array.from(allFlags.values()).find(f => f.rolloutPercentage != null);
    
    if (rolloutFlag) {
      console.log(`\nRollout evaluation for "${rolloutFlag.key}" (${rolloutFlag.rolloutPercentage}%):`);
      
      for (const userId of users) {
        const enabled = sdk.evaluateFlag(rolloutFlag, userId);
        console.log(`- ${userId}: ${enabled ? '✓ Enabled' : '✗ Disabled'}`);
      }
      
      // Demonstrate consistency
      console.log('\nConsistency check - evaluating same user multiple times:');
      const testUser = 'user-999';
      for (let i = 0; i < 3; i++) {
        const enabled = sdk.evaluateFlag(rolloutFlag, testUser);
        console.log(`- Attempt ${i + 1}: ${enabled ? '✓ Enabled' : '✗ Disabled'}`);
      }
    } else {
      console.log('No flags with rollout percentage found.');
    }

    // Method 4: Using cached data with isEnabled
    console.log('\n4. Using isEnabled with bulk cache:');
    const startTime = Date.now();
    
    // These calls will use the bulk cache instead of making API calls
    for (const [key] of allFlags) {
      await sdk.isEnabled(key, false, 'user-123');
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`✓ Evaluated ${allFlags.size} flags in ${elapsed}ms (using cache)`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Clean up
    sdk.destroy();
  }
}

// Run the demo
demonstrateBulkEvaluation().catch(console.error);