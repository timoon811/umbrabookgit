-- Проверка данных документации
SELECT
  d.id,
  d.title,
  d.slug,
  d.isPublished,
  d."order",
  d."createdAt",
  s.name as section_name,
  s.key as section_key
FROM documentation d
LEFT JOIN documentation_sections s ON d."sectionId" = s.id
WHERE d."isPublished" = true
ORDER BY d."order" ASC, d."createdAt" ASC;

-- Проверка секций
SELECT id, name, key, "order", "isVisible"
FROM documentation_sections
ORDER BY "order" ASC;
