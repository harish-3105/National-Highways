Write-Host "======================================"
Write-Host "Test 1: Creating overlapping section"
Write-Host "Trying to create section: 125.000 - 127.000 km"
Write-Host "Should overlap with S003 (124.239 - 126.802) and S004 (126.802 - 127.232)"
Write-Host "======================================"

$payload1 = @{
  roadName = "NH87"
  roadCode = "NH87"
  fromLocation = "Test"
  toLocation = "Test"
  fromChainage = "125.000 km"
  toChainage = "127.000 km"
  configuration = "TWO_LANE"
  status = "ACTIVE"
  isParent = $false
  parentHighwayId = 11
  sectionNumber = 99
}

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/highways" -ContentType "application/json" -Body ($payload1 | ConvertTo-Json -Depth 10) | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host ""

Write-Host "======================================"
Write-Host "Test 2: Creating non-overlapping section"
Write-Host "Trying to create section: 195.050 - 200.000 km"
Write-Host "Should succeed (no overlap)"
Write-Host "======================================"

$payload2 = @{
  roadName = "NH87"
  roadCode = "NH87"
  fromLocation = "Test Location A"
  toLocation = "Test Location B"
  fromChainage = "195.050 km"
  toChainage = "200.000 km"
  configuration = "TWO_LANE"
  status = "ACTIVE"
  isParent = $false
  parentHighwayId = 11
  sectionNumber = 98
}

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/highways" -ContentType "application/json" -Body ($payload2 | ConvertTo-Json -Depth 10) | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Tests completed!"
