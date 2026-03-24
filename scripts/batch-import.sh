#!/bin/bash

# Batch import script for warehouses
# This script splits the large SQL file into manageable batches and imports them

SQL_FILE="/tmp/cc-agent/57874081/project/scripts/insert-warehouses.sql"
TEMP_DIR="/tmp/warehouse_batches"

echo "🚀 Starting batch import process..."
echo "📦 Processing SQL file: $SQL_FILE"

# Create temp directory
mkdir -p "$TEMP_DIR"

# Split the SQL file by batch markers
awk '
/^-- Batch [0-9]+\/100/ {
  if (outfile) {
    print "ON CONFLICT (wh_id) DO UPDATE SET" >> outfile
    print "  name = EXCLUDED.name," >> outfile
    print "  updated_at = now();" >> outfile
    close(outfile)
  }
  batch_num = gensub(/^-- Batch ([0-9]+)\/100.*/, "\\1", 1)
  outfile = "'"$TEMP_DIR"'/batch_" sprintf("%03d", batch_num) ".sql"
  next
}
outfile { print >> outfile }
END {
  if (outfile) {
    print "ON CONFLICT (wh_id) DO UPDATE SET" >> outfile
    print "  name = EXCLUDED.name," >> outfile
    print "  updated_at = now();" >> outfile
    close(outfile)
  }
}
' "$SQL_FILE"

echo "✅ Split into batches in: $TEMP_DIR"
echo "📊 Total batch files: $(ls $TEMP_DIR/batch_*.sql 2>/dev/null | wc -l)"

# Count total files
BATCH_COUNT=$(ls $TEMP_DIR/batch_*.sql 2>/dev/null | wc -l)

if [ "$BATCH_COUNT" -eq 0 ]; then
  echo "❌ No batch files created. Check the SQL file format."
  exit 1
fi

echo "✅ Ready to import $BATCH_COUNT batches"
echo ""
echo "To import using Supabase CLI, run:"
echo "  for file in $TEMP_DIR/batch_*.sql; do"
echo "    echo \"Importing \$file...\""
echo "    supabase db execute < \"\$file\""
echo "  done"
