/**
 * One-off script: hash a password and update a user by email.
 * Run from project root: node scripts/fix-user-password.mjs <email> <newPassword>
 * Loads .env.local if present so DATABASE_URL is set.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local from project root so DATABASE_URL is available
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("Usage: node scripts/fix-user-password.mjs <email> <newPassword>");
  console.error("Example: node scripts/fix-user-password.mjs admin@example.com myNewPassword");
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error("Error: newPassword must be at least 6 characters.");
  process.exit(1);
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = (await import("bcryptjs")).default;

  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    console.error("No user found with email:", email);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  console.log("Password updated for", user.email, "- you can log in with the new password.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
