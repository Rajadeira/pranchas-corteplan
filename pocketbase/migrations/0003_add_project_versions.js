migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')

    if (!col.fields.getByName('version')) {
      col.fields.add(
        new NumberField({
          name: 'version',
          required: false,
          min: 1,
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('parent_id')) {
      col.fields.add(
        new TextField({
          name: 'parent_id',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('version_notes')) {
      col.fields.add(
        new TextField({
          name: 'version_notes',
          required: false,
        }),
      )
    }

    app.save(col)

    // Set default version = 1 for existing records
    app
      .db()
      .newQuery('UPDATE projects SET version = 1 WHERE version IS NULL OR version = 0')
      .execute()

    col.addIndex('idx_projects_parent_id', false, 'parent_id', '')
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('projects')
      col.removeIndex('idx_projects_parent_id')
      col.fields.removeByName('version')
      col.fields.removeByName('parent_id')
      col.fields.removeByName('version_notes')
      app.save(col)
    } catch (_) {}
  },
)
