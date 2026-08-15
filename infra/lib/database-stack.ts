import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

/**
 * Stack de banco de dados: Aurora Serverless v2 (PostgreSQL 16).
 *
 * Features:
 * - Escala de 0.5 a 8 ACUs sob demanda
 * - Data API habilitada (HTTP, sem connection pool)
 * - VPC isolada com subnets privadas
 * - Backup automático (35 dias)
 * - Encryption at rest (KMS)
 */
export class DatabaseStack extends cdk.Stack {
  public readonly clusterArn: string;
  public readonly secretArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC com 2 AZs
    const vpc = new ec2.Vpc(this, "VitruVpc", {
      maxAzs: 2,
      natGateways: 0, // Economia — Lambda usa VPC endpoints
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group
    const dbSg = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      description: "Aurora Serverless — somente Lambda e API routes",
      allowAllOutbound: false,
    });

    // Aurora Serverless v2
    const cluster = new rds.DatabaseCluster(this, "VitruAurora", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_1,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 8,
      writer: rds.ClusterInstance.serverlessV2("writer", {
        publiclyAccessible: false,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      defaultDatabaseName: "vitru",
      enableDataApi: true,
      backup: { retention: cdk.Duration.days(35) },
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.clusterArn = cluster.clusterArn;
    this.secretArn = cluster.secret?.secretArn ?? "";

    // Outputs
    new cdk.CfnOutput(this, "ClusterArn", { value: cluster.clusterArn });
    new cdk.CfnOutput(this, "SecretArn", {
      value: cluster.secret?.secretArn ?? "N/A",
    });
    new cdk.CfnOutput(this, "DatabaseName", { value: "vitru" });
  }
}
