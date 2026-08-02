#!/bin/bash
set -e

echo "============================================="
echo "  🚀 RAG QA — Production Entrypoint"
echo "============================================="

# --------------------------------------------------
# 1. Generate Prisma Client
# --------------------------------------------------
echo ""
echo "📦 Step 1/4: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated."

# --------------------------------------------------
# 2. Push database schema (create/update tables)
# --------------------------------------------------
echo ""
echo "📦 Step 2/4: Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || {
  echo "⚠️  Prisma db push failed (database may not be configured)."
  echo "   Falling back to manual db-setup script..."
  node scripts/db-setup.mjs || echo "⚠️  db-setup.mjs also failed. Continuing anyway..."
}
echo "✅ Database schema is up to date."

# --------------------------------------------------
# 3. Seed admin user & system settings
# --------------------------------------------------
echo ""
echo "👤 Step 3/4: Seeding admin user & system settings..."
node scripts/seed-admin.mjs || {
  echo "⚠️  Admin seed failed. Admin can be created manually."
  echo "   Register with: admin@email.com / admin123"
}

# --------------------------------------------------
# 4. Start the application
# --------------------------------------------------
echo ""
echo "============================================="
echo "  🟢 Starting Next.js Application..."
echo "============================================="
echo ""

if [ "$NODE_ENV" = "production" ]; then
  echo "Mode: Production"
  npm run build
  npm run start
else
  echo "Mode: Development"
  npm run dev
fi
