# Blog CMS

## Public content

Published articles are available through public article routes and rendered in the website's blog surfaces.

## Admin content workflow

The admin article router supports:

- list/create;
- read/edit;
- publish;
- unpublish;
- archive;
- restore.

Draft/published state is persisted separately enough to support editorial lifecycle rather than directly editing an uncontrolled public HTML blob.

## Security

Article administration is behind admin authentication, MFA and the `BLOGS_MANAGE` permission. Public article routes expose only content eligible for public reading.

## SEO/editorial behavior

Article pages use normal public metadata/indexing behavior. Authors/editors should treat titles, descriptions, slugs and cover assets as public content and avoid copying internal/private operational information into articles.
