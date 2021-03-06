const electron = require('electron')
const fs = require('fs')
const path = require('path')

export default class {
  constructor (opts) {
    this.userDataPath = (electron.app || electron.remote.app).getPath('userData')

    this.dir = path.join(this.userDataPath, opts.dirName)

    if (opts.userDir) {
      console.log(opts.userDir)
      this.path = path.join(opts.userDir, opts.configName + '.json')
    } else {
      this.path = path.join(this.userDataPath, opts.dirName, opts.configName + '.json')
    }

    this.data = this.parseDataFile(this.path, opts.defaults)
  }

  makeDir () {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, err => console.log(err))
    }
  }

  get (key) {
    return this.data[key]
  }

  set (key, val) {
    this.data[key] = val
    this.makeDir()
    fs.writeFileSync(this.path, JSON.stringify(this.data))
    console.log(`Saved ${this.path}`)
  }

  parseDataFile (filePath, defaults) {
    try {
      return JSON.parse(fs.readFileSync(filePath))
    } catch (err) {
      return defaults
    }
  }
}
