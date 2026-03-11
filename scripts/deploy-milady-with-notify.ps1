# Deploy Milady to IC and notify when done.
# Run from ic-launchpad root: .\scripts\deploy-milady-with-notify.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location $rootDir

Write-Host "=== Deploying Milady to IC (this may take several minutes) ===" -ForegroundColor Cyan

try {
    wsl -e bash -lc "export DFX_WARNING=-mainnet_plaintext_identity && cd /mnt/r/REPOSITORIES/ic-launchpad && bash scripts/deploy-milady-to-ic.sh"
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
}

if ($exitCode -eq 0) {
    $miladyUrl = "https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io"
    $launchpadUrl = "https://ty7d6-iyaaa-aaaau-afpga-cai.ic0.app"
    
    # Sound
    [Console]::Beep(880, 300)
    [Console]::Beep(1100, 300)
    [Console]::Beep(1320, 400)
    
    # Toast-style popup (no extra modules)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "Milady: $miladyUrl`n`nLaunchpad: $launchpadUrl",
        "Milady deployed successfully"
    )
    
    Start-Process $miladyUrl
} else {
    [Console]::Beep(200, 1000)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "Deploy failed. Check the terminal output.",
        "Milady deploy failed",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
    exit 1
}
