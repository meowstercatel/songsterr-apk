import { readdir } from "fs/promises";
import { join } from "path";
import { spawn } from "child_process";

export async function loadJars() {
  const jarDir = "jars";
  const files = await readdir(jarDir);

  const jarMap = {
    APKEditor: "APKEditor",
    UberApkSigner: "uber-apk-signer",
  };

  const paths = {};

  for (const [key, searchString] of Object.entries(jarMap)) {
    const found = files.find((f) => f.includes(searchString));

    if (!found) {
      console.error(`${searchString} not found!`);
      process.exit(1);
    }

    paths[key] = join(jarDir, found);
  }

  return paths;
}

export async function execute(cmd) {
  return new Promise((resolve, reject) => {
    const unpack = spawn(cmd, {
      shell: true,
    });
    unpack.stdout.pipe(process.stdout);
    unpack.stderr.pipe(process.stderr);

    unpack.on("error", (err) => {
      reject(err);
    });

    unpack.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}
