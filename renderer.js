/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const app = new Vue({
  el: '#app',
  data() {
    return {
      copied: [],
      index: 0
    }
  },
  created() {
    window.bridge.setCopied((event, { copied, length }) => {
      this.copied = copied
    })
    document.addEventListener('keyup', event => {
      const keyCode = event.keyCode
      switch (keyCode) {
        case 38:
          if (this.index > 0) {
            this.index = this.index - 1
          }
          break

        case 40:
          if (this.index < this.listCopied.length - 1) {
            this.index = this.index + 1
          }
          break

        case 13:
          window.bridge.setClipboard(this.listCopied[this.index])
          this.index = 0
          break
      }
    })
  },
  mounted() {
    window.bridge.initCopied()
  },
  computed: {
    list() {
      return this.copied.filter(el => !el.pin)
    },
    listPin() {
      return this.copied.filter(el => el.pin)
    },
    listCopied() {
      return [...this.listPin, ...this.list]
    }
  },
  methods: {
    handleHover(index) {
      this.index = index
    },
    remove(id) {
      const index = this.copied.findIndex(el => el.id == id)
      if (index != -1) {
        const item = this.copied[index]
        this.copied = [...this.copied.slice(0, index), ...this.copied.slice(index + 1)]
        // this.updateCopied()
        window.bridge.removeCopied(item)
      }
    },
    setClipboard(item) {
      window.bridge.setClipboard(item)
    },
    togglePin(id, toggle = true) {
      const index = this.copied.findIndex(el => el.id == id)
      if (index != -1) {
        const item = this.copied[index]
        this.copied = [
          ...this.copied.slice(0, index),
          {
            ...item,
            pin: toggle
          },
          ...this.copied.slice(index + 1)
        ]
        window.bridge.updateCopied({
          ...item,
          pin: toggle
        })
      }
    },
    destroy() {
      this.copied = []
      window.bridge.clearCopied()
    }
  }
})
