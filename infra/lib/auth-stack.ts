import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import type { Construct } from "constructs";

/**
 * Stack de autenticação: AWS Cognito User Pool.
 *
 * Features:
 * - Login com email + senha
 * - MFA opcional (TOTP)
 * - Federação Google e Microsoft (configurável)
 * - Grupos: aluno, coordenador, admin
 * - JWT tokens para autorização nas API Routes
 */
export class AuthStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // User Pool
    const userPool = new cognito.UserPool(this, "VitruUserPool", {
      userPoolName: "vitru-students",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        courseCode: new cognito.StringAttribute({ mutable: true }),
        institution: new cognito.StringAttribute({ mutable: true }),
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // App Client (frontend)
    const client = userPool.addClient("VitruWebApp", {
      userPoolClientName: "vitru-web",
      authFlows: {
        userSrp: true,
        userPassword: false, // Só SRP (mais seguro)
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:3000/api/auth/callback",
          "https://vitru-ava.com/api/auth/callback",
        ],
        logoutUrls: [
          "http://localhost:3000",
          "https://vitru-ava.com",
        ],
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Grupos
    new cognito.CfnUserPoolGroup(this, "AlunoGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "aluno",
      description: "Alunos do AVA",
    });

    new cognito.CfnUserPoolGroup(this, "CoordenadorGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "coordenador",
      description: "Coordenadores de curso (acesso ao dashboard de retenção)",
    });

    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "admin",
      description: "Administradores da plataforma",
    });

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = client.userPoolClientId;

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
    new cdk.CfnOutput(this, "UserPoolDomain", {
      value: `${userPool.userPoolId}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
