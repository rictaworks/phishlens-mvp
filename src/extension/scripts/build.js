const esbuild = require("esbuild");
const path = require("path");

const ENTRY_POINTS = ["background", "content"];

async function build() {
  for (const entry of ENTRY_POINTS) {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "..", "src", entry + ".ts")],
      outfile: path.join(__dirname, "..", "dist", entry + ".js"),
      bundle: true,
      format: "iife",
      platform: "browser",
      target: "chrome96",
      loader: { ".json": "json" },
      logLevel: "info",
    });
  }
  process.stdout.write("esbuild: background.js/content.jsをdist/へバンドルしました\n");
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
