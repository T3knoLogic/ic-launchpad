# Run frontend dev server from Windows (no WSL needed for the UI)
# Prerequisites: replica running in WSL + port proxy for 4943
# Then open http://localhost:5173

$frontend = "r:\REPOSITORIES\ic-launchpad\frontend"
Push-Location $frontend
npm run dev
Pop-Location
