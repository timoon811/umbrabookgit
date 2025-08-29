import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // Создаем администратора
  const adminPassword = await bcrypt.hash("umbra2024", 10);
  const admin = await prisma.users.upsert({
    where: { email: "admin@umbra-platform.dev" },
    update: {},
    create: {
      email: "admin@umbra-platform.dev",
      name: "Umbra Platform Admin",
      password: adminPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log("✅ Администратор готов:", admin.email);

  // Создаем пользователя
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.users.upsert({
    where: { email: "user@umbra-platform.dev" },
    update: {},
    create: {
      email: "user@umbra-platform.dev",
      name: "Regular User",
      password: userPassword,
      role: "USER",
      status: "APPROVED",
    },
  });
  console.log("✅ Пользователь готов:", user.email);

  // Создаем модератора
  const moderatorPassword = await bcrypt.hash("moderator123", 10);
  const moderator = await prisma.users.upsert({
    where: { email: "moderator@umbra-platform.dev" },
    update: {},
    create: {
      email: "moderator@umbra-platform.dev",
      name: "Moderator",
      password: moderatorPassword,
      role: "MODERATOR",
      status: "APPROVED",
    },
  });
  console.log("✅ Модератор готов:", moderator.email);

  // Создаем тестовые курсы
  const courses = [
    {
      title: "Основы Umbra Platform",
      description: "Базовый курс по работе с платформой",
      slug: "umbra-basics",
      isPublished: true,
    },
    {
      title: "Продвинутые функции",
      description: "Изучение продвинутых возможностей платформы",
      slug: "advanced-features",
      isPublished: true,
    },
    {
      title: "API интеграции",
      description: "Работа с API и интеграциями",
      slug: "api-integrations",
      isPublished: false,
    },
  ];

  for (const course of courses) {
    await prisma.courses.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
    console.log(`✅ Курс готов: ${course.title}`);
  }

  // Создаем тестовые финансовые счета
  const accounts = [
    {
      name: "Основной счет",
      type: "BANK",
      currency: "USD",
      balance: 150000.00,
    },
    {
      name: "Наличные",
      type: "CASH",
      currency: "USD",
      balance: 25000.00,
    },
    {
      name: "Долларовый счет",
      type: "BANK",
      currency: "USD",
      balance: 5000.00,
    },
    {
      name: "MetaMask Wallet",
      type: "CRYPTO_WALLET",
      currency: "USD",
      balance: 2500.00,
      cryptocurrencies: ["ETH", "MATIC", "LINK"],
    },
    {
      name: "Binance Exchange",
      type: "CRYPTO_EXCHANGE",
      currency: "USD",
      balance: 15000.00,
      cryptocurrencies: ["BTC", "ETH", "BNB", "SOL", "ADA"],
    },
    {
      name: "Trust Wallet",
      type: "CRYPTO_WALLET",
      currency: "USD",
      balance: 800.00,
      cryptocurrencies: ["BTC", "ETH", "XRP", "DOGE"],
    },
  ];

  for (const account of accounts) {
    const accountData = {
      ...account,
      cryptocurrencies: account.cryptocurrencies ? JSON.stringify(account.cryptocurrencies) : null,
    };

    await prisma.finance_accounts.create({
      data: accountData,
    });
    console.log(`✅ Финансовый счет создан: ${account.name}`);
  }

  // Создаем тестовые финансовые проекты
  const financeProjects = [
    {
      name: "Проект разработки Umbra Platform",
      description: "Основной проект разработки платформы Umbra",
      status: "ACTIVE",
      budget: 50000.00,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
    {
      name: "Маркетинговая кампания",
      description: "Продвижение платформы на рынке",
      status: "ACTIVE",
      budget: 25000.00,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-09-30"),
    },
    {
      name: "Интеграция с API",
      description: "Разработка API интеграций для партнеров",
      status: "COMPLETED",
      budget: 15000.00,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-06-30"),
    },
    {
      name: "Мобильное приложение",
      description: "Разработка мобильного приложения Umbra",
      status: "ON_HOLD",
      budget: 30000.00,
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
    },
    {
      name: "Техническая поддержка",
      description: "Система технической поддержки пользователей",
      status: "ACTIVE",
      budget: 10000.00,
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-10-31"),
    },
  ];

  for (const project of financeProjects) {
    await prisma.finance_projects.create({
      data: project,
    });
    console.log(`✅ Финансовый проект создан: ${project.name}`);
  }

  // Создаем тестовые страницы документации
  // Сначала создаем разделы
  const documentationSections = [
    {
      name: "Начало работы",
      key: "getting-started",

      description: "Базовое руководство по началу работы с платформой",
      order: 1,
      isVisible: true,
    },
    {
      name: "Установка",
      key: "installation",

      description: "Пошаговая инструкция по установке платформы",
      order: 2,
      isVisible: true,
    },
    {
      name: "API справочник",
      key: "api-reference",

      description: "Полный справочник по API платформы",
      order: 3,
      isVisible: true,
    },
  ];

  // Создаем разделы и сохраняем их ID
  const createdSections = new Map<string, string>();
  
  for (const section of documentationSections) {
    const createdSection = await prisma.documentation_sections.upsert({
      where: { key: section.key },
      update: section,
      create: section,
    });
    createdSections.set(section.key, createdSection.id);
    console.log(`✅ Раздел документации готов: ${section.name}`);
  }

  const documentationPages = [
    {
      title: "Начало работы с Umbra Platform",
      description: "Базовое руководство по началу работы с платформой",
      slug: "getting-started",
      content: null, // Контент будет добавлен через админ панель
      sectionId: createdSections.get("getting-started")!,
      order: 1,
      isPublished: true,
    },
    {
      title: "Установка и настройка",
      description: "Пошаговая инструкция по установке платформы",
      slug: "installation", 
      content: null, // Контент будет добавлен через админ панель
      sectionId: createdSections.get("installation")!,
      order: 2,
      isPublished: true,
    },
    {
      title: "API справочник",
      description: "Полный справочник по API платформы",
      slug: "api-reference",
      content: null, // Контент будет добавлен через админ панель
      sectionId: createdSections.get("api-reference")!,
      order: 3,
      isPublished: false,
    },
  ];

  for (const page of documentationPages) {
    await prisma.documentation.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
    console.log(`✅ Страница документации готова: ${page.title}`);
  }

  console.log("🎉 База данных успешно заполнена!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Ошибка при заполнении БД:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
