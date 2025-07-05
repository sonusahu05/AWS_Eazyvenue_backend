#!/bin/bash

# Analytics API Test Script
# Tests all endpoints of the Venue Interest Tracking System

echo "🚀 Testing EazyVenue Analytics API"
echo "=================================="

# Server URL
SERVER="http://localhost:3006"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
test_endpoint() {
    local name="$1"
    local expected_status="$2"
    local response="$3"
    
    if echo "$response" | grep -q '"success":true' && [ "$expected_status" = "success" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $name"
    elif echo "$response" | grep -q '"success":false' && [ "$expected_status" = "error" ]; then
        echo -e "${YELLOW}✅ PASS${NC}: $name (Expected error)"
    else
        echo -e "${RED}❌ FAIL${NC}: $name"
        echo "   Response: $response"
    fi
}

echo
echo -e "${BLUE}🔍 Testing Health Check${NC}"
response=$(curl -s "$SERVER/health")
test_endpoint "Health Check" "success" "$response"

echo
echo -e "${BLUE}📊 Testing Venue Click Tracking${NC}"

# Test 1: Valid click tracking
echo "Test 1: Valid venue click (High engagement)"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_TEST_001",
    "sessionId": "session_script_001",
    "userId": "user_test_001",
    "location": {
      "lat": 19.0728,
      "lng": 72.8826,
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": "400001"
    },
    "device": {
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "platform": "macOS",
      "browser": "Chrome",
      "isMobile": false
    },
    "engagement": {
      "timeSpentSeconds": 60,
      "scrollDepthPercent": 90,
      "submittedEnquiry": true
    }
  }')
test_endpoint "High engagement click" "success" "$response"

# Test 2: Mobile device click
echo "Test 2: Mobile device click"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_TEST_001",
    "sessionId": "session_script_002",
    "location": {
      "city": "Delhi",
      "state": "Delhi",
      "country": "India"
    },
    "device": {
      "platform": "iOS",
      "browser": "Safari",
      "isMobile": true
    },
    "engagement": {
      "timeSpentSeconds": 30,
      "scrollDepthPercent": 70,
      "submittedEnquiry": false
    }
  }')
test_endpoint "Mobile device click" "success" "$response"

# Test 3: Low engagement click
echo "Test 3: Low engagement click"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_TEST_002",
    "sessionId": "session_script_003",
    "location": {
      "city": "Bangalore",
      "state": "Karnataka"
    },
    "device": {
      "platform": "Windows",
      "isMobile": false
    },
    "engagement": {
      "timeSpentSeconds": 10,
      "scrollDepthPercent": 20,
      "submittedEnquiry": false
    }
  }')
test_endpoint "Low engagement click" "success" "$response"

# Test 4: Invalid data (missing required fields)
echo "Test 4: Invalid data (missing venueId)"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_script_004"
  }')
test_endpoint "Missing venueId validation" "error" "$response"

# Test 5: Invalid data (missing sessionId)
echo "Test 5: Invalid data (missing sessionId)"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE_TEST_003"
  }')
test_endpoint "Missing sessionId validation" "error" "$response"

echo
echo -e "${BLUE}📈 Testing Insight Generation${NC}"

# Test 6: Generate insights
echo "Test 6: Generate insights from tracked data"
response=$(curl -s -X POST "$SERVER/api/analytics/geography/update-venue-insights")
test_endpoint "Insight generation" "success" "$response"

echo
echo -e "${BLUE}📊 Testing Insight Retrieval${NC}"

# Test 7: Get insights for venue with data
echo "Test 7: Get insights for venue with data"
response=$(curl -s "$SERVER/api/analytics/geography/venue-insights/VENUE_TEST_001")
test_endpoint "Get insights (existing venue)" "success" "$response"

# Test 8: Get insights for venue without data
echo "Test 8: Get insights for venue without data"
response=$(curl -s "$SERVER/api/analytics/geography/venue-insights/VENUE_NONEXISTENT")
test_endpoint "Get insights (non-existent venue)" "error" "$response"

echo
echo -e "${BLUE}📋 Testing Analytics Summary${NC}"

# Test 9: Get analytics summary
echo "Test 9: Get analytics summary"
response=$(curl -s "$SERVER/api/analytics/geography/summary")
test_endpoint "Analytics summary" "success" "$response"

echo
echo -e "${BLUE}📊 Sample Data Analysis${NC}"

# Show some sample insights
echo "Sample insights for VENUE_TEST_001:"
curl -s "$SERVER/api/analytics/geography/venue-insights/VENUE_TEST_001" | python3 -m json.tool 2>/dev/null || echo "Raw response: $(curl -s "$SERVER/api/analytics/geography/venue-insights/VENUE_TEST_001")"

echo
echo "Analytics Summary:"
curl -s "$SERVER/api/analytics/geography/summary" | python3 -m json.tool 2>/dev/null || echo "Raw response: $(curl -s "$SERVER/api/analytics/geography/summary")"

echo
echo -e "${GREEN}🎉 Testing Complete!${NC}"
echo "=================================="
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Integrate the tracking calls into your Angular frontend"
echo "2. Set up the admin dashboard to view insights"
echo "3. Configure MongoDB and deploy to production"
echo "4. Set up automated insight generation (cron job)"
echo
echo -e "${BLUE}Frontend integration example:${NC}"
echo "// Track venue click in Angular component"
echo "this.http.post('/api/analytics/geography/track-venue-click', {"
echo "  venueId: this.venue.id,"
echo "  sessionId: this.getSessionId(),"
echo "  userId: this.getCurrentUserId(),"
echo "  location: { city: this.venue.city, ... },"
echo "  device: { platform: this.detectPlatform(), ... },"
echo "  engagement: { timeSpent: this.getTimeSpent(), ... }"
echo "}).subscribe();"
