#!/bin/bash
# Apply admin metrics functions migration to Supabase
# Run this script to create efficient RPC functions for user metrics

echo "🚀 Applying admin metrics migration to Supabase..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Please install PostgreSQL client."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check environment variables
if [ -z "$PGPASSWORD" ]; then
    echo "❌ Error: PGPASSWORD environment variable not set"
    echo "   Export it with: export PGPASSWORD='your-password'"
    exit 1
fi

# Supabase connection details
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.fjxbuyxephlfoivcpckd"
DB_NAME="postgres"

echo "📡 Connecting to Supabase..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Apply migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase-admin-metrics-functions.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Testing functions..."
    echo ""

    # Test the functions
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT get_user_metrics();"

    echo ""
    echo "🎉 All done! The admin dashboard should now show correct user counts."
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
