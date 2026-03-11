# Run as Administrator. Starts replica in WSL, sets up port proxy, opens browser.
$ErrorActionPreference = "Stop"
Write-Host "Starting replica in WSL..."
$script = "bash /mnt/r/REPOSITORIES/ic-launchpad/scripts/restart-replica.sh"
Start-Process -FilePath "wsl" -ArgumentList "-d","Ubuntu","bash","-c",$script -Wait -NoNewWindow
Start-Sleep -Seconds 6
Write-Host "Getting WSL IP..."
$wslIp = (wsl -d Ubuntu hostname -I 2>$null).Trim().Split()[0]
if (-not $wslIp) { Write-Error "Could not get WSL IP. Is WSL running?"; exit 1 }
Write-Host "WSL IP: $wslIp"
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=4943 2>$null
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=$wslIp connectport=4943
Write-Host "Port proxy set. Waiting for replica..."
Start-Sleep -Seconds 4
$maxRetries = 5
for ($i = 0; $i -lt $maxRetries; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:4943/?canisterId=uxrrr-q7777-77774-qaaaq-cai" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { Write-Host "Replica ready."; break }
  } catch { Start-Sleep -Seconds 2 }
}
Write-Host "Opening browser..."
Start-Process "http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/#/wallet"
Write-Host "Done."
