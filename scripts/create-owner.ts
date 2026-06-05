import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password) {
    console.error("Укажите ADMIN_EMAIL и ADMIN_PASSWORD перед запуском:");
    console.error(
      "  PowerShell: $env:ADMIN_EMAIL='x'; $env:ADMIN_PASSWORD='y'; npm run create-owner",
    );
    process.exit(1);
  }

  if (!connectionString) {
    console.error("DATABASE_URL не найден в .env");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await db.adminUser.upsert({
      where: { email },
      create: { email, passwordHash: hash, name: "Owner", role: "OWNER" },
      update: { passwordHash: hash },
    });
    console.log(`✓ Owner создан/обновлён: ${user.email} (id: ${user.id})`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
