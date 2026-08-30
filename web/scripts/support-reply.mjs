/**
 * Publishes a developer reply to a VALSYNC support ticket.
 *
 *   npm run reply -- vs-1a2b3c4d5e6f708192a3b4c5 "Fixed in 1.7.1 — thanks for the screenshot." fixed
 *
 * Writes support/<ticket-id>.json at the repo root. The app polls exactly that path for the
 * ticket ids it minted (SupportReplyClient.BASE_URL = https://valsync.surge.sh/support), so the
 * filename has to match the id in the report email's subject line byte for byte.
 *
 * Nothing is live until the site is deployed — see the reminder this prints.
 *
 * The validation here is the point of the script: a typo'd ticket id produces a file the app
 * will never ask for, and there is no error anywhere to tell you. It just looks like you never
 * replied. So the id is checked against the same pattern the client uses.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SUPPORT_DIR = join(ROOT, "support");

/** Must stay identical to SupportReplyClient.TICKET_ID in the Android app. */
const TICKET_ID = /^vs-[0-9a-f]{24}$/;

/** Mirrors SupportReplyStatus.fromWire; anything else degrades to REPLIED in the app. */
const STATUSES = [
  "fixed", "done", "released",
  "planned", "queued", "accepted",
  "wontfix", "wont_fix", "declined", "rejected",
  "need_info", "needinfo", "question",
  "info",
];

const [, , ticketArg, messageArg, statusArg] = process.argv;

function die(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  console.error("  usage: npm run reply -- <ticket-id> \"<message>\" [status]");
  console.error(`  status: ${STATUSES.join(", ")}\n`);
  process.exit(1);
}

const ticket = (ticketArg ?? "").trim();
const message = (messageArg ?? "").trim();
const status = (statusArg ?? "info").trim().toLowerCase();

if (!ticket) die("no ticket id given");
if (!TICKET_ID.test(ticket)) {
  die(
    `"${ticket}" is not a valid ticket id.\n` +
    "    Expected vs- followed by 24 hex characters, copied from the [brackets]\n" +
    "    in the report email's subject line."
  );
}
if (!message) die("no message given — a reply with no text is not shown to the user");
if (!STATUSES.includes(status)) {
  die(`"${status}" is not a known status. The app would show it as REPLIED.`);
}

// Privacy guard: these files are public to anyone holding the (unguessable) ticket id.
// Unlisted is not private — flag anything that smells like personal data before it ships.
const RISKY = [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/, /#\d{3,5}\b/];
const flagged = RISKY.filter((r) => r.test(message));
if (flagged.length) {
  console.warn(
    "\n  ! This reply looks like it contains an email address or a Riot ID.\n" +
    "    These files are readable by anyone with the ticket link — treat them as\n" +
    "    unlisted, not private. Reply by email instead if it is personal.\n"
  );
}

mkdirSync(SUPPORT_DIR, { recursive: true });
const file = join(SUPPORT_DIR, `${ticket}.json`);
const existed = existsSync(file);
if (existed) {
  const prev = JSON.parse(readFileSync(file, "utf8"));
  console.warn(`\n  ! Overwriting an existing reply:\n    "${prev.message}"\n`);
}

writeFileSync(file, JSON.stringify({ message, status }, null, 2) + "\n", "utf8");

console.log(`\n  ✓ ${existed ? "Updated" : "Wrote"} support/${ticket}.json`);
console.log(`    status:  ${status}`);
console.log(`    message: ${message}`);
console.log("\n  Not live yet — deploy the site to publish it.");
console.log("  The app rechecks every 6h, and immediately when the user opens My Reports.\n");
