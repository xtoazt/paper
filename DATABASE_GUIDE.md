# Paper Network Database Guide

## Overview

Paper Network provides unlimited free databases with automatic sharding, replication, and ACID transactions.

## Supported Databases

- **PostgreSQL**: Full SQL support via sql.js
- **MongoDB**: NoSQL with CRDT sync
- **Redis**: In-memory with persistence
- **MySQL/MariaDB**: WebAssembly-based
- **Neo4j**: Graph database

## Creating a Database

### Via Dashboard

1. Visit `https://paper.paper` and go to the Database tab
2. Click "Create Database"
3. Choose database type and name
4. Click "Create"

Your database will be available at `db-xxxxx.paper`

### Via CLI

```bash
# PostgreSQL
paper db create --name mydb --type postgres

# MongoDB
paper db create --name mydb --type mongodb

# Redis
paper db create --name cache --type redis
```

## Connecting to Your Database

### PostgreSQL

```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'db-xxxxx.paper',
  database: 'mydb',
  port: 5432
});

await client.connect();
const res = await client.query('SELECT * FROM users');
console.log(res.rows);
```

### MongoDB

```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://db-xxxxx.paper/mydb');
await client.connect();

const db = client.db('mydb');
const users = await db.collection('users').find().toArray();
console.log(users);
```

### Redis

```javascript
const redis = require('redis');

const client = redis.createClient({
  url: 'redis://db-xxxxx.paper'
});

await client.connect();
await client.set('key', 'value');
const value = await client.get('key');
```

## Automatic Sharding

All databases are automatically sharded across multiple nodes:

- **4 shards by default**
- **3 replicas per shard**
- Automatic key-range distribution
- Transparent to your application

## Replication & High Availability

- **3-5 replicas** per shard
- **Automatic failover**
- **CRDT-based sync** for eventual consistency
- **Merkle tree verification**

## Transactions

### PostgreSQL

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### MongoDB

```javascript
const session = client.startSession();
session.startTransaction();

try {
  await accounts.updateOne(
    { id: 1 },
    { $inc: { balance: -100 } },
    { session }
  );
  
  await accounts.updateOne(
    { id: 2 },
    { $inc: { balance: 100 } },
    { session }
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
```

## Backups

Automatic backups every hour:

```bash
paper db backup create --db mydb
paper db backup list --db mydb
paper db backup restore --db mydb --backup backup-xxxxx
```

## Scaling

Databases automatically scale:

```bash
# Add more shards
paper db scale --db mydb --shards 8

# Add more replicas
paper db scale --db mydb --replicas 5
```

## Migrations

```bash
paper db migrate --db mydb --file migrations/001-create-users.sql
```

## Performance

- **1000s of QPS** aggregate across all shards
- **Sub-10ms latency** for local reads
- **Geo-aware routing** to nearest replica
- **Automatic query optimization**

## Monitoring

```bash
paper db stats --db mydb
```

View:
- Query performance
- Shard distribution
- Replication status
- Connection pool stats

## Pricing

**100% FREE** forever with unlimited storage and queries.

## Best Practices

1. **Use connection pooling** - Reuse connections
2. **Index frequently queried fields** - Improves performance
3. **Shard on appropriate keys** - Even distribution
4. **Enable replication** - For high availability
5. **Regular backups** - Automated hourly

## Support

- Documentation: `https://paper.paper/docs/database`
- Examples: `https://github.com/xtoazt/paper/tree/main/examples`
