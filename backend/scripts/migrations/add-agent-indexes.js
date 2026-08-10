/**
 * Example migration: add indexes to agents collection.
 * Run with: node scripts/migrate.js add-agent-indexes
 */
export async function up(db) {
  console.log('  Adding index on agents.userId...');
  await db.collection('agents').createIndex({ userId: 1 });

  console.log('  Adding index on agents.vapiId...');
  await db.collection('agents').createIndex({ vapiId: 1 }, { sparse: true });

  console.log('  Adding compound index on calls (userId + createdAt)...');
  await db.collection('calls').createIndex({ userId: 1, createdAt: -1 });

  console.log('  Example indexes created.');
}
