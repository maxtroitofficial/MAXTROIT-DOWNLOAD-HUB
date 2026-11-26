#!/usr/bin/env node
/**
 * Fork deployment preflight. Run before firebase deploy:
 *   node scripts/fork-preflight.mjs
 * This is a guardrail, not proof of Firebase project ownership.
 */
import fs from "node:fs";

let blocked = false;
function fail(message) {
  console.error("[BLOCKED] " + message);
  blocked = true;
}
function read(path) {
  try { return fs.readFileSync(path, "utf8"); }
  catch { fail("Required file missing or unreadable: " + path); return ""; }
}
function capture(text, regex) {
  const result = text.match(regex);
  return result ? result[1] : "";
}

const config = read("firebase-config.js");
const firestore = read("firestore.rules");
const storage = read("storage.rules");
const firebaseJsonText = read("firebase.json");
const firebasercText = read(".firebaserc");

let firebaseJson = {};
let firebaserc = {};
try { firebaseJson = JSON.parse(firebaseJsonText); }
catch { fail("firebase.json is not valid JSON."); }
try { firebaserc = JSON.parse(firebasercText); }
catch { fail(".firebaserc is missing or invalid. Run firebase use --add for your own project."); }

const projectId = capture(config, /projectId\s*:\s*["']([^"']+)["']/);
const adminUid = capture(config, /window\.ADMIN_UID\s*=\s*["']([^"']+)["']/);
const firestoreUid = capture(firestore, /request\.auth\.uid\s*==\s*["']([^"']+)["']/);
const storageUid = capture(storage, /request\.auth\.uid\s*==\s*["']([^"']+)["']/);
const hostingSite = firebaseJson.hosting && firebaseJson.hosting.site;
const cliProject = firebaserc.projects && firebaserc.projects.default;

if (!projectId || !adminUid || !firestoreUid || !storageUid || !hostingSite || !cliProject) {
  fail("A Firebase project, admin UID, Hosting site, or CLI project value is missing.");
}
if (projectId === "maxtroit-download-hub" || cliProject === "maxtroit-download-hub") {
  fail("Configuration still points to the original MAXTROIT Firebase project.");
}
if (hostingSite === "d-hub") fail("Hosting still targets the original d-hub site.");
const originalUid = "5607ISIL0PMq6HLmzhTxyFa2elY2";
if (adminUid === originalUid || firestoreUid === originalUid || storageUid === originalUid) {
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

if (blocked) {
  console.error("\nDo not run firebase deploy until every blocking issue is fixed.");
  process.exitCode = 1;
} else {
  console.log("[PASS] Basic fork configuration is internally consistent.");
  console.log("Confirm project and Hosting site ownership in Firebase Console; this script cannot verify ownership.");
}
