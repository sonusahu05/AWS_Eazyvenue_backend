# Venue Clicks Data Migration Script

This script migrates and normalizes venue clicks data in the `analytics.geography.venue_clicks` collection to ensure all documents have consistent structure and complete data.

## What the script does:

1. **Normalizes engagement.actions fields** - Ensures all documents have complete action data:
   - `startFilterDate` and `endFilterDate`
   - `eventDuration` (fixes 'full' dominance - adds 'evening', 'morning' variety)
   - `occasion`
   - `sendEnquiryClicked`
   - `weddingDecorType` and `weddingDecorPrice`
   - `foodMenuType` (converts '3x3', '1x1', etc. to 'veg', 'nonveg', 'jain', 'mix')
   - `foodMenuPrice` and `foodMenuPlate`
   - `guestCount`
   - `clickedOnReserved` and `clickedOnBookNow`
   - `madePayment` (15% probability as requested)

2. **Fixes problematic data values**:
   - Converts old food menu types (`3x3`, `1x1`, `2X2`, etc.) to proper values (`veg`, `nonveg`, `jain`, `mix`)
   - Reduces 'full' eventDuration dominance by adding variety (60% chance to change to 'evening'/'morning')
   - Handles array/object foodMenuType values

3. **Updates documents when**:
   - `engagement.actions` is missing or null
   - `engagement.actions` has fewer than 14 required fields
   - `engagement.actions` contains problematic values that need fixing

## Key Features:

- **Smart probability distribution**: `madePayment` is set to true only 15% of the time (10-20% range as requested)
- **Realistic data generation**: Uses sensible ranges and options for all fields
- **Preserves existing data**: Only fills missing fields, doesn't overwrite existing valid data
- **Batch processing**: Processes documents efficiently with progress tracking
- **Configurable**: Easy to customize via `config.js`

## Installation:

1. Navigate to the migrations directory:
   ```bash
   cd /Users/sonusahu/Desktop/AI\ Agency/eazyVenue/EazyvenueApiBackup/migrations
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration:

Update the configuration in `config.js`:

```javascript
database: {
    url: 'mongodb://localhost:27017', // Your MongoDB connection string
    name: 'analytics', // Your database name
    collection: 'geography.venue_clicks' // Your collection name
}
```

## Usage:

### 1. Dry Run (Recommended First Step)
See what would be changed without making any modifications:
```bash
npm run dry-run
```

### 2. Run Migration
Execute the actual migration:
```bash
npm run migrate
```

### 3. Validate Results
Check if migration was successful:
```bash
npm run validate
```

## Available Scripts:

- `npm run dry-run` - Preview changes without modifying data
- `npm run migrate` - Execute the migration
- `npm run validate` - Validate migration results

## Sample Data Generated:

The script generates realistic data following these patterns:

- **Occasions**: Birthday Party, Anniversary, Wedding, Corporate Event, etc.
- **Food Menu Types**: 2X2, 3X3, 4X4, 5X5
- **Wedding Decor**: Basic, Premium, Luxury, Custom with prices ₹25,000-₹1,50,000
- **Guest Counts**: 20-500 guests
- **Food Prices**: ₹40,000-₹2,00,000
- **Dates**: Valid dates in 2025
- **Payment Success**: Only 15% conversion rate

## Probability Configuration:

You can adjust the probabilities in `config.js`:

```javascript
probabilities: {
    madePayment: 0.15,        // 15% payment success
    sendEnquiryClicked: 0.30, // 30% enquiry rate
    clickedOnReserved: 0.40,  // 40% reservation clicks
    // ... more settings
}
```

## Safety Features:

- **Read-only verification**: Check the script logic before running
- **Incremental updates**: Only updates documents that need changes
- **Progress tracking**: Shows update progress every 100 documents
- **Error handling**: Graceful error handling and connection cleanup
- **Dry run mode**: Test without making changes

## Before Running:

1. **Backup your database** - Always backup before running migrations
2. **Run dry-run first** - Test the script with `npm run dry-run`
3. **Verify connection** - Ensure MongoDB connection details are correct
4. **Check configuration** - Review `config.js` settings

## Example Output:

```
Connecting to MongoDB...
Fetching documents to migrate...
Found 1523 documents to process
Updated 100 documents...
Updated 200 documents...
...
Migration completed! Updated 847 out of 1523 documents.
```

## Validation Output:

```
Total documents: 1523
Documents missing engagement.actions.madePayment: 0
Payment Statistics:
Made Payment: True = 228, False = 1295
Payment success rate: 14.97%

SUMMARY:
Total documents: 1523
Incomplete documents: 0
Complete documents: 1523
Migration success rate: 100.00%
```

## Troubleshooting:

- Ensure MongoDB is running and accessible
- Check connection string format in `config.js`
- Verify database and collection names
- Ensure proper permissions for database operations
- Run `npm run dry-run` first to identify issues
