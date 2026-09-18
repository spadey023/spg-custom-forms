# Extract PFX certificate and private key to PEM files
# Usage: .\extract-pfx.ps1

$pfxPath = "C:\Users\vir.sridharan.padman\Downloads\HUBMAILpnpadmin.pfx"
$pfxPassword = "HubIntl@2026!"
$outputBasePath = $pfxPath -replace '\.pfx$', ''

Write-Host "Loading PFX certificate..."
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $pfxPassword)

# Export certificate
$certPem = @"
-----BEGIN CERTIFICATE-----
$([System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks))
-----END CERTIFICATE-----
"@
$certPem | Out-File "$outputBasePath-cert.pem" -Encoding UTF8
Write-Host "✓ Certificate saved to $outputBasePath-cert.pem"

# Export private key (requires handling RSA private key)
if ($cert.HasPrivateKey) {
    # For Windows, we need to use Windows cert store approach or a library
    # This is a workaround using PowerShell's built-in capability
    Write-Host "⚠ Note: Private key export from Windows certificate store is limited."
    Write-Host "  Recommended: Use online tool or command-line with openssl/node-forge"
    Write-Host ""
    Write-Host "For Node.js, run:"
    Write-Host "  cd `"$outputBasePath`""
    Write-Host "  npx -y node-forge@latest --extract-pfx `"$pfxPath`" `"$pfxPassword`""
} else {
    Write-Host "✗ No private key found in certificate"
    exit 1
}
