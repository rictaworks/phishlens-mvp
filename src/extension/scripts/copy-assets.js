const fs = require('fs');
const path = require('path');

const FONT_AWESOME_ROOT = path.join(__dirname, '..', 'node_modules', '@fortawesome', 'fontawesome-free');
const DEST_ROOT = path.join(__dirname, '..', 'dist', 'vendor', 'fontawesome');

function copyRecursive(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

copyRecursive(path.join(FONT_AWESOME_ROOT, 'css'), path.join(DEST_ROOT, 'css'));
copyRecursive(path.join(FONT_AWESOME_ROOT, 'webfonts'), path.join(DEST_ROOT, 'webfonts'));

process.stdout.write('Font Awesomeアセットをdist/vendor/fontawesomeへコピーしました\n');
