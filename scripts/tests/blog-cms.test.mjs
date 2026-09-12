import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = async path => readFile(new URL(path, root), "utf8");

test("blog CMS migration adds publish metadata and lifecycle without destructive article deletes", async () => {
  const migration = await read("server/prisma/migrations/20260917100000_blog_cms/migration.sql");
  for (const field of ["authorName", "tags", "coverImageUrl", "seoTitle", "seoDescription", "canonicalUrl", "ogImageUrl", "archivedAt", "revision"]) {
    assert.match(migration, new RegExp(`ADD COLUMN "${field}"`));
  }
  assert.match(migration, /CREATE TABLE "ArticleDraft"/);
  assert.match(migration, /Future edits[\s\S]*never mutates the live article/);
  assert.doesNotMatch(migration, /DELETE FROM "Article"/);
});

test("blog admin API is MFA protected, BLOGS_MANAGE scoped and uses optimistic revisions", async () => {
  const adminRoutes = await read("server/src/modules/admin/admin.routes.ts");
  const permissions = await read("server/src/middlewares/admin-permission.middleware.ts");
  const routes = await read("server/src/modules/articles/admin-articles.routes.ts");
  const service = await read("server/src/modules/articles/admin-articles.service.ts");
  assert.match(adminRoutes, /requireAuth, requireRole\("ADMIN"\), requireAdminMfa/);
  assert.match(adminRoutes, /adminRouter\.use\("\/articles", adminArticlesRouter\)/);
  assert.match(permissions, /\/articles.*BLOGS_MANAGE/);
  assert.match(routes, /:id\/publish/);
  assert.match(routes, /:id\/archive/);
  assert.match(service, /revision: input\.expectedRevision/);
  assert.match(service, /revision: \{ increment: 1 \}/);
  assert.match(service, /articleDraft\.upsert/);
  assert.match(service, /liveUnaffected: row\.isPublished/);
  assert.match(service, /article\.published/);
  assert.match(service, /article\.archived/);
});

test("editor supports draft, scheduled, published and archived content with SEO metadata", async () => {
  const component = await read("client/src/components/admin/AdminBlogManagement.tsx");
  const nav = await read("client/src/data/admin-navigation.ts");
  assert.match(nav, /href: "\/admin\/blogs"/);
  assert.match(nav, /permission: "BLOGS_MANAGE"/);
  assert.match(component, /Publish useful ideas without a code release\./);
  assert.match(component, /Schedule publication/);
  assert.match(component, /SEO metadata/);
  assert.match(component, /Open Graph image/);
  assert.match(component, /Add section/);
  assert.match(component, /Section images/);
  assert.match(component, /Pull quotes/);
});

test("public blog reads the production API and renders CMS-authored rich content safely", async () => {
  const service = await read("client/src/services/articles.service.ts");
  const article = await read("client/src/app/blog/[slug]/page.tsx");
  const inline = await read("client/src/components/blog/ArticleInlineText.tsx");
  assert.match(service, /getEditorialDataMode\(\) === "api"/);
  assert.match(service, /getDataAdapter\(\)\.listArticles/);
  assert.match(article, /article\.coverImageUrl/);
  assert.match(article, /section\.quotes/);
  assert.match(article, /section\.images/);
  assert.match(article, /article\.seoDescription/);
  assert.match(inline, /does not accept raw HTML|without accepting raw HTML/);
  assert.match(inline, /url\.protocol === "https:"/);
});


test("rerunning the project seed cannot overwrite CMS-edited articles", async () => {
  const seed = await read("server/prisma/seed.ts");
  assert.match(seed, /CMS-managed editorial content must never be overwritten/);
  assert.match(seed, /where: \{ slug: article\.slug \}[\s\S]*update: \{\}/);
});

test("publishing validates useful content and public queries exclude drafts, archives and future schedules", async () => {
  const service = await read("server/src/modules/articles/admin-articles.service.ts");
  const repository = await read("server/src/modules/articles/articles.repository.ts");
  assert.match(service, /Complete the article before publishing/);
  assert.match(service, /Add at least one content section/);
  assert.match(repository, /isPublished: true/);
  assert.match(repository, /archivedAt: null/);
  assert.match(repository, /publishedAt: \{ lte: new Date\(\) \}/);
});
