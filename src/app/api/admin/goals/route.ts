import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// GET /api/admin/goals - Получение всех планов с этапами
export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Получаем типы планов
    const goalTypes = await prisma.$queryRaw`
      SELECT * FROM "goal_types" WHERE "isActive" = true ORDER BY "name"
    `;

    // Получаем планы с этапами
    const goals = await prisma.$queryRaw`
      SELECT 
        g.*,
        gt."name" as "goalTypeName",
        gt."unit" as "goalTypeUnit",
        gt."type" as "goalTypeType",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', gs."id",
              'stage', gs."stage",
              'targetValue', gs."targetValue",
              'rewardAmount', gs."rewardAmount",
              'title', gs."title",
              'description', gs."description",
              'isActive', gs."isActive"
            ) ORDER BY gs."stage"
          ) FILTER (WHERE gs."id" IS NOT NULL), 
          '[]'::json
        ) as stages
      FROM "user_goals" g
      LEFT JOIN "goal_types" gt ON g."goalTypeId" = gt."id"
      LEFT JOIN "goal_stages" gs ON g."id" = gs."goalId" AND gs."isActive" = true
      WHERE g."isActive" = true
      GROUP BY g."id", gt."name", gt."unit", gt."type"
      ORDER BY g."createdAt" DESC
    `;

    return NextResponse.json({
      goalTypes,
      goals
    });
  } catch (error) {
    console.error("Ошибка получения планов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/admin/goals - Создание нового плана с этапами
export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const data = await request.json();
    const { name, description, goalTypeId, periodType, stages } = data;

    // Валидация основных полей
    if (!name || !goalTypeId || !stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: "Обязательные поля: name, goalTypeId, stages (массив)" },
        { status: 400 }
      );
    }

    // Валидация этапов
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (!stage.targetValue || !stage.rewardAmount || !stage.title) {
        return NextResponse.json(
          { error: `Этап ${i + 1}: обязательные поля targetValue, rewardAmount, title` },
          { status: 400 }
        );
      }
      if (stage.targetValue <= 0 || stage.rewardAmount <= 0) {
        return NextResponse.json(
          { error: `Этап ${i + 1}: targetValue и rewardAmount должны быть больше 0` },
          { status: 400 }
        );
      }
    }

    // Проверяем уникальность этапов по targetValue
    const targetValues = stages.map(s => s.targetValue);
    const uniqueTargets = new Set(targetValues);
    if (uniqueTargets.size !== targetValues.length) {
      return NextResponse.json(
        { error: "Целевые значения этапов должны быть уникальными" },
        { status: 400 }
      );
    }

    // Проверяем что этапы идут по возрастанию
    const sortedStages = [...stages].sort((a, b) => a.targetValue - b.targetValue);
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].targetValue !== sortedStages[i].targetValue) {
        return NextResponse.json(
          { error: "Этапы должны быть отсортированы по возрастанию целевых значений" },
          { status: 400 }
        );
      }
    }

    // Используем транзакцию для создания плана и его этапов
    const result = await prisma.$transaction(async (tx) => {
      // Создаем план
      const goal = await tx.$executeRaw`
        INSERT INTO "user_goals" ("id", "name", "description", "goalTypeId", "periodType", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${name}, ${description || null}, ${goalTypeId}, ${periodType || 'DAILY'}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const goalId = await tx.$queryRaw`
        SELECT "id" FROM "user_goals" WHERE "name" = ${name} AND "goalTypeId" = ${goalTypeId} ORDER BY "createdAt" DESC LIMIT 1
      `;

      const createdGoalId = (goalId as any)[0]?.id;

      if (!createdGoalId) {
        throw new Error('Не удалось создать план');
      }

      // Создаем этапы
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        await tx.$executeRaw`
          INSERT INTO "goal_stages" ("id", "goalId", "stage", "targetValue", "rewardAmount", "title", "description", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${createdGoalId}, ${i + 1}, ${stage.targetValue}, ${stage.rewardAmount}, ${stage.title}, ${stage.description || null}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `;
      }

      return createdGoalId;
    });

    // Получаем созданный план с этапами
    const createdGoal = await prisma.$queryRaw`
      SELECT 
        g.*,
        gt."name" as "goalTypeName",
        gt."unit" as "goalTypeUnit",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', gs."id",
              'stage', gs."stage",
              'targetValue', gs."targetValue",
              'rewardAmount', gs."rewardAmount",
              'title', gs."title",
              'description', gs."description"
            ) ORDER BY gs."stage"
          ), 
          '[]'::json
        ) as stages
      FROM "user_goals" g
      LEFT JOIN "goal_types" gt ON g."goalTypeId" = gt."id"
      LEFT JOIN "goal_stages" gs ON g."id" = gs."goalId"
      WHERE g."id" = ${result}
      GROUP BY g."id", gt."name", gt."unit"
    `;

    return NextResponse.json(createdGoal[0], { status: 201 });
  } catch (error) {
    console.error("Ошибка создания плана:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
