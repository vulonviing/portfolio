import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(projectRoot, "..", "..", "epoch");
const manifest = JSON.parse(await readFile(join(projectRoot, "src", "route-manifest.json"), "utf8"));
const shell = await readFile(join(outputRoot, "index.html"), "utf8");

for (const slug of Object.values(manifest.usecases)) {
  for (const path of manifest.paths) {
    const target = join(outputRoot, slug, path, "index.html");
    await mkdir(dirname(target), { recursive: true });
    const canonical = `https://emrecanulu.com/epoch/${slug}/${path}/`;
    await writeFile(target, shell.replace("https://emrecanulu.com/epoch/", canonical));
  }
}

for (const slug of Object.values(manifest.usecases)) {
  const target = join(outputRoot, slug, "index.html");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(outputRoot, slug, "registry", "index.html"), target);
}
