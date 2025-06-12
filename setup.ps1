# setup.ps1

Write-Host "`nStarting full setup..."

# === Backend Setup ===
Write-Host "`nSetting up Flask backend..."
cd server

# Create venv if not exists
if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Host "Virtual environment created."
} else {
    Write-Host "Virtual environment already exists. Skipping creation."
}

# Activate venv
Write-Host "Activating virtual environment..."
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env if missing
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..."
    @"
MONGO_URI=mongodb://localhost:27017/Software_Engineering
"@ | Out-File -Encoding ascii .env
}

cd ..

# === Frontend Setup ===
Write-Host "`nSetting up React frontend..."
cd client

# Install npm dependencies
Write-Host "Installing npm packages..."
npm install

cd ..

# === DONE ===
Write-Host "`nSetup complete."
Write-Host "To run backend:   cd server; .\venv\Scripts\Activate.ps1; python main.py"
Write-Host "To run frontend:  cd client; npm run dev"
