migrate(
  (app) => {
    const collection = new Collection({
      name: 'projects',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'cliente', type: 'text', required: true },
        { name: 'modelo', type: 'text', required: true },
        { name: 'data', type: 'text', required: true },
        { name: 'vendedor', type: 'text', required: true },
        { name: 'projeto', type: 'text', required: true },
        { name: 'responsavel', type: 'text', required: true },
        { name: 'include_ambiente', type: 'bool', required: false },
        {
          name: 'render_imagem',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'ambiente_imagem',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'desenho_imagem',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_projects_user_id ON projects (user_id)',
        'CREATE INDEX idx_projects_created ON projects (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('projects')
      app.delete(collection)
    } catch (_) {}
  },
)
