# Workflows versionados

Este diretório receberá somente exports JSON revisados e sanitizados.

Antes de versionar um workflow:

- remova credenciais e tokens;
- remova URLs privadas;
- remova `meta.instanceId`, o ID do workflow, `versionId` e `webhookId`;
- mantenha `active` como `false` para evitar ativação acidental após importação;
- substitua dados reais de alunos por dados fictícios;
- confirme que nenhuma execução ou informação sensível foi incluída.

## Workflows disponíveis

- `vitru-router.json`: valida o contrato de chat, direciona entre Vitru
  Universal e Vitru · Calendário, gera respostas com Amazon Bedrock Nova Micro
  e trata entradas inválidas e indisponibilidade da IA.
  Depois da importação, associe manualmente a credencial
  `AWS Bedrock - Vitru Development` antes de ativar o workflow.
