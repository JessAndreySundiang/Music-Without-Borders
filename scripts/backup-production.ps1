#requires -Version 5.1
<#
.SYNOPSIS
  Downloads a logical MySQL dump and the donation ledger from Railway.

.DESCRIPTION
  Uses the Railway CLI's SSH transport, so no database port is exposed publicly.
  Writes a timestamped .sql.gz and .jsonl file, then verifies both. Secrets and
  donor records are never printed. Keep the output directory encrypted and out
  of the repository.

.EXAMPLE
  ./scripts/backup-production.ps1 -OutDir D:\mwb-backups
#>
[CmdletBinding()]
param(
  [string]$OutDir = (Join-Path $HOME "mwb-backups"),
  [string]$SshKey = (Join-Path $HOME ".ssh/railway_mwb2"),
  [string]$MysqlService = "MySQL",
  [string]$DonationsService = "donations"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  throw "The Railway CLI is not installed. See docs/railway.md."
}

if (-not (Test-Path $SshKey)) {
  throw "SSH key not found at $SshKey. Register one with 'railway ssh keys'."
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyy-MM-dd-HHmmss"

function Get-RemoteBase64 {
  param(
    [Parameter(Mandatory = $true)][string]$Service,
    [Parameter(Mandatory = $true)][string]$Command
  )

  $output = railway ssh --service $Service -i $SshKey $Command 2>$null
  if (-not $output) {
    throw "Railway returned no data for service '$Service'."
  }

  return (($output -join "") -replace "\s", "")
}

Write-Host "Backing up MySQL ($MysqlService)..."
$mysqlCommand = 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --triggers "$MYSQL_DATABASE" 2>/dev/null | gzip -c | base64 -w0'
$mysqlBase64 = Get-RemoteBase64 -Service $MysqlService -Command $mysqlCommand
$mysqlPath = Join-Path $OutDir "mysql-$stamp.sql.gz"
[IO.File]::WriteAllBytes($mysqlPath, [Convert]::FromBase64String($mysqlBase64))

# Decompress once to prove the gzip stream is complete and count the tables.
$input = [IO.File]::OpenRead($mysqlPath)
try {
  $gzip = New-Object IO.Compression.GZipStream($input, [IO.Compression.CompressionMode]::Decompress)
  $reader = New-Object IO.StreamReader($gzip)
  $sql = $reader.ReadToEnd()
  $reader.Close()
} finally {
  $input.Dispose()
}

$tableCount = ([regex]::Matches($sql, "CREATE TABLE ``")).Count
if ($tableCount -eq 0) {
  throw "The MySQL dump contains no tables; refusing to report success."
}

Write-Host "Backing up the donation ledger ($DonationsService)..."
$ledgerBase64 = Get-RemoteBase64 -Service $DonationsService -Command "base64 -w0 /app/data/donations.jsonl"
$ledgerPath = Join-Path $OutDir "donations-$stamp.jsonl"
[IO.File]::WriteAllBytes($ledgerPath, [Convert]::FromBase64String($ledgerBase64))

$entries = @(Get-Content $ledgerPath | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
$uniqueIds = @($entries | ForEach-Object { $_.paymentIntentId } | Where-Object { $_ } | Sort-Object -Unique)

$mysqlHash = (Get-FileHash $mysqlPath -Algorithm SHA256).Hash.ToLower()
$ledgerHash = (Get-FileHash $ledgerPath -Algorithm SHA256).Hash.ToLower()

Write-Host ""
Write-Host "mysql_backup=$mysqlPath"
Write-Host "mysql_bytes=$((Get-Item $mysqlPath).Length) tables=$tableCount sha256=$mysqlHash"
Write-Host "ledger_backup=$ledgerPath"
Write-Host "ledger_bytes=$((Get-Item $ledgerPath).Length) entries=$($entries.Count) unique_ids=$($uniqueIds.Count) sha256=$ledgerHash"
Write-Host ""
Write-Host "Store both files in an encrypted location. Do not commit them."
