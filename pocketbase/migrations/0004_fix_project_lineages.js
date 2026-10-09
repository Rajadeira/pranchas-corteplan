migrate(
  (app) => {
    // Fix existing corrupted lineage where 'TOPTEN' and 'Academia' projects were mistakenly linked
    // to Crepêrie Chez's root (o1vc50bm4ixzpuf).
    //
    // The TOPTEN lineage consists of:
    // 1. 4fehekeulfp6o4o (v3 previously, created 2026-10-08 09:25:17)
    // 2. tphukaips0kss79 (v4 previously, created 2026-10-09 01:34:49)
    // 3. njxaak949aib0kp (v5 previously, created 2026-10-09 02:26:48)
    // 4. vnz9iybzl6ic5uv (v7 previously, created 2026-10-09 02:32:40)
    //
    // And 'Academia' was a separate project created at 2026-10-08 03:14:22 (id: s1ltdesf6gw8zmo).
    //
    // Crepêrie Chez records:
    // 1. o1vc50bm4ixzpuf (v1 root)
    // 2. 83pzgy60gowxx3h (v6 previously -> should be v2)
    // 3. o1m8swpqeeyvhzl (v8 previously -> should be v3)

    // 1. Separate 'Academia' as its own independent project (v1 root)
    try {
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = '', version = 1 WHERE id = 's1ltdesf6gw8zmo' AND cliente LIKE '%Academia%'",
        )
        .execute()
    } catch (e) {
      console.log('Error updating Academia:', e)
    }

    // 2. Make the oldest TOPTEN record (4fehekeulfp6o4o) the independent root (v1) of TOPTEN
    try {
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = '', version = 1 WHERE id = '4fehekeulfp6o4o' AND cliente LIKE '%TOPTEN%'",
        )
        .execute()
    } catch (e) {
      console.log('Error setting TOPTEN root:', e)
    }

    // 3. Link the other TOPTEN records to this new root (4fehekeulfp6o4o) with contiguous versions:
    // tphukaips0kss79 -> v2
    // njxaak949aib0kp -> v3
    // vnz9iybzl6ic5uv -> v4
    try {
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = '4fehekeulfp6o4o', version = 2 WHERE id = 'tphukaips0kss79'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = '4fehekeulfp6o4o', version = 3 WHERE id = 'njxaak949aib0kp'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = '4fehekeulfp6o4o', version = 4 WHERE id = 'vnz9iybzl6ic5uv'",
        )
        .execute()
    } catch (e) {
      console.log('Error updating TOPTEN lineage:', e)
    }

    // 4. Fix Crepêrie Chez versions to be contiguous:
    // o1vc50bm4ixzpuf remains root (v1)
    // 83pzgy60gowxx3h -> v2
    // o1m8swpqeeyvhzl -> v3
    try {
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = 'o1vc50bm4ixzpuf', version = 2 WHERE id = '83pzgy60gowxx3h'",
        )
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE projects SET parent_id = 'o1vc50bm4ixzpuf', version = 3 WHERE id = 'o1m8swpqeeyvhzl'",
        )
        .execute()
    } catch (e) {
      console.log('Error renumbering Creperie Chez versions:', e)
    }
  },
  (app) => {
    // Revert logic if ever needed
  },
)
