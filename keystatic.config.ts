import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    // можно строкой "owner/name" ИЛИ объектом { owner, name }
    repo: 'Subinvar/my-site',
    // опционально: ограничить видимые ветки префиксом
    // branchPrefix: 'content/', 
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});