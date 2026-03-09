const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const dishes = [
    {
      name: "Classic Maggi",
      description: "Hot comfort bowl of classic Maggi",
      price: 49,
      category: "Maggi",
      isAvailable: true,
    },
    {
      name: "Butter Cheese Maggi",
      description: "Creamy butter cheese Maggi",
      price: 69,
      category: "Maggi",
      isAvailable: true,
    },
    {
      name: "Veg Loaded Maggi",
      description: "Maggi with fresh vegetables",
      price: 79,
      category: "Maggi",
      isAvailable: true,
    },
    {
      name: "Schezwan Maggi",
      description: "Spicy schezwan style Maggi",
      price: 79,
      category: "Maggi",
      isAvailable: true,
    },
  ];

  console.log("Seeding default RG Bowl dishes...");

  await prisma.dish.createMany({
    data: dishes,
    skipDuplicates: true,
  });

  console.log("✅ Dish seeding completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Error while seeding dishes:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

