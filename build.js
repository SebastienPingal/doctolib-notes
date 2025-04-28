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

// Build function
function build() {
  // Create dist directories
  ensureDir('dist/chrome')
  ensureDir('dist/firefox')

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

  // Copy browser-specific manifests
  copyFile('manifest.chrome.json', 'dist/chrome/manifest.json')
  copyFile('manifest.firefox.json', 'dist/firefox/manifest.json')

  console.log('✨ Build completed!')
  console.log('📦 Chrome extension is in: dist/chrome')
  console.log('🦊 Firefox extension is in: dist/firefox')
}

build() 