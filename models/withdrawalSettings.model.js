let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    MinimumWithdrawalAmount: {
        type: Number,
        required: true,
        default: 100,
        min: 1
    },
    DailyWithdrawalRequestLimit: {
        type: Number,
        required: true,
        default: 1,
        enum: [1, 2]
    }
}, {
    timestamps: true
})

// Ensure only one settings document exists
schema.statics.getSettings = async function() {
    let settings = await this.findOne()
    if (!settings) {
        settings = await this.create({
            MinimumWithdrawalAmount: 100,
            DailyWithdrawalRequestLimit: 1
        })
    }

    // backward compatibility for existing settings docs
    if (!settings.DailyWithdrawalRequestLimit || ![1, 2].includes(settings.DailyWithdrawalRequestLimit)) {
        settings.DailyWithdrawalRequestLimit = 1
        await settings.save()
    }
    return settings
}

// Check if model already exists to avoid overwriting
let WithdrawalSettings
try {
    WithdrawalSettings = mongoose.model('withdrawalSettings')
} catch (e) {
    WithdrawalSettings = mongoose.model('withdrawalSettings', schema)
}

module.exports = WithdrawalSettings
