# Backup and restore runbook

The launch stack has two pieces of persistent state:

| State | Where it lives | Backup |
| --- | --- | --- |
| CMS content, admin accounts, settings | Railway MySQL (`mysql-volume`, `/var/lib/mysql`) | Railway scheduled volume backups **and** a logical `mysqldump` |
| Donation ledger and pending alerts | Railway volume `donations-volume`, `/app/data` | Railway scheduled volume backups **and** a copy of the JSONL files |

Keep backups private: the donation ledger contains donor names, email addresses, and amounts.

## 1. Enable Railway scheduled backups

Railway can snapshot any service with an attached volume.

1. Open the **MySQL** service → **Settings** → **Backups**.
2. Enable **Daily** (kept 6 days), **Weekly** (kept 27 days), and **Monthly** (kept 89 days).
3. Repeat for the **donations** service.
4. Confirm the first daily backup appears in the **Backups** tab.

Scheduled volume snapshots restore the whole disk. Use the logical dump below when you need to
restore a single database or move the data to another host.

## 2. Take an on-demand logical backup

Prerequisites: the Railway CLI is logged in, an SSH key is registered with Railway, and the MySQL
service is named `MySQL`.

The short path is the helper script, which downloads, verifies, and hashes both files:

```powershell
./scripts/backup-production.ps1 -OutDir D:\mwb-backups
```

The manual equivalent, run from `backend/`, is below:

```powershell
$dir = "C:\backups\mwb"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$b64 = railway ssh --service MySQL -i "$HOME\.ssh\railway_mwb2" `
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --triggers "$MYSQL_DATABASE" 2>/dev/null | gzip -c | base64 -w0' 2>$null

$path = Join-Path $dir ("mysql-" + (Get-Date -Format "yyyy-MM-dd-HHmm") + ".sql.gz")
[IO.File]::WriteAllBytes($path, [Convert]::FromBase64String(($b64 -join "").Trim()))
Get-FileHash $path -Algorithm SHA256
```

Copy the donation ledger in the same way, replacing the service and file:

```powershell
$b64 = railway ssh --service donations -i "$HOME\.ssh\railway_mwb2" `
  "base64 -w0 /app/data/donations.jsonl" 2>$null

$path = Join-Path $dir ("donations-" + (Get-Date -Format "yyyy-MM-dd-HHmm") + ".jsonl")
[IO.File]::WriteAllBytes($path, [Convert]::FromBase64String(($b64 -join "").Trim()))
```

Store the files in an encrypted location and follow the retention policy. Do not commit them.

## 3. Restore the MySQL database

Restore into a temporary database first, compare row counts, then swap it in during a maintenance
window.

```sh
# Inside the MySQL service container
gunzip -c /tmp/mysql-backup.sql.gz | mysql -u root -p"$MYSQL_ROOT_PASSWORD" mwb_restore_check
```

Compare the source and restore counts for every table:

```sql
SELECT COUNT(*) FROM information_schema.tables
 WHERE table_schema = 'mwb_restore_check';

SELECT COUNT(*) FROM mwb_restore_check.stories;
SELECT COUNT(*) FROM mwb_restore_check.performances;
SELECT COUNT(*) FROM mwb_restore_check.users;
```

To restore in place, stop the API service, take a fresh backup, then pipe the dump into the
production database and restart the API. The Laravel image runs `php artisan migrate --force` on
boot, so keep the dump from the same or an older schema version.

## 4. Restore the donation ledger

The ledger is append-only JSON Lines. Restoring means replacing `/app/data/donations.jsonl` with a
backup copy while the donations service is stopped.

```sh
# Inside the donations service container
cp /app/data/donations.jsonl /app/data/donations.jsonl.before-restore
cp /tmp/donations-backup.jsonl /app/data/donations.jsonl
```

Every non-empty line must parse as JSON and contain a unique `paymentIntentId`. A restored ledger
must still ignore a duplicate Stripe event; the service rebuilds that index on boot.

## 5. Verified rehearsal (2026-11-18)

The staging stack was backed up and restored end to end:

- MySQL: 12 tables, all table row counts identical after restore into `mwb_restore_check`; the
  temporary database was dropped afterwards.
- Donation ledger: 4 entries, 4 unique PaymentIntent IDs; a restored copy accepted a duplicate
  record check without changing the file hash.
- Backups were downloaded and SHA-256 hashes matched the files in the containers.
- Temporary copies containing donor data were deleted after verification.

Re-run this rehearsal after any schema or ledger-format change, and before the live launch.
