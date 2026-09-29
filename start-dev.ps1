
# Valeon CM Engine - Standalone Development Launcher

$root = $PSScriptRoot

Write-Host ""
Write-Host "==============================================="
Write-Host "   Valeon CM Engine - Prototype Launcher"
Write-Host "==============================================="

$services = @(
    @{
        Name = "Mock MadeMarket CRM"
        Folder = "mock-crm"
        Port = 3001
        Command = "npm start"
    },
    @{
        Name = "AI Agents Service"
        Folder = "agents"
        Port = 3002
        Command = "npm start"
    },
    @{
        Name = "React Dashboard"
        Folder = "dashboard"
        Port = 5173
        Command = "npm run dev"
    }
)

foreach ($service in $services) {
    $folder = Join-Path $root $service.Folder

    if (-not (Test-Path $folder)) {
        Write-Host "Missing folder: $folder" -ForegroundColor Red
        continue
    }

    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Yellow

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit"
        "-Command"
        "Set-Location '$folder'; Write-Host '$($service.Name)' -ForegroundColor Green; $($service.Command)"
    )

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "All launch commands have been issued." -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Cyan