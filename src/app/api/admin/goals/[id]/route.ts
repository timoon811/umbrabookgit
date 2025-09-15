import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// GET /api/admin/goals/[id] - Получение конкретного плана
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    const goal = await prisma.$queryRaw`
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
      LEFT JOIN "goal_stages" gs ON g."id" = gs."goalId"
      WHERE g."id" = ${id} AND g."isActive" = true
      GROUP BY g."id", gt."name", gt."unit", gt."type"
    `;

    if (!goal || (goal as any).length === 0) {
      return NextResponse.json(
        { error: "План не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json((goal as any)[0]);
  } catch (error) {
    console.error("Ошибка получения плана:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/goals/[id] - Обновление плана с этапами
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const { name, description, periodType, stages } = data;

    // Проверяем существование плана
    const existingGoal = await prisma.$queryRaw`
      SELECT "id" FROM "user_goals" WHERE "id" = ${id} AND "isActive" = true
    `;

    if (!existingGoal || (existingGoal as any).length === 0) {
      return NextResponse.json(
        { error: "План не найден" },
        { status: 404 }
      );
    }

    // Валидация этапов если они предоставлены
    if (stages && Array.isArray(stages)) {
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
    }

    // Используем транзакцию для обновления
    await prisma.$transaction(async (tx) => {
      // Обновляем основную информацию плана
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('"name" = $' + (updateValues.length + 2));
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('"description" = $' + (updateValues.length + 2));
        updateValues.push(description);
      }
      if (periodType !== undefined) {
        updateFields.push('"periodType" = $' + (updateValues.length + 2));
        updateValues.push(periodType);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('"updatedAt" = CURRENT_TIMESTAMP');
        const query = `UPDATE "user_goals" SET ${updateFields.join(', ')} WHERE "id" = $1`;
        await tx.$executeRawUnsafe(query, id, ...updateValues);
      }

      // Если предоставлены этапы, обновляем их
      if (stages && Array.isArray(stages)) {
        // Удаляем старые этапы
        await tx.$executeRaw`
          DELETE FROM "goal_stages" WHERE "goalId" = ${id}
        `;

        // Создаем новые этапы
        for (let i = 0; i < stages.length; i++) {
          const stage = stages[i];
          await tx.$executeRaw`
            INSERT INTO "goal_stages" ("id", "goalId", "stage", "targetValue", "rewardAmount", "title", "description", "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, ${id}, ${i + 1}, ${stage.targetValue}, ${stage.rewardAmount}, ${stage.title}, ${stage.description || null}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `;
        }
      }
    });

    // Получаем обновленный план
    const updatedGoal = await prisma.$queryRaw`
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
      LEFT JOIN "goal_stages" gs ON g."id" = gs."goalId"
      WHERE g."id" = ${id}
      GROUP BY g."id", gt."name", gt."unit", gt."type"
    `;

    return NextResponse.json((updatedGoal as any)[0]);
  } catch (error) {
    console.error("Ошибка обновления плана:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/goals/[id] - Удаление плана
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    // Проверяем существование плана
    const existingGoal = await prisma.$queryRaw`
      SELECT "id" FROM "user_goals" WHERE "id" = ${id} AND "isActive" = true
    `;

    if (!existingGoal || (existingGoal as any).length === 0) {
      return NextResponse.json(
        { error: "План не найден" },
        { status: 404 }
      );
    }

    // Деактивируем план и его этапы (мягкое удаление)
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "user_goals" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}
      `;
      await tx.$executeRaw`
        UPDATE "goal_stages" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "goalId" = ${id}
      `;
    });

    return NextResponse.json({ message: "План успешно удален" });
  } catch (error) {
    console.error("Ошибка удаления плана:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
