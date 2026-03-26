#!/usr/bin/env node

/**
 * REPAIR CODE GENERATOR
 * =====================
 * Generates new emergency repair codes for admin access
 * and updates ONLY the repair code array in server.js
 * 
 * Usage:
 *   node generate-repair-codes.js          (generate 4 random codes)
 *   node generate-repair-codes.js 6        (generate 6 codes)
 *   node generate-repair-codes.js 8 key    (generate 8 codes with custom prefix)
 * 
 * Output: Prints codes to console and updates server.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SERVER_FILE = path.join(__dirname, 'server.js');
const DEFAULT_CODE_COUNT = 4;
const CODE_LENGTH = 64; // Length of each repair code in hex characters
const REPAIR_VAR_NAME = 'x8f9q2p1r4k3'; // Ciphered variable name

/**
 * Generate a cryptographically secure random repair code
 * @param {number} length - Length of the code in characters
 * @returns {string} - Random hex code
 */
function generateRepairCode(length = CODE_LENGTH) {
  return crypto.randomBytes(length / 2).toString('hex');
}

/**
 * Generate multiple repair codes
 * @param {number} count - Number of codes to generate
 * @returns {string[]} - Array of repair codes
 */
function generateRepairCodes(count = DEFAULT_CODE_COUNT) {
  console.log(`\n🔐 Generating ${count} repair codes...\n`);
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = generateRepairCode(CODE_LENGTH);
    codes.push(code);
    console.log(`  [${i + 1}] ${code}`);
  }
  
  return codes;
}

/**
 * Update the repair codes array in server.js
 * Only replaces the specific variable, nothing else
 * @param {string[]} codes - New repair codes
 */
function updateRepairCodesInServer(codes) {
  try {
    // Read current server.js
    let fileContent = fs.readFileSync(SERVER_FILE, 'utf8');
    
    // Create the new array definition
    const newArrayDef = `const ${REPAIR_VAR_NAME} = [\n${codes.map(code => `  "${code}"`).join(',\n')}\n];`;
    
    // Find and replace the old array definition
    // Simple pattern match that handles various formatting
    const lines = fileContent.split('\n');
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`const ${REPAIR_VAR_NAME} = [`)) {
        startIdx = i;
      }
      if (startIdx !== -1 && lines[i].includes('];')) {
        endIdx = i;
        break;
      }
    }
    
    if (startIdx === -1 || endIdx === -1) {
      console.error(`❌ Error: Could not find repair code array in server.js`);
      console.error(`   Looking for: const ${REPAIR_VAR_NAME} = [ ... ];`);
      process.exit(1);
    }
    
    // Replace the section
    const beforeArray = lines.slice(0, startIdx).join('\n');
    const afterArray = lines.slice(endIdx + 1).join('\n');
    fileContent = beforeArray + '\n' + newArrayDef + '\n' + afterArray;
    
    // Write back to server.js
    fs.writeFileSync(SERVER_FILE, fileContent, 'utf8');
    
    console.log(`\n✅ Repair codes updated in server.js`);
    console.log(`   Variable: ${REPAIR_VAR_NAME}`);
    console.log(`   Total codes: ${codes.length}`);
    
  } catch (err) {
    console.error(`❌ Error updating server.js: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Backup current repair codes from server.js
 * @returns {string[]} - Current repair codes
 */
function backupCurrentCodes() {
  try {
    const fileContent = fs.readFileSync(SERVER_FILE, 'utf8');
    const lines = fileContent.split('\n');
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`const ${REPAIR_VAR_NAME} = [`)) {
        startIdx = i;
      }
      if (startIdx !== -1 && lines[i].includes('];')) {
        endIdx = i;
        break;
      }
    }
    
    if (startIdx === -1) return [];
    
    // Extract codes from the array
    const arrayLines = lines.slice(startIdx, endIdx + 1).join('\n');
    const codeMatches = arrayLines.match(/"([^"]+)"/g);
    
    if (!codeMatches) return [];
    
    return codeMatches.map(code => code.replace(/"/g, ''));
  } catch (err) {
    return [];
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  let codeCount = DEFAULT_CODE_COUNT;
  
  // Parse command line arguments
  if (args.length > 0 && /^\d+$/.test(args[0])) {
    codeCount = parseInt(args[0], 10);
  }
  
  if (codeCount < 1 || codeCount > 20) {
    console.error('❌ Code count must be between 1 and 20');
    process.exit(1);
  }
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         4MESSENGER REPAIR CODE GENERATOR              ║');
  console.log('║                                                        ║');
  console.log('║  Emergency admin access codes (KEEP SECRET!)          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Backup current codes
  const oldCodes = backupCurrentCodes();
  if (oldCodes.length > 0) {
    console.log(`\n⚠️  Found ${oldCodes.length} existing repair codes (will be replaced)`);
  }
  
  // Generate new codes
  const newCodes = generateRepairCodes(codeCount);
  
  // Update server.js
  updateRepairCodesInServer(newCodes);
  
  // Security notes
  console.log(`\n🔒 SECURITY NOTES:`);
  console.log(`   1. These codes are now embedded in server.js`);
  console.log(`   2. They grant full admin access to the default admin account`);
  console.log(`   3. KEEP THESE CODES SECURE!`);
  console.log(`   4. Anyone with access to source code can see these codes`);
  console.log(`   5. Consider using source code obfuscation for production`);
  console.log(`\n💾 To use a repair code:`);
  console.log(`   Submit login form with:`);
  console.log(`   - Username: owner (or default admin username)`);
  console.log(`   - Password: <any value> (ignored if repair code used)`);
  console.log(`   - Repair Code: <one of the codes above>`);
  console.log(`\n📋 Codes will be valid until server restart or updated\n`);
  
  // Show restore option if codes were replaced
  if (oldCodes.length > 0) {
    console.log(`⚙️  Old codes (now invalid):`);
    oldCodes.forEach((code, i) => {
      console.log(`   [${i + 1}] ${code}`);
    });
  }
}

main();
