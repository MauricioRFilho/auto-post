import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export const startContainers = async () => {
  console.log('🚀 Starting Testcontainers...');
  
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('affiliates_test')
    .withUsername('autopost')
    .withPassword('autopost_test_pass')
    .start();

  redisContainer = await new RedisContainer('redis:7-alpine')
    .start();

  const databaseUrl = `postgresql://autopost:autopost_test_pass@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/affiliates_test?schema=public`;
  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();

  console.log('✅ Containers started and environment variables set.');
  
  return { databaseUrl, redisUrl };
};

export const stopContainers = async () => {
  console.log('🛑 Stopping Testcontainers...');
  if (postgresContainer) await postgresContainer.stop();
  if (redisContainer) await redisContainer.stop();
};
