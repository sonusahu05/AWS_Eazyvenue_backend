#!/bin/bash

# Test script for real EazyVenue Analytics API
# Tests the analytics endpoints against the real backend and MongoDB database

BASE_URL="http://localhost:3006"
API_PREFIX="/api/analytics/geography"

echo "🚀 Testing EazyVenue Analytics API against real backend and database..."
echo "Backend URL: $BASE_URL"
echo "API Prefix: $API_PREFIX"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Track a venue click
echo -e "${YELLOW}Test 1: Track venue click${NC}"
CLICK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$API_PREFIX/track-venue-click" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "test_venue_123",
    "userId": "test_user_456",
    "sessionId": "session_789",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "coordinates": [72.8777, 19.0760]
    },
    "device": {
      "type": "desktop",
      "browser": "Chrome",
      "os": "macOS"
    },
    "engagement": {
      "timeSpent": 120,
      "actionsPerformed": 5,
      "conversionEvent": "inquiry"
    }
  }')

HTTP_CODE=$(echo "$CLICK_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CLICK_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Click tracking successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Click tracking failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test 2: Update venue insights
echo -e "${YELLOW}Test 2: Update venue insights${NC}"
INSIGHT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$API_PREFIX/update-venue-insights/test_venue_123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy_token" \
  -d '{
    "insights": {
      "popularTimes": [
        {"hour": 10, "popularity": 75},
        {"hour": 14, "popularity": 90},
        {"hour": 18, "popularity": 85}
      ],
      "averageRating": 4.5,
      "priceRange": "₹50,000 - ₹1,00,000",
      "amenityUsage": {
        "parking": 85,
        "ac": 95,
        "catering": 70
      }
    },
    "metadata": {
      "source": "analytics_engine",
      "confidence": 0.87
    }
  }')

HTTP_CODE=$(echo "$INSIGHT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$INSIGHT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Insights update successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Insights update failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Wait a moment for data to be processed
sleep 2

# Test 3: Get venue analytics (clicks)
echo -e "${YELLOW}Test 3: Get venue clicks${NC}"
ANALYTICS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$API_PREFIX/venue-clicks/test_venue_123" \
  -H "Authorization: Bearer dummy_token")

HTTP_CODE=$(echo "$ANALYTICS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ANALYTICS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Venue clicks retrieval successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Venue clicks retrieval failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test 4: Get geographic distribution
echo -e "${YELLOW}Test 4: Get geographic distribution${NC}"
AGGREGATED_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$API_PREFIX/geographic-distribution/test_venue_123" \
  -H "Authorization: Bearer dummy_token")

HTTP_CODE=$(echo "$AGGREGATED_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$AGGREGATED_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Geographic distribution retrieval successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Geographic distribution retrieval failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test 5: Get venue insights
echo -e "${YELLOW}Test 5: Get venue insights${NC}"
INSIGHTS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$API_PREFIX/venue-insights/test_venue_123" \
  -H "Authorization: Bearer dummy_token")

HTTP_CODE=$(echo "$INSIGHTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$INSIGHTS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Insights retrieval successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Insights retrieval failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

echo -e "${YELLOW}🔍 Testing complete! Check MongoDB for data verification.${NC}"
echo ""
echo "To verify data in MongoDB, run:"
echo "mongosh"
echo "use eazyvenue"
echo "db.analytics.geography.venue_clicks.find().limit(5)"
echo "db.analytics.geography.venue_insights.find().limit(5)"
