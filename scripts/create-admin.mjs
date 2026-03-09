/**
 * One-off script: create a new admin user (for copied/setup projects only).
 * Run from project root: node scripts/create-admin.mjs <email> <password>
 * Loads .env.local if present so DATABASE_URL is set.
 * Does not modify existing users; exits with error if email already exists.
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
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  console.error("Example: node scripts/create-admin.mjs admin@example.com myPassword");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Error: password must be at least 6 characters.");
  process.exit(1);
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = (await import("bcryptjs")).default;

  const prisma = new PrismaClient();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    console.error("Error: A user with this email already exists. Use a different email or the fix-password script to update that user.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: normalizedEmail,
      password: hashedPassword,
      phone: "0000000000",
      role: "ADMIN",
    },
  });

  console.log("Admin user created for", normalizedEmail, "- you can log in with this email and password.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
