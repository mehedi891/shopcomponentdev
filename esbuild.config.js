import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";
const envObj = {
  VITE_SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "",
  VITE_DATA_API : process.env.DATA_API || "",
};

const config = {
  entryPoints: ["app/spc-front-react/entryPoints/index.jsx"],
  bundle: true,
  outfile: "public/shopcomponent/js/spceflmain.js",
  format: "esm",
  platform: "browser",
  minify: isDev ? false : true,
  sourcemap: false,
    define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "import.meta.env": JSON.stringify(envObj),
  },
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
