const fs = require('fs')
const archiver = require('archiver')

// Zip each built extension (dist/<browser>) with manifest.json at the archive root
const { version } = JSON.parse(fs.readFileSync('manifest.base.json', 'utf8'))

for (const browser of ['chrome', 'firefox']) {
  const zipPath = `dist/doctonote-${browser}-${version}.zip`
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.on('error', error => { throw error })
  archive.pipe(fs.createWriteStream(zipPath))
  archive.directory(`dist/${browser}/`, false)
  archive.finalize().then(() => console.log(`🗜️  Packed ${zipPath}`))
}
