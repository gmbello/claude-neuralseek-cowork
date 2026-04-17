// NeuralSeek Cowork Plugin MCP launcher
// Reads credentials from ~/.neuralseek-cowork.json (or $NEURALSEEK_COWORK_CONFIG)
// and launches @osuna0102/mcp with those values injected as env vars.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const DEFAULT_CONFIG = path.join(os.homedir(), ".neuralseek-cowork.json");
const CONFIG_PATH = process.env.NEURALSEEK_COWORK_CONFIG || DEFAULT_CONFIG;

function log(msg) {
  const NL = String.fromCharCode(10);
  process.stderr.write("[neuralseek-cowork] " + msg + NL);
}

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH) === false) {
    log("No config found at " + CONFIG_PATH + ".");
    log("Run the neuralseek-setup skill in Cowork to create it, or set NS_INSTANCE and NS_API_KEY in your environment.");
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    log("Failed to parse " + CONFIG_PATH + ": " + e.message);
    return {};
  }
}

const cfg = loadConfig();
const env = Object.assign({}, process.env);

const KEYS = ["NS_INSTANCE", "NS_API_KEY", "NS_BASE_URL", "KB_URL", "KB_API_KEY"];
for (const key of KEYS) {
  const val = cfg[key];
  if (val !== null && val !== undefined && String(val).length > 0) {
    env[key] = String(val);
  }
}

if (env.NS_INSTANCE === undefined || env.NS_API_KEY === undefined) {
  log("NS_INSTANCE and/or NS_API_KEY are not set.");
  log("The MCP server will start but most tools will fail until credentials are configured.");
}

const isWin = process.platform === "win32";
const npxCmd = isWin ? "npx.cmd" : "npx";

const child = spawn(npxCmd, ["-y", "@osuna0102/mcp"], {
  stdio: "inherit",
  env: env,
  shell: isWin,
});

child.on("exit", function (code, signal) {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code == null ? 0 : code);
  }
});

child.on("error", function (err) {
  log("Failed to start @osuna0102/mcp: " + err.message);
  process.exit(1);
});

["SIGINT", "SIGTERM", "SIGHUP"].forEach(function (sig) {
  process.on(sig, function () {
    if (child.killed === false) child.kill(sig);
  });
});
