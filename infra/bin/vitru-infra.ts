#!/usr/bin/env node
/**
 * Entry point do CDK — instancia todos os stacks do Vitru AVA.
 *
 * Ambientes:
 * - dev: banco local (PGlite), sem Salesforce real
 * - staging: Aurora Serverless dev, Salesforce Sandbox
 * - prod: Aurora Serverless prod, Salesforce Production
 */
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { StorageStack } from "../lib/storage-stack";
import { ComputeStack } from "../lib/compute-stack";
import { EventsStack } from "../lib/events-stack";

const app = new cdk.App();
const envName = app.node.tryGetContext("env") || "dev";

const envConfig: Record<string, cdk.Environment> = {
  dev: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  staging: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  prod: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "sa-east-1" },
};

const env = envConfig[envName] ?? envConfig.dev;
const prefix = `Vitru-${envName}`;

// 1. Banco de dados
const databaseStack = new DatabaseStack(app, `${prefix}-Database`, { env });

// 2. Autenticação
const authStack = new AuthStack(app, `${prefix}-Auth`, { env });

// 3. Armazenamento
const storageStack = new StorageStack(app, `${prefix}-Storage`, { env });

// 4. Lambdas
const computeStack = new ComputeStack(app, `${prefix}-Compute`, {
  env,
  databaseClusterArn: databaseStack.clusterArn,
  databaseSecretArn: databaseStack.secretArn,
});
computeStack.addDependency(databaseStack);

// 5. Eventos
const eventsStack = new EventsStack(app, `${prefix}-Events`, {
  env,
  riskScoreLambdaArn: computeStack.riskScoreLambdaArn,
  syncSalesforceLambdaArn: computeStack.syncSalesforceLambdaArn,
});
eventsStack.addDependency(computeStack);

app.synth();
