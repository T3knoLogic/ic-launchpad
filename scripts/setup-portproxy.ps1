# Run as Administrator. Sets up Windows port proxy so localhost:4943 forwards to WSL.
# WSL IP can change on reboot; re-run this if the frontend stops loading.
$wslIp = (wsl -d Ubuntu hostname -I 2>$null).Trim().Split()[0]
if (-not $wslIp) { Write-Error "Could not get WSL IP"; exit 1 }
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=4943 2>$null
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=$wslIp connectport=4943
Write-Host "Port proxy: 127.0.0.1:4943 -> ${wslIp}:4943"
