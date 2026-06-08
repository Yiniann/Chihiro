UPDATE "BookmarkCategoryItem"
SET
  "name" = '开发',
  "slug" = 'dev',
  "eyebrow" = 'Dev',
  "description" = '编程、框架、数据库与工程实践相关的书签。',
  "sortOrder" = 0,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'frontend';

UPDATE "BookmarkCategoryItem"
SET
  "name" = '设计',
  "slug" = 'design',
  "eyebrow" = 'Design',
  "description" = '界面、交互、排版与视觉参考相关的书签。',
  "sortOrder" = 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'design';

UPDATE "BookmarkCategoryItem"
SET
  "name" = '写作与表达',
  "slug" = 'writing',
  "eyebrow" = 'Writing',
  "description" = '帮助内容更清楚、更耐读，也更有作者气息的文章。',
  "sortOrder" = 2,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'writing';

UPDATE "BookmarkCategoryItem"
SET
  "name" = '工具',
  "slug" = 'tool',
  "eyebrow" = 'Tool',
  "description" = '提高效率、支持创作与日常工作的工具集合。',
  "sortOrder" = 3,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'product';
