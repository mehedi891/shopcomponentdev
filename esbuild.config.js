import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";

const config = {
  entryPoints: ["app/spc-front-react/entryPoints/index.jsx"],
  bundle: true,
  outfile: "public/shopcomponent/js/spceflmain.js",
  format: "esm",
  platform: "browser",
  minify: false,
  sourcemap: false,
  loader: {
    ".js": "jsx",
    // ".svg": "asset",
    // ".png": "asset",
  },
  resolveExtensions: [".js", ".jsx", ".ts", ".tsx",".svg",".png"],
  alias: {
    "@extensionReact": path.resolve(__dirname, "app/extensionReact"),
  },
};

async function build() {
  if (isDev) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log("Watching for file changes...");
  } else {
    await esbuild.build(config);
    console.log("Build completed.");
  }
}

build().catch(() => process.exit(1));
