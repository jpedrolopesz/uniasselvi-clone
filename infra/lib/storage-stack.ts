import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";

/**
 * Stack de armazenamento: S3 + CloudFront.
 *
 * Buckets:
 * - Content: materiais didáticos, gravações (read-heavy, cache longo)
 * - Uploads: avatares, arquivos do aluno (write-heavy, sem cache)
 *
 * CloudFront:
 * - CDN para entrega rápida de conteúdo no Brasil
 * - HTTPS automático
 * - Cache otimizado por tipo de arquivo
 */
export class StorageStack extends cdk.Stack {
  public readonly contentBucketName: string;
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Bucket de conteúdo (materiais, gravações)
    const contentBucket = new s3.Bucket(this, "ContentBucket", {
      bucketName: `vitru-content-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          // Move gravações antigas para IA (Infrequent Access) após 90 dias
          id: "archive-recordings",
          prefix: "recordings/",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Bucket de uploads (avatares, entregas de aluno)
    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: `vitru-uploads-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          // Remove uploads temporários após 30 dias
          id: "cleanup-temp",
          prefix: "temp/",
          expiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ["http://localhost:3000", "https://vitru-ava.com"],
          allowedHeaders: ["*"],
          maxAge: 3600,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, "ContentCDN", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      additionalBehaviors: {
        "/recordings/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(contentBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, "VideoCachePolicy", {
            cachePolicyName: "vitru-video-cache",
            defaultTtl: cdk.Duration.days(7),
            maxTtl: cdk.Duration.days(30),
            minTtl: cdk.Duration.hours(1),
          }),
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200, // Inclui América do Sul
      comment: "Vitru AVA — Conteúdo didático",
    });

    this.contentBucketName = contentBucket.bucketName;
    this.distributionDomainName = distribution.distributionDomainName;

    // Outputs
    new cdk.CfnOutput(this, "ContentBucket", { value: contentBucket.bucketName });
    new cdk.CfnOutput(this, "UploadsBucket", { value: uploadsBucket.bucketName });
    new cdk.CfnOutput(this, "CDNDomain", { value: distribution.distributionDomainName });
  }
}
