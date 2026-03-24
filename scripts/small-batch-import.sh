#!/bin/bash

# Small batch import - extracts first 50 warehouses and creates a small SQL
INPUT_SQL="/tmp/cc-agent/57874081/project/scripts/direct-import.sql"
OUTPUT_SQL="/tmp/small-batch.sql"

echo "Creating small batch of 50 warehouses..."

# Extract header and first 50 warehouses
awk '
/^-- Chunk 1/ { found=1; print; next }
found && /^INSERT INTO warehouses/ { print; getline; print; getline; print; next }
found && /^\(/ {
  if (count < 50) {
    print
    count++
  } else if (count == 50) {
    # Remove trailing comma and add ON CONFLICT
    sub(/,$/, "")
    print
    print "ON CONFLICT (wh_id) DO UPDATE SET"
    print "  name = EXCLUDED.name,"
    print "  total_area = EXCLUDED.total_area,"
    print "  updated_at = now();"
    exit
  }
}
' "$INPUT_SQL" > "$OUTPUT_SQL"

echo "✅ Created $OUTPUT_SQL with 50 warehouses"
wc -l "$OUTPUT_SQL"
