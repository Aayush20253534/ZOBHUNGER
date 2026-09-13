-- Grant the newly-added capability after the enum migration has committed.
UPDATE "User"
SET "adminPermissions" = CASE
  WHEN NOT ('AI_ASSISTANT_MANAGE'::"AdminPermission" = ANY("adminPermissions"))
  THEN array_append("adminPermissions", 'AI_ASSISTANT_MANAGE'::"AdminPermission")
  ELSE "adminPermissions"
END
WHERE "role" = 'ADMIN' AND "adminDepartment" = 'MAIN_ADMIN';
