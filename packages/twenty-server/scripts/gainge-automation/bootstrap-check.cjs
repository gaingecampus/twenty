require('dotenv').config();
require('reflect-metadata');
const assert = require('node:assert/strict');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { GaingeAutomationService } = require('../../dist/modules/gainge-automation/gainge-automation.service');
const { GaingeAutomationTableService } = require('../../dist/modules/gainge-automation/automation-table.service');
(async () => {
  assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.PG_DATABASE_URL).hostname));
  const app = await NestFactory.create(AppModule, { logger: ['error'], abortOnError: false });
  assert.ok(app.get(GaingeAutomationService));
  assert.ok(app.get(GaingeAutomationTableService));
  await app.close();
  console.log('Full application dependency resolution passed; no HTTP listener started.');
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
