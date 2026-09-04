import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "ref", "star-aligned-journey-main", "src", "assets");
const OUT_DIR = path.join(ROOT, "public", "lovable-assets");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const BASE_URL = "https://id-preview--26248b32-9ae7-49bf-be88-60303d1ddfe3.lovable.app";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkAssetJson(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkAssetJson(full)));
    } else if (entry.name.endsWith(".asset.json")) {
      files.push(full);
    }
  }

  return files;
}

function localRelativePath(meta) {
  const filename = meta.original_filename || path.basename(meta.url || "asset.bin");
  const assetId = meta.asset_id;

  if (assetId && filename) {
    return path.posix.join(assetId, filename);
  }

  return filename;
}

async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error("Empty response body");
  }

  await mkdir(path.dirname(destPath), { recursive: true });
  const nodeStream = Readable.fromWeb(response.body);
  await pipeline(nodeStream, createWriteStream(destPath));
}

async function main() {
  if (!(await exists(ASSETS_DIR))) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const manifest = (await exists(MANIFEST_PATH))
    ? JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
    : {};

  const assetFiles = await walkAssetJson(ASSETS_DIR);
  console.log(`Found ${assetFiles.length} .asset.json file(s)`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const jsonPath of assetFiles) {
    let meta;
    try {
      meta = JSON.parse(await readFile(jsonPath, "utf8"));
    } catch (error) {
      failed += 1;
      console.error(`Failed to parse ${jsonPath}:`, error.message);
      continue;
    }

    const assetId = meta.asset_id;
    const urlPath = meta.url;
    if (!assetId || !urlPath) {
      failed += 1;
      console.error(`Missing asset_id/url in ${jsonPath}`);
      continue;
    }

    const rel = localRelativePath(meta);
    const destPath = path.join(OUT_DIR, ...rel.split("/"));
    const publicPath = `/lovable-assets/${rel}`;

    if (await exists(destPath)) {
      skipped += 1;
      manifest[assetId] = publicPath;
      console.log(`skip  ${rel}`);
      continue;
    }

    const remoteUrl = new URL(urlPath, BASE_URL).toString();

    try {
      await downloadFile(remoteUrl, destPath);
      downloaded += 1;
      manifest[assetId] = publicPath;
      console.log(`ok    ${rel}`);
    } catch (error) {
      failed += 1;
      console.error(`fail  ${rel} ← ${remoteUrl}`);
      console.error(`      ${error.message}`);
    }
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`Done. downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
