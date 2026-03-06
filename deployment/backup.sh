#!/bin/bash
# ==========================================
# PostgreSQL Automated Backup Script
# ==========================================

# Variables
DB_NAME="erp" # Replace with actual database name
DB_USER="postgres" # Replace with actual DB user
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILE_NAME="$BACKUP_DIR/$DB_NAME-$DATE.sql.gz"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

echo "Starting database backup at $DATE"

# Run pg_dump, compress via gzip, and save to output file
pg_dump -U $DB_USER -d $DB_NAME | gzip > $FILE_NAME

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $FILE_NAME"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Delete backups older than retention period
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -name "$DB_NAME-*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
echo "Cleanup complete."

# (Optional) Sync to Cloud Storage (AWS S3, Google Drive via rclone, etc.)
# rclone copy $FILE_NAME remote:backups/ziyo-erp/
