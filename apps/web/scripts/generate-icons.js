const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const iconTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#3B82F6"/>
  <path d="M${size/2} ${size*0.2}C${size*0.35} ${size*0.2} ${size*0.24} ${size*0.32} ${size*0.24} ${size*0.47}C${size*0.24} ${size*0.61} ${size/2} ${size*0.79} ${size/2} ${size*0.79}C${size/2} ${size*0.79} ${size*0.76} ${size*0.61} ${size*0.76} ${size*0.47}C${size*0.76} ${size*0.32} ${size*0.65} ${size*0.2} ${size/2} ${size*0.2}Z" fill="white"/>
  <circle cx="${size/2}" cy="${size*0.47}" r="${size*0.1}" fill="#3B82F6"/>
</svg>`

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate SVG icons for each size
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.svg`
  const filepath = path.join(iconsDir, filename)
  fs.writeFileSync(filepath, iconTemplate(size))
  console.log(`Generated ${filename}`)
})

// Also create PNG placeholders (in real app, convert SVG to PNG)
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)
  // In production, you would convert SVG to PNG here
  // For now, we'll create a simple placeholder
  fs.writeFileSync(filepath, '')
  console.log(`Created placeholder for ${filename}`)
})

console.log('\nIcon generation complete!')
console.log('Note: PNG files are placeholders. In production, use a tool like sharp or imagemagick to convert SVG to PNG.')