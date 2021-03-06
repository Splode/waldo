<template>
  <div class="col-12 Drawer-fileTree">
    <div class="row">
      <div class="col-12">
        <h1 class="Drawer-title">Notes</h1>
      </div>
      <div class="col-12 Section">
        <ul class="Settings-list">
          <li 
            class="Settings-list-item" 
            v-for="(file, i) in files" 
            @click="selectFile(file)"
            @contextmenu="openContextMenu($event, file, i)"
            :class="{ 'is-active': file === settings.currentDoc }"
            :key="'file-' + i">
            {{ file }}
            <div 
              class="Settings-contextMenu"
              v-if="contextMenu.isOpen && contextMenu.index === i"
              v-on-clickaway="closeContextMenu"
              :style="contextMenu.pos">
              <ul class="Settings-contextMenu-list">
                <li class="Settings-contextMenu-list-item" @click="noteRenameInit(file)">Rename</li>
                <li class="Settings-contextMenu-list-item" @click="noteDeleteInit(file)">Delete</li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import path from 'path'
import fs from 'fs'
import Payload from './../../../utils/payload'
import { EventBus } from './../../../utils/event-bus'
import { mixin as clickaway } from 'vue-clickaway'

export default {
  mixins: [ clickaway ],

  data () {
    return {
      files: [],
      contextMenu: {
        isOpen: false,
        pos: {
          top: 'initial',
          left: 0
        },
        file: '',
        index: ''
      }
    }
  },

  computed: {
    noteDirPath () {
      if (this.settings.userDir) {
        return this.settings.userDir
      } else {
        return path.join(this.$store.getters.userDataPath, this.settings.documentDir)
      }
    },

    settings () {
      return this.$store.getters.settings
    },

    viewState () {
      return this.$store.getters.viewState
    }
  },

  methods: {
    closeContextMenu () {
      this.contextMenu.isOpen = false
    },

    noteDeleteInit (file) {
      const payloadActiveFile = new Payload('activeFile', file)
      const payloadModalToggle = new Payload('modalOpen', true)
      const payloadModalAction = new Payload('modalAction', 'note-delete')
      const payloadModalComp = new Payload('modalComponent', 'appModalDialog')
      this.$store.dispatch('setViewState', payloadActiveFile)
      this.$store.dispatch('setViewState', payloadModalToggle)
      this.$store.dispatch('setViewState', payloadModalAction)
      this.$store.dispatch('setViewState', payloadModalComp)
    },

    noteDelete () {
      const notePath = path.join(this.noteDirPath, this.viewState.activeFile + '.json')
      if (this.viewState.activeFile === this.settings.currentDoc) {
        const payload = new Payload('currentDoc', 'untitled')
        this.$store.dispatch('setSetting', payload)
        EventBus.$emit('current-note-deleted')
      }
      fs.unlink(notePath, err => {
        if (err) {
          console.log(err)
        } else {
          this.readDir()
          this.$forceUpdate()
        }
      })
    },

    noteRenameInit (file) {
      const payloadActiveFile = new Payload('activeFile', file)
      const payloadModalToggle = new Payload('modalOpen', true)
      const payloadModalAction = new Payload('modalAction', 'note-rename')
      const payloadModalComponent = new Payload('modalComponent', 'appModalFilename')
      this.$store.dispatch('setViewState', payloadActiveFile)
      this.$store.dispatch('setViewState', payloadModalToggle)
      this.$store.dispatch('setViewState', payloadModalAction)
      this.$store.dispatch('setViewState', payloadModalComponent)
    },

    noteRename (oldName, newName, cb) {
      const oldPath = path.join(this.noteDirPath, oldName + '.json')
      const newPath = path.join(this.noteDirPath, newName + '.json')
      const payload = new Payload('currentDoc', newName)
      this.$store.dispatch('setSetting', payload)
      fs.rename(oldPath, newPath, err => {
        if (err) {
          return err
        } else {
          this.readDir()
          this.$forceUpdate()
        }
      })
    },

    openContextMenu (e, file, i) {
      console.log(e)
      this.contextMenu.isOpen = true
      this.contextMenu.pos.top = e.offsetY + 'px'
      this.contextMenu.pos.left = e.offsetX + 'px'
      this.contextMenu.file = file
      this.contextMenu.index = i
    },

    readDir () {
      const files = fs.readdirSync(this.noteDirPath)
      const prettyFiles = files.map(file => this.removeFileExt(file))
      this.files = prettyFiles
      console.log('read dir')
    },

    removeFileExt (file) {
      return file.replace(/\.[^/.]+$/, '')
    },

    selectFile (file) {
      if (!this.contextMenu.isOpen) {
        const fileNoExt = this.removeFileExt(file)
        const payloadDoc = new Payload('currentDoc', fileNoExt)
        const payloadDrawer = new Payload('drawerOpen', false)
        this.$store.dispatch('setSetting', payloadDoc)
        this.$store.dispatch('setViewState', payloadDrawer)
        EventBus.$emit('loadDoc', fileNoExt)
      }
    }
  },

  created () {
    this.readDir()
    EventBus.$on('note-renamed', payload => {
      this.closeContextMenu()
      this.noteRename(payload.oldName, payload.newName)
    })
    EventBus.$on('note-delete-confirmed', () => {
      this.noteDelete()
    })
  }
}
</script>

<style lang="scss">
.Settings-contextMenu {
  border-radius: 3px;
  position: absolute;
  z-index: 10;
}

.Settings-contextMenu-list {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

.Settings-contextMenu-list-item {
  margin: 0;
  padding: .25em 1em;
  transition: all .3s ease;
}
</style>
