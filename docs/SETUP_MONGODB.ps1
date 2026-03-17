# Setup MongoDB Community Edition on Windows
# This script downloads and sets up MongoDB locally

Write-Host "Setting up MongoDB locally..." -ForegroundColor Cyan

# Check if MongoDB is already installed
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
if (Test-Path $mongoPath) {
    Write-Host "✓ MongoDB Community Edition found at $mongoPath" -ForegroundColor Green
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    & $mongoPath --dbpath "$env:USERPROFILE\MongoDBData"
    exit
}

# Download MongoDB Community Edition (7.0)
Write-Host "MongoDB not found. Downloading MongoDB Community Edition..." -ForegroundColor Yellow

$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.0-signed.msi"
$installerPath = "$env:TEMP\mongodb-setup.msi"

# Download
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri $mongoUrl -OutFile $installerPath
Write-Host "✓ Downloaded MongoDB" -ForegroundColor Green

# Install
Write-Host "Installing MongoDB (this may take a minute)..." -ForegroundColor Yellow
Start-Process -FilePath $installerPath -ArgumentList "/quiet /norestart" -Wait
Write-Host "✓ MongoDB installed" -ForegroundColor Green

# Create data directory
$dataDir = "$env:USERPROFILE\MongoDBData"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "✓ Created MongoDB data directory" -ForegroundColor Green
}

# Start MongoDB
Write-Host "Starting MongoDB on port 27017..." -ForegroundColor Yellow
& $mongoPath --dbpath $dataDir
