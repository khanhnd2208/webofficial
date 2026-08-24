export const CURRICULUM_JSON_TEMPLATE = JSON.stringify({
  subject: { title: 'Môn học', slug: 'mon-hoc', summary: '', description: '', units: [{
    slug: 'unit-slug', title: 'Unit title', summary: '', position: 0, modules: [{
      slug: 'module-slug', title: 'Module title', summary: '', position: 0, items: [{
        slug: 'item-slug', title: 'Mục kiến thức', summary: '', shortHtml: '<p>Giải thích ngắn gọn</p>', deepHtml: '<p>Giải thích sâu</p>', position: 0, relatedSlugs: [],
      }],
    }],
  }] },
}, null, 2);
