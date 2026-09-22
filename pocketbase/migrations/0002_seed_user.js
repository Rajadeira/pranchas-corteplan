migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Idempotent: skip if user already exists
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'gustavo@corteplan.com.br')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('gustavo@corteplan.com.br')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Gustavo Corteplan')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'gustavo@corteplan.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
