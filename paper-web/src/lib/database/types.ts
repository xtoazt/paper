/**
 * Database System Types
 */

export type DatabaseType = 'orbitdb' | 'gun' | 'ceramic' | 'postgres' | 'mongodb' | 'redis' | 'mysql';

export interface DatabaseConfig {
  name: string;
  type: DatabaseType;
  schema?: Record<string, any>;
  replicas?: number;
  storage?: number; // in GB
  backupSchedule?: string;
}

export interface Database {
  id: string;
  name: string;
  type: DatabaseType;
  connectionString?: string;
  replicas?: string[];
  backups?: string;
  createdAt: number;
  status: 'creating' | 'active' | 'error' | 'stopped';
}

export interface DistributedDatabase extends Database {
  orbitAddress?: string;
  ipfsCID?: string;
  peers: string[];
}

export interface TraditionalDatabase extends Database {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface DatabaseQuery {
  collection?: string;
  table?: string;
  query: any;
  limit?: number;
  offset?: number;
}

export interface DatabaseResult {
  success: boolean;
  data?: any[];
  error?: string;
  count?: number;
}
