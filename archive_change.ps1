$change = 'dues-notification-and-report'
$source = Join-Path 'c:\PROJECT WEB HMTI\openspec\changes' $change
$archiveDir = Join-Path 'c:\PROJECT WEB HMTI\openspec\changes' 'archive'
$target = Join-Path $archiveDir ((Get-Date).ToString('yyyy-MM-dd') + '-' + $change)

if (-not (Test-Path $source)) {
    throw "Source does not exist: $source"
}

if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
}

if (Test-Path $target) {
    throw "Archive target already exists: $target"
}

Move-Item -Path $source -Destination $target -Force
Write-Output $target
