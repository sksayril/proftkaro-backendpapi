let mongoose = require('mongoose')

let schema = new mongoose.Schema({
  Title: {
    type: String,
    default: '',
    trim: true
  },
  Body: {
    type: String,
    default: '',
    trim: true
  },
  ImageUrl: {
    type: String,
    default: null,
    trim: true
  },
  ActionLabel: {
    type: String,
    default: '',
    trim: true
  },
  ActionUrl: {
    type: String,
    default: '',
    trim: true
  },
  IsActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

/** Single template row; created only when admin saves an image (no auto-insert). */
schema.statics.getSettings = async function () {
  return this.findOne()
}

module.exports = mongoose.model('popupTemplateSettings', schema)
