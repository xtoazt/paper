/**
 * Login Command
 * Generates PKARR keypair for authentication
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export async function loginCommand() {
  console.log('🔐 Logging in to Paper Network...\n');
  
  try {
    const configDir = path.join(homedir(), '.paper');
    const configFile = path.join(configDir, 'config.json');
    
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Generate keypair (mock for now)
    const keypair = {
      publicKey: generateRandomHex(64),
      privateKey: generateRandomHex(64),
      peerId: `12D3KooW${generateRandomHex(44)}`
    };
    
    // Save to config
    const config = {
      keypair,
      loggedInAt: new Date().toISOString()
    };
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log('✓ Successfully logged in!');
    console.log(`\n📝 Peer ID: ${keypair.peerId}`);
    console.log(`📂 Config saved to: ${configFile}`);
    console.log('\n💡 You can now deploy projects with: paper deploy');
    
  } catch (error: any) {
    console.error('\n❌ Login failed:', error.message);
    process.exit(1);
  }
}

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
