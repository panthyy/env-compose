import { parseArgs } from "node:util";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import spawn from "cross-spawn";

export const parseEnvFile = async (envFilePath: string) => {
  if (!existsSync(envFilePath)) {
    throw new Error(`File ${envFilePath} not found`);
  }

  const content = await fs.readFile(envFilePath, "utf-8");

  const env = content.split("\n").reduce((acc, line) => {
    const [key, value] = line.split("=");
    return { ...acc, [key]: value };
  }, {}) as Record<string, string>;

  return env;
};

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  strict: true,
  allowPositionals: true,
});

const envFilePath = positionals[0];
if (!envFilePath) {
  throw new Error("Missing env file path argument, e.g \n $ env-compose .env.remote");
}

const cache = new Map<string, Record<string, string>>();

const resolveReference = async (refrence: string) => {
  const matches = refrence.match(/\$([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
  if (!matches) {
    throw new Error(`Invalid reference ${refrence}`);
  }

  const [_, envName, key] = matches;

  const cacheMatch = cache.get(envName);
  if (cacheMatch) {
    return cacheMatch[key];
  }

  const envFilePath = process.cwd() + path.sep + ".env." + envName;
  const env = await parseEnvFile(envFilePath);
  cache.set(envName, env);
  return env[key];
};

const isReference = (value: string) => value.startsWith("$");

const local = await parseEnvFile(process.cwd() + path.sep + envFilePath);

for (const [key, value] of Object.entries(local)) {
  if (isReference(value)) {
    local[key] = await resolveReference(value);
  }
}

let envs = "";
for (const [key, value] of Object.entries(local)) {
  envs += `${key}=${value}; `;
}
const command = envs + positionals.slice(1).join(" ");
spawn("sh", ["-c", command], {
  stdio: "inherit",
});
