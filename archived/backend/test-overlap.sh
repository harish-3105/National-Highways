#!/bin/bash

# Test 1: Try to create a section that overlaps with NH87-S003 (124.239 - 126.802)
echo "======================================"
echo "Test 1: Creating overlapping section"
echo "Trying to create section: 125.000 - 127.000 km"
echo "Should overlap with S003 (124.239 - 126.802) and S004 (126.802 - 127.232)"
echo "======================================"

curl -s -X POST http://localhost:3000/api/highways \
  -H "Content-Type: application/json" \
  -d '{
    "roadName": "NH87",
    "roadCode": "NH87",
    "fromLocation": "Test",
    "toLocation": "Test",
    "fromChainage": "125.000 km",
    "toChainage": "127.000 km",
    "configuration": "TWO_LANE",
    "status": "ACTIVE",
    "isParent": false,
    "parentHighwayId": 11,
    "sectionNumber": 99
  }' | python3 -m json.tool

echo ""
echo ""

# Test 2: Try to create a non-overlapping section
echo "======================================"
echo "Test 2: Creating non-overlapping section"
echo "Trying to create section: 195.050 - 200.000 km"
echo "Should succeed (no overlap)"
echo "======================================"

curl -s -X POST http://localhost:3000/api/highways \
  -H "Content-Type: application/json" \
  -d '{
    "roadName": "NH87",
    "roadCode": "NH87",
    "fromLocation": "Test Location A",
    "toLocation": "Test Location B",
    "fromChainage": "195.050 km",
    "toChainage": "200.000 km",
    "configuration": "TWO_LANE",
    "status": "ACTIVE",
    "isParent": false,
    "parentHighwayId": 11,
    "sectionNumber": 98
  }' | python3 -m json.tool

echo ""
echo "Tests completed!"
