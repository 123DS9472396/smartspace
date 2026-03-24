# How to Reduce GitHub Repo Size for Bolt Import

## Problem
Getting 413 (Request Too Large) when importing from GitHub to Bolt.

## Solution Steps

### 1. Ensure .gitignore is Correct

Make sure these are in your `.gitignore`:
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

### 2. Check What's Actually in Your Repo

```bash
# Clone your repo fresh
git clone <your-repo-url> temp-check
cd temp-check

# Check size
du -sh .

# Find large files
find . -type f -size +500k -not -path "./node_modules/*" -exec ls -lh {} \;
```

### 3. Remove Large Files from Git History

If you accidentally committed large files:

```bash
# Install BFG Repo-Cleaner (easier than git filter-branch)
# Download from: https://rufflewind.com/bfg-repo-cleaner/

# Remove files larger than 1MB
java -jar bfg.jar --strip-blobs-bigger-than 1M your-repo.git

# Or remove specific files
git filter-repo --path public/pdf.worker.min.js --invert-paths
```

### 4. Create a Clean Branch for Bolt

```bash
# Create fresh branch with only essential files
git checkout --orphan bolt-import
git rm -rf .

# Copy only source files (no node_modules, no dist, no large binaries)
cp -r ../your-project/{client,server,shared,public,database,scripts} .
cp ../your-project/{package.json,package-lock.json,tsconfig.json,vite.config.ts,vite.config.server.ts,tailwind.config.ts,postcss.config.js,components.json,.gitignore,.env.example} .

# Commit
git add .
git commit -m "Clean branch for Bolt import"
git push origin bolt-import
```

### 5. Alternative: Use Smaller Subset

Create a minimal repo with:
- Source code only (client/, server/, shared/)
- Config files (package.json, vite.config.ts, etc.)
- NO large binaries
- NO research files, CSVs, diagrams unless essential

### 6. Files to Exclude from Git

**Always exclude:**
- `node_modules/` (908MB)
- `dist/` (build output)
- `.env` (secrets)
- PDF workers (download via npm instead)
- Research documents unless essential
- Backup files (*.backup)

**Keep:**
- All source code (client/, server/, shared/)
- Package files (package.json, package-lock.json)
- Config files
- Database schema files
- Small assets (<100KB)

## Quick Fix for Bolt Import

1. **Create new repo** with only essentials
2. **Don't include** public/pdf.worker.min.js (1.1MB) - it will be downloaded by npm
3. **Check repo size** should be under 10MB without node_modules

## Verify Before Importing

```bash
# After creating your clean repo
git clone <your-clean-repo-url> test
cd test
du -sh .  # Should be < 10MB
npm install  # Should work fine
npm run build  # Should build successfully
```

Then import the clean repo to Bolt!
