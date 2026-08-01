
set -euo pipefail

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/autoniv}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="autoniv_backup_${TIMESTAMP}"

echo "📦 Starting MongoDB backup: ${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Run mongodump
mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${BACKUP_DIR}/${BACKUP_NAME}.gz" \
  --gzip \
  --quiet

echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.gz"

# Upload to S3 if configured
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo " uploading to s3://${BACKUP_S3_BUCKET}/backups/"
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.gz" "s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_NAME}.gz" --quiet
  echo "✅ Uploaded to S3"
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "autoniv_backup_*.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete 2>/dev/null || true

echo "✅ Backup complete"
