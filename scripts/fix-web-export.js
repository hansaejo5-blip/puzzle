const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Exported index.html not found: ${indexPath}`);
}

const html = fs.readFileSync(indexPath, "utf8");
const fixed = html.replace(/<script src="([^"]+)" defer><\/script>/, '<script type="module" src="$1" defer></script>');

if (html === fixed) {
  throw new Error("Expected Expo web export script tag was not found in dist/index.html");
}

fs.writeFileSync(indexPath, fixed);
console.log(`Patched ${indexPath} to load the web bundle as an ES module.`);
