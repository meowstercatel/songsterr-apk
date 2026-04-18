import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function patchFunction(apkPath, file, functionName, value) {
  try {
    const folderName = `${path.parse(apkPath).name}_decompile_xml`;
    const filePath = path.join(folderName, "smali", file);

    const content = await readFile(filePath, { encoding: "utf8" });
    const lines = content.split("\n");

    const startIndex = lines.findIndex(
      (line) => line.includes(`.method`) && line.includes(`${functionName}(`),
    );

    if (startIndex === -1) {
      console.error(`Could not find method: ${functionName} in ${file}`);
      return;
    }

    const endIndex = lines.findIndex(
      (line, index) => index > startIndex && line.trim() === ".end method",
    );

    if (endIndex === -1) {
      console.error(`Could not find end of method: ${functionName}`);
      return;
    }

    const patchValue = value ? "0x1" : "0x0";
    const patchedBody = [
      "    .locals 1",
      `    const/4 v0, ${patchValue}`,
      "    return v0",
    ];

    const bodyLength = endIndex - (startIndex + 1);
    lines.splice(startIndex + 1, bodyLength, ...patchedBody);

    await writeFile(filePath, lines.join("\n"), { encoding: "utf8" });
    console.log(`Successfully patched ${functionName} in ${file}`);
  } catch (error) {
    console.error(`Error patching file: ${error.message}`);
  }
}
