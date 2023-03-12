const db = require('./db')
const AutoLaunch = require('auto-launch')
const clipboardManagerElectron = new AutoLaunch({
  name: 'Clipboard Manager',
  isHidden: true
})

function toggle() {
  clipboardManagerElectron
    .isEnabled()
    .then(isEnabled => {
      db.set('autoLaunch', !isEnabled).write()

      if (isEnabled) {
        clipboardManagerElectron.disable()
      } else {
        clipboardManagerElectron.enable()
      }
    })
    .catch(() => {})
}

function isEnabled() {
  return db.get('autoLaunch').value()
}

module.exports = { toggle, isEnabled }
