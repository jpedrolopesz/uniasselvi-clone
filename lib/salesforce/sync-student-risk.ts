/**
 * Sincroniza risk score do aluno com Salesforce.
 */
import { upsert, create, query } from "./client";

export interface RiskScorePayload {
  studentId: string;
  studentName: string;
  email: string;
  courseCode: string;
  courseName: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: { name: string; weight: number; value: number; description: string }[];
  calculatedAt: string;
}

export async function syncStudentRiskToSalesforce(payload: RiskScorePayload) {
  const contactResult = await upsert("Contact", "Vitru_Student_Id__c", payload.studentId, {
    FirstName: payload.studentName.split(" ")[0],
    LastName: payload.studentName.split(" ").slice(1).join(" ") || "(sem sobrenome)",
    Email: payload.email,
    Vitru_Course_Code__c: payload.courseCode,
    Vitru_Course_Name__c: payload.courseName,
    Vitru_Risk_Level__c: payload.riskLevel,
    Vitru_Last_Risk_Score__c: payload.riskScore,
  });

  const riskScoreId = await create("Vitru_Risk_Score__c", {
    Contact__c: contactResult.id,
    Score__c: payload.riskScore,
    Risk_Level__c: payload.riskLevel,
    Factors__c: JSON.stringify(payload.factors),
    Calculated_At__c: payload.calculatedAt,
  });

  let caseId: string | undefined;
  if (payload.riskLevel === "high" || payload.riskLevel === "critical") {
    const existing = await query<{ Id: string }>(
      `SELECT Id FROM Case WHERE ContactId = '${contactResult.id}' AND Status != 'Closed' AND Type = 'Retention' LIMIT 1`
    );
    if (existing.length === 0) {
      caseId = await create("Case", {
        ContactId: contactResult.id,
        Subject: `[Risco ${payload.riskLevel.toUpperCase()}] ${payload.studentName} — ${payload.courseName}`,
        Description: `Score: ${payload.riskScore}/100. Fatores: ${payload.factors.map(f => f.name).join(", ")}`,
        Type: "Retention",
        Priority: payload.riskLevel === "critical" ? "High" : "Medium",
        Origin: "Vitru AVA",
        Status: "New",
      });
    }
  }

  return { contactId: contactResult.id, riskScoreId, caseId };
}

export async function addToCampaign(contactId: string, campaignId: string, status = "Sent"): Promise<string> {
  return create("CampaignMember", { ContactId: contactId, CampaignId: campaignId, Status: status });
}
