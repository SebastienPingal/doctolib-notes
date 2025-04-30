const fs = require('fs')
const path = require('path')

// Function to copy files
function copyFile(src, dest) {
  fs.copyFileSync(src, dest)
  console.log(`📦 Copied ${src} to ${dest}`)
}

// Function to create directory if it doesn't exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
}

// Function to merge manifests
function mergeManifests(baseManifest, browserManifest) {
  return {
    ...baseManifest,
    ...browserManifest,
    // Merge arrays if they exist in both manifests
    permissions: [...new Set([...(baseManifest.permissions || []), ...(browserManifest.permissions || [])])],
    content_scripts: browserManifest.content_scripts || baseManifest.content_scripts
  }
}

// Build function
function build() {
  // Create dist directories
  ensureDir('dist/chrome')
  ensureDir('dist/firefox')

  // Read manifests
  const baseManifest = JSON.parse(fs.readFileSync('manifest.base.json', 'utf8'))
  const chromeManifest = JSON.parse(fs.readFileSync('manifest.chrome.json', 'utf8'))
  const firefoxManifest = JSON.parse(fs.readFileSync('manifest.firefox.json', 'utf8'))

  // Merge manifests
  const mergedChromeManifest = mergeManifests(baseManifest, chromeManifest)
  const mergedFirefoxManifest = mergeManifests(baseManifest, firefoxManifest)

  // Write merged manifests
  fs.writeFileSync('dist/chrome/manifest.json', JSON.stringify(mergedChromeManifest, null, 2))
  fs.writeFileSync('dist/firefox/manifest.json', JSON.stringify(mergedFirefoxManifest, null, 2))
  console.log('📄 Created merged manifests')

  // Copy common files
  const commonFiles = [
    'content.js',
    'config.js',
    'popup.html',
    'popup.js',
    'styles.css',
    'icons'
  ]

  // Copy files to both dist directories
  commonFiles.forEach(file => {
    if (file === 'icons') {
      ensureDir('dist/chrome/icons')
      ensureDir('dist/firefox/icons')
      fs.readdirSync('icons').forEach(icon => {
        copyFile(`icons/${icon}`, `dist/chrome/icons/${icon}`)
        copyFile(`icons/${icon}`, `dist/firefox/icons/${icon}`)
      })
    } else {
      copyFile(file, `dist/chrome/${file}`)
      copyFile(file, `dist/firefox/${file}`)
    }
  })

  console.log('✨ Build completed!')
  console.log('📦 Chrome extension is in: dist/chrome')
  console.log('🦊 Firefox extension is in: dist/firefox')
}

build() 