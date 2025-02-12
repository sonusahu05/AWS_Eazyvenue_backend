const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');
class SettingsRepository extends BaseRepository {
    constructor() {
        super('settings');
    }
}
module.exports = SettingsRepository;