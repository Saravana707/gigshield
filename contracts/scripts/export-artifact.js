/**
 * Run this after `npx hardhat compile` to copy the artifact to the frontend.
 * Usage: node scripts/export-artifact.js
 */
const fs = require('fs')
const path = require('path')

const src  = path.join(__dirname, '../artifacts/contracts/GigShieldEscrow.sol/GigShieldEscrow.json')
const dest = path.join(__dirname, '../../frontend/src/lib/GigShieldEscrow.json')

if (!fs.existsSync(src)) {
  console.error('❌  Artifact not found. Run `npx hardhat compile` first.')
  process.exit(1)
}

fs.copyFileSync(src, dest)
console.log('✅  Artifact exported to frontend/src/lib/GigShieldEscrow.json')
