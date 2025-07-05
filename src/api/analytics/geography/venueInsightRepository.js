const { ObjectId } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');

class VenueInsightRepository extends BaseRepository {
    constructor() {
        super('analytics.geography.venue_insights');
    }

    async upsertInsight(venueId, insightData) {
        try {
            const updateData = {
                ...insightData,
                lastUpdated: new Date()
            };

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .replaceOne(
                        { _id: venueId },
                        { _id: venueId, ...updateData },
                        { upsert: true }
                    ));
        } catch (error) {
            throw new Error(`Failed to upsert insight for venue ${venueId}: ${error.message}`);
        }
    }

    async getInsightByVenue(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .findOne({ _id: venueId }));
        } catch (error) {
            throw new Error(`Failed to get insight for venue ${venueId}: ${error.message}`);
        }
    }

    async getAllInsights() {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .find({})
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get all insights: ${error.message}`);
        }
    }

    async getInsightsByVenues(venueIds) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .find({ _id: { $in: venueIds } })
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get insights for venues: ${error.message}`);
        }
    }

    async deleteInsight(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .deleteOne({ _id: venueId }));
        } catch (error) {
            throw new Error(`Failed to delete insight for venue ${venueId}: ${error.message}`);
        }
    }

    async getInsightsCount() {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .countDocuments());
        } catch (error) {
            throw new Error(`Failed to get insights count: ${error.message}`);
        }
    }
}

module.exports = VenueInsightRepository;
