import { exec, spawn } from "node:child_process";
import util from "node:util";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { readFile, unlink, writeFile, rename } from "node:fs/promises";
import { patchFunction } from "./modifySmali.js";
import path from "node:path";
import { loadJars } from "./utils.js";
import { execute } from "./utils.js";

let APKPath = process.argv[2];
if (!APKPath) {
  console.log("Usage: node index.js <APK path>");
  process.exit(1);
}
const { APKEditor, UberApkSigner } = await loadJars();

if (APKPath.endsWith(".apkm")) {
  try {
    await execute(`java -jar "${APKEditor}" m -i "${APKPath}"`);
    console.log("Merge successful!");
    APKPath = `${path.parse(APKPath).name}_merged.apk`;
  } catch (error) {
    console.error("Merge failed:", error.message);
  }
}

try {
  await execute(`java -jar "${APKEditor}" d -i "${APKPath}"`);
  console.log("Unpack successful!");
} catch (error) {
  console.error("Unpack failed:", error.message);
}

//crack check
await patchFunction(
  APKPath,
  "classes/com/songsterr/CrackChecker.smali",
  "a",
  false,
);

//subscription checks
await patchFunction(APKPath, "classes/com/songsterr/iap/K.smali", "f", true);
await patchFunction(APKPath, "classes/com/songsterr/iap/K.smali", "g", true);
await patchFunction(APKPath, "classes/com/songsterr/iap/K.smali", "h", true);
await patchFunction(APKPath, "classes/com/songsterr/iap/K.smali", "i", true);
try {
  await execute(
    `java -jar "${APKEditor}" b -i "${path.parse(APKPath).name}_decompile_xml"`,
  );
  console.log("Build successful!");
} catch (error) {
  console.error("Build failed:", error.message);
}

try {
  await execute(
    `java -jar "${UberApkSigner}" --apks "${path.parse(APKPath).name}_decompile_xml_out.apk"`,
  );
  console.log("Signing successful!");
} catch (error) {
  console.error("Signing failed:", error.message);
}

if (APKPath.endsWith("merged.apk")) {
  await rm(`${path.parse(APKPath).name}.apk`);
}
await rm(`${path.parse(APKPath).name}_decompile_xml`, {
  recursive: true,
  force: true,
});
await rm(`${path.parse(APKPath).name}_decompile_xml_out.apk`);
await rm(
  `${path.parse(APKPath).name}_decompile_xml_out-aligned-debugSigned.apk.idsig`,
);
await rename(
  `${path.parse(APKPath).name}_decompile_xml_out-aligned-debugSigned.apk`,
  `${path.parse(APKPath).name}_patched.apk`,
);
