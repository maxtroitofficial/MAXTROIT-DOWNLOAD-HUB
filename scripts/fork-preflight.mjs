#!/usr/bin/env node
/**
 * Fork deployment preflight.
 * Run from the repository root before any Firebase deployment:
 *   node scripts/fork-preflight.mjs
 *
 * This is a guardrail, not proof of Firebase project ownership.
 */
import fs from "node:fs";

const fail = (message) => {
  console.error(`[BLOCKED] ${message}`);
  process.exitCode = 1;
};
const read = (path) => {
  try { return fs.readFileSync(path, "utf8"); }
  catch { fail(`Required file missing or unreadable: ${path}`); return ""; }
};

const config = read("firebase-config.js");
const firestore = read("firestore.rules");
const storage = read("storage.rules");
const firebaseJsonText = read("firebase.json");
const firebasercText = read(".firebaserc");

let firebaseJson = {}, firebaserc = {};
try { firebaseJson = JSON.parse(firebaseJsonText); }
catch { fail("firebase.json is not valid JSON."); }
try { firebaserc = JSON.parse(firebasercText); }
catch { fail(".firebaserc is missing or invalid JSON. Run firebase use --add for your own project."); }

const match = (text, regex) => text.match(regex)?.[1] ?? "";
const projectId = match(config, /projectId\\s*:\\s*["']([^"']+)["']/);
const adminUid = match(config, /window\\.ADMIN_UID\\s*=\\s*["']([^"']+)["']/);
const firestoreUid = match(firestore, /request\\.auth\\.uid\\s*==\\s*["']([^"']+)["']/);
const storageUid = match(storage, /request\\.auth\\.uid\\s*==\\s*["']([^"']+)["']/);
const hostingSite = firebaseJson.hosting?.site;
const cliProject = firebaserc.projects?.default;

if (!projectId || !adminUid || !firestoreUid || !storageUid || !hostingSite || !cliProject) {
  fail("One or more Firebase project, admin UID, Hosting site, or CLI project values are missing.");
}
if (projectId === "maxtroit-download-hub" || cliProject === "maxtroit-download-hub") {
  fail("Configuration still points to the original MAXTROIT Firebase project.");
}
if (hostingSite === "d-hub") {
  fail("Hosting still targets the original d-hub site.");
}
if (adminUid === "5607ISIL0PMq6HLmzhTxyFa2elY2" ||
    firestoreUid === "5607ISIL0PMq6HLmzhTxyFa2elY2" ||
    storageUid === "5607ISIL0PMq6HLmzhTxyFa2elY2") {
  fail("The original MAXTROIT administrator UID is still present.");
}
if (adminUid && firestoreUid && adminUid !== firestoreUid) {
  fail("firebase-config.js ADMIN_UID does not match firestore.rules.");
}
if (adminUid && storageUid && adminUid !== storageUid) {
  fail("firebase-config.js ADMIN_UID does not match storage.rules.");
}
if (projectId && cliProject && projectId !== cliProject) {
  fail("firebase-config.js projectId does not match .firebaserc default project.");
}

if (process.exitCode) {
  console.error("\nDo not run firebase deploy until every blocking issue is fixed.");
} else {
  console.log("[PASS] Basic fork configuration is internally consistent.");
  console.log("Project/site ownership is not verified by this script; confirm both in Firebase Console before deployment.");
}
