import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

interface EventsStackProps extends cdk.StackProps {
  riskScoreLambdaArn: string;
  syncSalesforceLambdaArn: string;
}

/**
 * Stack de eventos: EventBridge bus, rules e scheduler.
 *
 * Event Bus: vitru-events
 *   → Centraliza todos os eventos do sistema
 *
 * Rules:
 *   → student.risk_score_changed [high|critical] → sync-salesforce Lambda
 *
 * Scheduler:
 *   → Cron diário 02:00 UTC → calculate-risk-scores Lambda
 *   → Cron semanal segunda 08:00 UTC → (futuro) generate-weekly-report
 */
export class EventsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EventsStackProps) {
    super(scope, id, props);

    // Event Bus customizado
    const eventBus = new events.EventBus(this, "VitruEventBus", {
      eventBusName: "vitru-events",
    });

    // Referência às Lambdas
    const syncSalesforceLambda = lambda.Function.fromFunctionArn(
      this,
      "SyncSfRef",
      props.syncSalesforceLambdaArn
    );
    const riskScoreLambda = lambda.Function.fromFunctionArn(
      this,
      "RiskScoreRef",
      props.riskScoreLambdaArn
    );

    // --- Rule: Risk score alto/crítico → Sync Salesforce ---
    new events.Rule(this, "HighRiskToSalesforce", {
      eventBus,
      ruleName: "vitru-high-risk-to-salesforce",
      description: "Quando aluno atinge risco alto/crítico, sincroniza com Salesforce",
      eventPattern: {
        source: ["vitru.risk-engine"],
        detailType: ["student.risk_score_changed"],
        detail: {
          level: ["high", "critical"],
        },
      },
      targets: [new targets.LambdaFunction(syncSalesforceLambda)],
    });

    // --- Rule: Qualquer evento de aluno (para analytics futuro) ---
    new events.Rule(this, "StudentEventsLog", {
      eventBus,
      ruleName: "vitru-student-events-log",
      description: "Loga todos os eventos de aluno para CloudWatch (observabilidade)",
      eventPattern: {
        source: ["vitru.risk-engine", "vitru.ava", "vitru.community"],
      },
      targets: [
        new targets.CloudWatchLogGroup(
          new cdk.aws_logs.LogGroup(this, "StudentEventsLogGroup", {
            logGroupName: "/vitru/events/student",
            retention: cdk.aws_logs.RetentionDays.THIRTY_DAYS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          })
        ),
      ],
    });

    // --- Scheduler: Cálculo diário de risk scores ---
    const schedulerRole = new iam.Role(this, "SchedulerRole", {
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    schedulerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [props.riskScoreLambdaArn],
      })
    );

    new scheduler.CfnSchedule(this, "DailyRiskScore", {
      name: "vitru-daily-risk-score",
      description: "Calcula risk score de todos os alunos diariamente às 02:00 UTC",
      scheduleExpression: "cron(0 2 * * ? *)",
      flexibleTimeWindow: { mode: "OFF" },
      target: {
        arn: props.riskScoreLambdaArn,
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({
          source: "scheduler",
          "detail-type": "scheduled.daily_risk_calculation",
        }),
      },
      state: "ENABLED",
    });

    // Outputs
    new cdk.CfnOutput(this, "EventBusName", { value: eventBus.eventBusName });
    new cdk.CfnOutput(this, "EventBusArn", { value: eventBus.eventBusArn });
  }
}
