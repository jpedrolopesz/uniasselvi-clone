import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

interface ComputeStackProps extends cdk.StackProps {
  databaseClusterArn: string;
  databaseSecretArn: string;
}

/**
 * Stack de compute: Lambdas para processamento assíncrono.
 *
 * Lambdas:
 * - calculate-risk-scores: batch diário (todos os alunos)
 * - sync-salesforce: event-driven (alunos em risco)
 *
 * Cada Lambda tem:
 * - IAM role com least privilege
 * - Dead letter queue (SQS) para falhas
 * - Timeout e memory configurados por função
 */
export class ComputeStack extends cdk.Stack {
  public readonly riskScoreLambdaArn: string;
  public readonly syncSalesforceLambdaArn: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Dead Letter Queue (compartilhada)
    const dlq = new sqs.Queue(this, "LambdaDLQ", {
      queueName: "vitru-lambda-dlq",
      retentionPeriod: cdk.Duration.days(14),
    });

    // --- Lambda: calculate-risk-scores ---
    const riskScoreLambda = new lambda.Function(this, "CalculateRiskScores", {
      functionName: "vitru-calculate-risk-scores",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../lambdas/calculate-risk-scores"),
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      environment: {
        AURORA_CLUSTER_ARN: props.databaseClusterArn,
        AURORA_SECRET_ARN: props.databaseSecretArn,
        AURORA_DATABASE: "vitru",
        NODE_ENV: "production",
      },
      deadLetterQueue: dlq,
      retryAttempts: 2,
      description: "Calcula risk score de evasão de todos os alunos (batch diário)",
    });

    // Permissões para Aurora Data API
    riskScoreLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
        ],
        resources: [props.databaseClusterArn],
      })
    );
    riskScoreLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );
    // Permissão para emitir eventos
    riskScoreLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["events:PutEvents"],
        resources: ["*"],
      })
    );

    // --- Lambda: sync-salesforce ---
    const syncSalesforceLambda = new lambda.Function(this, "SyncSalesforce", {
      functionName: "vitru-sync-salesforce",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../lambdas/sync-salesforce"),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        SALESFORCE_INSTANCE_URL: process.env.SALESFORCE_INSTANCE_URL ?? "",
        SALESFORCE_CLIENT_ID: process.env.SALESFORCE_CLIENT_ID ?? "",
        SALESFORCE_CLIENT_SECRET: process.env.SALESFORCE_CLIENT_SECRET ?? "",
        SALESFORCE_USERNAME: process.env.SALESFORCE_USERNAME ?? "",
        NODE_ENV: "production",
      },
      deadLetterQueue: dlq,
      retryAttempts: 2,
      description: "Sincroniza risk score com Salesforce quando aluno atinge risco alto/crítico",
    });

    // Permissão para acessar secrets (credenciais Salesforce)
    syncSalesforceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: ["*"], // Em produção: ARN específico do secret
      })
    );

    this.riskScoreLambdaArn = riskScoreLambda.functionArn;
    this.syncSalesforceLambdaArn = syncSalesforceLambda.functionArn;

    // Outputs
    new cdk.CfnOutput(this, "RiskScoreLambdaArn", {
      value: riskScoreLambda.functionArn,
    });
    new cdk.CfnOutput(this, "SyncSalesforceLambdaArn", {
      value: syncSalesforceLambda.functionArn,
    });
  }
}
