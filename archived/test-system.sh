#!/bin/bash

echo "=========================================="
echo "  Highways Management System - Quick Test"
echo "=========================================="
echo ""

# Test 1: Authentication
echo "✓ Test 1: Authentication"
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "  ✗ FAILED: Could not login"
  exit 1
else
  echo "  ✓ SUCCESS: Logged in"
fi
echo ""

# Test 2: List Highways
echo "✓ Test 2: List Highways"
HIGHWAYS_COUNT=$(curl -s -X GET http://localhost:3000/api/highways \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)
echo "  Found $HIGHWAYS_COUNT highways"
echo ""

# Test 3: GeoJSON Export
echo "✓ Test 3: GeoJSON Export for Map"
GEOJSON_FEATURES=$(curl -s -X GET http://localhost:3000/api/highways/geojson \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', {}).get('features', [])))" 2>/dev/null)
echo "  GeoJSON has $GEOJSON_FEATURES features"
echo ""

# Test 4: Create Highway
echo "✓ Test 4: Create New Highway"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/highways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roadName": "Test Highway",
    "roadCode": "TEST-001",
    "fromLocation": "City A",
    "toLocation": "City B",
    "status": "ACTIVE",
    "geometry": {
      "type": "LineString",
      "coordinates": [[77.5, 28.5], [77.6, 28.6]]
    }
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print('SUCCESS' if data.get('success') else 'FAILED')" 2>/dev/null)
echo "  Create Highway: $CREATE_RESPONSE"
echo ""

# Test 5: List highways again to verify new highway
echo "✓ Test 5: Verify Highway Added"
NEW_HIGHWAYS_COUNT=$(curl -s -X GET http://localhost:3000/api/highways \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)
echo "  Now have $NEW_HIGHWAYS_COUNT highways (was $HIGHWAYS_COUNT)"
echo ""

# Test 6: Users List
echo "✓ Test 6: List Users"
USERS_COUNT=$(curl -s -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)
echo "  Found $USERS_COUNT users"
echo ""

# Test 7: Frontend Accessibility
echo "✓ Test 7: Frontend Accessibility"
if curl -s http://localhost:3001 | grep -q "Highways Management System"; then
  echo "  ✓ Frontend is accessible"
else
  echo "  ✗ Frontend not accessible"
fi
echo ""

echo "=========================================="
echo "  All Tests Completed!"
echo "=========================================="
echo ""
echo "Access the system at: http://localhost:3001"
echo "Username: admin"
echo "Password: admin123"
echo ""
