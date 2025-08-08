const express = require('express');
const router = express.Router();
const SettingService = require('./settingsService');
const settingService = new SettingService();
router.get('/current', (req, res) => {
    settingService
        .findById(req.user.id)
        .then(user => res.send(user));
});

router.put('/current', (req, res) => {
    settingService
        .edit(req.user.id, req.body)
        .then(user => res.send(user));
});
module.exports = router;