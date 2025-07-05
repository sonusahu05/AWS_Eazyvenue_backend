# Venue Interest Tracking System - Analytics Geography Module

## Overview
The Analytics Geography module provides comprehensive tracking and insights for venue interactions on the EazyVenue platform with a focus on geographic data analysis. It tracks user engagement, generates location-based analytics, device statistics, and provides actionable insights for venue owners.

## Features

### 🎯 Click Tracking
- **Real-time venue click tracking**
- **User engagement metrics** (time spent, scroll depth, enquiry submissions)
- **Location-based analytics** (city, pincode, coordinates)
- **Device and platform detection**
- **Quality score calculation**
- **Returning user detection**

### 📊 Analytics & Insights
- **Heatmap data** for geographical distribution
- **City-wise click statistics**
- **Device breakdown** (mobile, desktop, tablet)
- **Timeline analytics** (daily click trends)
- **Top performing pincodes**
- **Quality score metrics**

## API Endpoints

### 📈 Public Endpoints

#### Track Venue Click
```http
POST /api/analytics/geography/track-venue-click
```

**Request Body:**
```json
{
  "venueId": "VENUE123",
  "sessionId": "session_abc123",
  "userId": "USER789", // Optional
  "location": {
    "lat": 19.0728,
    "lng": 72.8826,
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  },
  "device": {
    "userAgent": "Mozilla/5.0...",
    "platform": "iOS",
    "browser": "Safari",
    "isMobile": true
  },
  "engagement": {
    "timeSpentSeconds": 25,
    "scrollDepthPercent": 80,
    "submittedEnquiry": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Venue interest tracked successfully",
  "data": {
    "id": "60f7b1b9e1b7c123456789ab",
    "venueId": "VENUE123",
    "timestamp": "2025-07-05T10:30:00.000Z"
  }
}
```

### 🔒 Admin Endpoints (Require Authentication)

#### Update Venue Insights
```http
POST /api/analytics/geography/update-venue-insights/:venueId
Authorization: Bearer <admin_jwt_token>
```

#### Get Venue Insights
```http
GET /api/analytics/geography/venue-insights/:venueId
Authorization: Bearer <admin_jwt_token>
```

#### Get Venue Clicks
```http
GET /api/analytics/geography/venue-clicks/:venueId
Authorization: Bearer <admin_jwt_token>
```

#### Get Geographic Distribution
```http
GET /api/analytics/geography/geographic-distribution/:venueId
Authorization: Bearer <admin_jwt_token>
```

#### Get Overview Stats
```http
GET /api/analytics/geography/stats/overview
Authorization: Bearer <admin_jwt_token>
```

#### Get Popular Venues
```http
GET /api/analytics/geography/stats/popular-venues
Authorization: Bearer <admin_jwt_token>
```

#### Get Device Analytics
```http
GET /api/analytics/geography/stats/device-analytics
Authorization: Bearer <admin_jwt_token>
```

#### Health Check
```http
GET /api/analytics/geography/health
Authorization: Bearer <admin_jwt_token>
```

#### Get Venue Click History
```http
GET /api/analytics/venue-clicks/:venueId?startDate=2025-07-01&endDate=2025-07-05&limit=100&includeDetails=true
Authorization: Bearer <admin_jwt_token>
```

#### Generate Insights for Specific Venue
```http
POST /api/analytics/generate-insights/:venueId
Authorization: Bearer <admin_jwt_token>
```

## Data Structures

### MongoDB Collections (Admin Structure)

#### analytics.geography.venue_clicks
```javascript
{
  "venueId": "VENUE123",
  "timestamp": ISODate("2025-07-05T10:30:00.000Z"),
  "user": {
    "userId": "USER789",
    "isReturning": true,
    "sessionId": "session_abc123"
  },
  "location": {
    "lat": 19.0728,
    "lng": 72.8826,
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  },
  "device": {
    "userAgent": "Mozilla/5.0...",
    "platform": "iOS",
    "browser": "Safari",
    "isMobile": true
  },
  "engagement": {
    "timeSpentSeconds": 25,
    "scrollDepthPercent": 80,
    "submittedEnquiry": false
  },
  "qualityScore": 0.76
}
```

#### analytics.geography.venue_insights
```javascript
{
  "_id": "VENUE123",
  "heatmapPoints": [
    { "lat": 19.0728, "lng": 72.8826, "count": 15 }
  ],
  "cityStats": [
    { "city": "Mumbai", "clicks": 80 },
    { "city": "Delhi", "clicks": 45 }
  ],
  "deviceStats": {
    "mobile": 120,
    "desktop": 40,
    "tablet": 5
  },
  "timeline": [
    { "date": "2025-07-05", "clicks": 35 }
  ],
  "topPincodes": [
    { "pincode": "400001", "count": 19 }
  ],
  "totalClicks": 165,
  "averageQualityScore": 0.68,
  "lastUpdated": ISODate("2025-07-05T15:30:00.000Z")
}
```

### MongoDB Admin Structure

All analytics data is organized under the `admin` folder structure in MongoDB:

```
MongoDB Database: eazyvenue_test
├── admin/
│   └── analytics/
│       └── geography/
│           ├── venue_clicks      # Raw click tracking data
│           └── venue_insights    # Aggregated analytics data
```

**Collection Names:**
- `analytics.geography.venue_clicks` - Stores all venue click events
- `analytics.geography.venue_insights` - Stores aggregated venue analytics

**Benefits of Admin Structure:**
- 🔒 **Organized Data**: Clear separation of admin analytics data
- 📊 **Geographic Focus**: Data specifically organized for location-based analytics
- 🎯 **Easy Management**: Admin can easily identify and manage analytics collections
- 🔍 **Better Indexing**: Focused indexes for geographic data analysis

## Quality Score Calculation

The quality score is calculated using a weighted formula:

```javascript
qualityScore = (timeScore * 0.4) + (scrollScore * 0.3) + (enquiryScore * 0.3)

Where:
- timeScore = min(timeSpentSeconds / 60, 1.0)  // Max 60 seconds = 1.0
- scrollScore = scrollDepthPercent / 100       // 0-100% = 0.0-1.0  
- enquiryScore = submittedEnquiry ? 1 : 0      // Boolean to 0 or 1
```

## Frontend Integration

### Angular Service Example
```typescript
// analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  trackVenueClick(venueId: string, additionalData: any) {
    const trackingData = {
      venueId,
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId(),
      location: {
        lat: additionalData.lat,
        lng: additionalData.lng,
        city: additionalData.city,
        state: additionalData.state,
        country: 'India',
        pincode: additionalData.pincode
      },
      device: {
        userAgent: navigator.userAgent,
        platform: this.detectPlatform(),
        browser: this.detectBrowser(),
        isMobile: this.isMobileDevice()
      },
      engagement: {
        timeSpentSeconds: this.getTimeSpent(),
        scrollDepthPercent: this.getScrollDepth(),
        submittedEnquiry: false
      }
    };

    return this.http.post('/api/analytics/track-venue-click', trackingData);
  }

  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || this.generateSessionId();
  }

  private generateSessionId(): string {
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
    return sessionId;
  }

  private getTimeSpent(): number {
    // Implement time tracking logic
    return Math.floor((Date.now() - this.pageStartTime) / 1000);
  }

  private getScrollDepth(): number {
    // Implement scroll depth calculation
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    return Math.round((scrollTop / (docHeight - winHeight)) * 100);
  }
}
```

### Usage in Component
```typescript
// venue-detail.component.ts
export class VenueDetailComponent implements OnInit, OnDestroy {
  private pageStartTime = Date.now();

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    // Track venue view
    this.trackVenueView();
  }

  trackVenueView() {
    const trackingData = {
      lat: this.venue.latitude,
      lng: this.venue.longitude,
      city: this.venue.city,
      state: this.venue.state,
      pincode: this.venue.pincode
    };

    this.analyticsService.trackVenueClick(this.venue.id, trackingData)
      .subscribe(response => {
        console.log('Venue click tracked successfully');
      });
  }

  onEnquirySubmit() {
    // Update engagement when enquiry is submitted
    this.analyticsService.trackVenueClick(this.venue.id, {
      ...this.trackingData,
      engagement: {
        timeSpentSeconds: this.getTimeSpent(),
        scrollDepthPercent: this.getScrollDepth(),
        submittedEnquiry: true
      }
    }).subscribe();
  }
}
```

## Testing

### Generate Test Data
```javascript
// Use the test data generator
const AnalyticsTestData = require('./api/analytics/testDataGenerator');
const testData = new AnalyticsTestData();

// Generate test clicks for a venue
await testData.generateTestClicks('VENUE123', 100);

// Generate test data for multiple venues
await testData.generateTestDataForMultipleVenues(['VENUE123', 'VENUE456'], 50);
```

### Manual Testing
```bash
# Track a venue click
curl -X POST http://localhost:3001/api/analytics/track-venue-click \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "VENUE123",
    "sessionId": "test_session_123",
    "location": {"city": "Mumbai", "state": "Maharashtra"},
    "device": {"platform": "Chrome", "isMobile": false},
    "engagement": {"timeSpentSeconds": 30, "scrollDepthPercent": 75}
  }'

# Update insights (requires admin token)
curl -X POST http://localhost:3001/api/analytics/update-venue-insights \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get insights (requires admin token)
curl http://localhost:3001/api/analytics/venue-insights/VENUE123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Database Indexes

The following indexes are automatically created:

### venue_clicks collection:
- `{ venueId: 1 }`
- `{ timestamp: -1 }`
- `{ venueId: 1, timestamp: -1 }`
- `{ "location.city": 1 }`
- `{ "device.platform": 1 }`
- `{ "user.userId": 1 }`
- `{ "location.pincode": 1 }`

### venue_insights collection:
- `{ _id: 1 }`
- `{ lastUpdated: -1 }`

## Performance Considerations

1. **Batch Processing**: The insight generation processes venues in batches to avoid overwhelming the database.

2. **Efficient Aggregations**: Uses MongoDB aggregation pipelines for optimal performance.

3. **Proper Indexing**: All frequently queried fields are indexed for fast lookups.

4. **Data Retention**: Consider implementing data retention policies for the venue_clicks collection based on your requirements.

## Security

1. **Public Endpoint**: The tracking endpoint is public but includes basic validation.

2. **Admin Protection**: All analytics viewing endpoints require admin authentication.

3. **Data Validation**: All input data is validated before processing.

4. **Rate Limiting**: Consider implementing rate limiting for the tracking endpoint in production.

## Troubleshooting

### Common Issues

1. **Missing Indexes**: Run the seed service to create indexes automatically.

2. **No Insights Generated**: Ensure venues have click data before generating insights.

3. **Authentication Errors**: Verify JWT tokens are valid and user has admin role.

4. **Performance Issues**: Check database indexes and consider data archiving for old click data.

### Logs
Monitor application logs for:
- Click tracking events
- Insight generation progress
- Error messages with detailed context

## Future Enhancements

1. **Real-time Analytics**: Implement WebSocket connections for real-time updates.

2. **Advanced Metrics**: Add conversion rates, bounce rates, and user journey tracking.

3. **Export Features**: Allow exporting insights as PDF/Excel reports.

4. **Automated Insights**: Schedule automatic insight generation.

5. **Machine Learning**: Implement predictive analytics for venue performance.
