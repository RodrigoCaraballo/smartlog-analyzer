#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node prisma/seed.js

exec "$@"
