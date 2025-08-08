const SettingsRepository = require('./settingsRepository');
class SettingsService {
    constructor() {
        this.repository = new SettingsRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(user => this.mapSettingsToDto(user));
    }

    edit(id, dto) {
        const settings = this.mapDtoToSettings(dto);
        return this.repository.edit(id, settings);
    }

    mapSettingsToDto(item) {
        return item ? {
              themeName: item.themeName,
        } : {};
    }

    mapDtoToSettings(dto) {
        return dto ? {
            themeName: dto.themeName,
        } : {};
    }
}
module.exports = SettingsService;