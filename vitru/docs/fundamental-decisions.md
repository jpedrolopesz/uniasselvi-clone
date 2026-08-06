# Decisões fundamentais do Vitru

Última revisão: 5 de agosto de 2026.

## Identidade e canais

- Identidade única apresentada ao aluno: **Vitru**.
- Primeiro agente especializado: **Vitru · Calendário**.
- Canais iniciais:
  - chat contextual no Calendário de Estudos;
  - chat Universal no portal;
  - WhatsApp por meio do Twilio Sandbox.

## Identificação e confirmação

- O número de telefone recebido pela Twilio identifica inicialmente o contato.
- O vínculo entre o telefone e a conta do aluno deve ser realizado de forma
  segura.
- O CPF pode ser usado na verificação inicial ou na recuperação, mas não deve
  ser exibido integralmente no WhatsApp.
- Alterações no sistema exigem confirmação explícita do aluno.
- Consultas aos próprios dados não exigem uma nova confirmação a cada mensagem,
  desde que a identidade e a autorização estejam válidas.

### Ações que exigem confirmação

- criar, alterar ou excluir atividade;
- agendar, reagendar ou cancelar avaliação;
- alterar o telefone vinculado;
- enviar ou compartilhar documentos;
- iniciar uma operação financeira;
- compartilhar dados sensíveis;
- executar ações em lote.

## Dados no WhatsApp

- Somente dados do aluno identificado e autorizado podem ser consultados.
- CPF, credenciais, documentos completos e informações financeiras sensíveis
  devem permanecer ocultos ou mascarados.
- Dados de outros alunos nunca podem ser apresentados.

## Retenção inicial

- Conversas comuns: 90 dias.
- Mídias temporárias do WhatsApp: 30 dias.
- Confirmações pendentes: até execução, cancelamento ou expiração.
- Registros de auditoria de ações: 12 meses.
- Logs técnicos sem conteúdo pessoal: 30 dias.

Os prazos deverão ser reavaliados durante a análise de LGPD.

## AWS

- Região inicial: `us-east-1` (Norte da Virgínia).
- Infraestrutura como código: AWS CDK.
- Limite inicial de referência: US$ 20 por mês.
- Alertas de orçamento planejados: US$ 5, US$ 10, US$ 15 e US$ 20.

O orçamento é um alerta e não impede cobranças. Para respeitar o limite durante
o MVP, Next.js, n8n e PostgreSQL permanecerão locais sempre que possível. AWS
será usada inicialmente de forma seletiva, com Bedrock sob demanda e baixo
volume no S3.

## Serviços planejados

### MVP

- Amazon Bedrock sob demanda;
- Amazon S3 para arquivos necessários;
- IAM;
- AWS Budgets;
- AWS CDK;
- PostgreSQL local;
- n8n local no Docker.

### Evolução

- Amazon RDS for PostgreSQL;
- Amazon SQS e filas de mensagens não processadas;
- AWS Secrets Manager e KMS;
- Amazon Bedrock AgentCore;
- CloudWatch e AWS Backup;
- hospedagem permanente da aplicação e do n8n.
