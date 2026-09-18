#!/usr/bin/env node
/**
 * Extract PFX certificate and private key to PEM files
 * 
 * Usage:
 *   node extract-pfx.js
 */

const forge = require('node-forge');

const pfxPath = process.argv[2] || 'C:\\Users\\vir.sridharan.padman\\Downloads\\HUBMAILpnpadmin.pfx';
const password = process.argv[3] || 'HubIntl@2026!';

const fs = require('fs');

if (!fs.existsSync(pfxPath)) {
  console.error(`✗ Error: PFX file not found: ${pfxPath}`);
  process.exit(1);
}

console.log(`Extracting certificate from ${pfxPath}...`);

try {
  const pfxData = fs.readFileSync(pfxPath);
  
  // Parse PKCS#12
  const p12 = forge.pkcs12.decrypt(pfxData, password);

  if (!p12.bags || !p12.bags.certificateBag || p12.bags.certificateBag.length === 0) {
    throw new Error('No certificate found in PFX');
  }

  if (!p12.bags.pkcs8ShroudedKeyBag || p12.bags.pkcs8ShroudedKeyBag.length === 0) {
    throw new Error('No private key found in PFX');
  }

  // Extract certificate
  const cert = p12.bags.certificateBag[0];
  const certPem = forge.pki.certificateToPem(cert);

  // Extract private key
  const key = p12.bags.pkcs8ShroudedKeyBag[0];
  const keyPem = forge.pki.privateKeyToPem(key);

  // Write files
  const basePath = pfxPath.replace(/\.pfx$/i, '');
  const certFile = `${basePath}-cert.pem`;
  const keyFile = `${basePath}-key.pem`;

  fs.writeFileSync(certFile, certPem);
  fs.writeFileSync(keyFile, keyPem);

  console.log(`✓ Certificate saved: ${certFile}`);
  console.log(`✓ Private key saved: ${keyFile}`);
  console.log('');
  console.log('PEM files ready! The mailer will use these automatically.');
} catch (err) {
  console.error('✗ Error:', err.message);
  process.exit(1);
}
