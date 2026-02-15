#!/bin/bash

# Migration Script: Fix existing users without role field
# This script adds role: "student" to all users that don't have the role field
# Run this ONCE after deploying the new auth system

echo "🔄 Starting user role migration..."
echo ""

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "❌ Error: mongosh is not installed"
    echo "Please install MongoDB Shell: https://www.mongodb.com/try/download/shell"
    exit 1
fi

# Migration script
mongosh my_teaching_platform <<EOF
print("📊 Current users without role field:");
db.users.find({ role: { \$exists: false } }).forEach(function(user) {
    print("  - " + user.email + " (ID: " + user._id + ")");
});

print("");
print("🔧 Adding role: 'student' to users without role...");

var result = db.users.updateMany(
    { role: { \$exists: false } },
    { \$set: { role: "student" } }
);

print("✅ Migration complete!");
print("   Matched: " + result.matchedCount);
print("   Modified: " + result.modifiedCount);

print("");
print("📋 Verifying all users now have role field:");
db.users.find({}, { email: 1, role: 1, _id: 0 }).forEach(function(user) {
    print("  - " + user.email + " → " + user.role);
});

print("");
print("✅ All done! Users are ready.");
EOF

echo ""
echo "🎯 Next steps:"
echo "   1. If you need to make someone admin, run:"
echo "      mongosh my_teaching_platform --eval 'db.users.updateOne({email: \"admin@example.com\"}, {\$set: {role: \"admin\"}})'"
echo ""
echo "   2. Users must logout and login again to refresh their JWT tokens"
echo ""
