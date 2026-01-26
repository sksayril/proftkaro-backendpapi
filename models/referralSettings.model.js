let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    RewardForNewUser: {
        type: Number,
        default: 0,
        require: true
    },
    RewardForReferrer: {
        type: Number,
        default: 0,
        require: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    }
})

// Check if model already exists to avoid overwriting
let ReferralSettings
try {
    ReferralSettings = mongoose.model('referralSettings')
} catch (e) {
    ReferralSettings = mongoose.model('referralSettings', schema)
}

module.exports = ReferralSettings
