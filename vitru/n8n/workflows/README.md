# Workflows versionados

> **Vitru Router aposentado:** a geração de texto agora vive em `lib/vitru/generate.ts` e `lib/vitru/prompts.ts`. O arquivo `vitru-router.json` permanece somente como referência histórica dos workflows e prompts originais.

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
  Universal, Vitru · Calendário e Vitru · Trilha, gera respostas com Amazon
  Bedrock Nova Micro e trata entradas inválidas e indisponibilidade da IA.
  Roteia tanto o contrato legado (`channel`/`agent`, usado pelo
  `vitru-whatsapp-inbound` e pela chamada direta antiga) quanto o contrato
  por superfície (`surface`/`objectId`/`focus`) do AssistantPanel
  multi-superfície — a superfície `trilha` só chega a este workflow na etapa
  de geração (passo 4 da ordem de resolução); FAQ, conteúdo da trilha e
  fora-de-escopo são resolvidos antes, no Next.js, sem custo de modelo. O
  ramo `study_planner` (calendário) carrega o contexto do aluno chamando de
  volta `GET /api/v1/vitru/context` (node `Load Student Context`) antes de
  gerar — a superfície `trilha`, diferente, já recebe o contexto pronto
  (allowlist da superfície) dentro do próprio corpo da requisição, sem
  chamada adicional. Depois da importação, associe manualmente a credencial
  `AWS Bedrock - Vitru Development` no node `AWS Bedrock Nova Micro` antes de
  ativar o workflow — uma vez associada ali, os três ramos de geração
  (universal, calendário, trilha) reaproveitam a mesma credencial.

  **Importante:** este arquivo é um export estático. Editá-lo não altera o
  workflow em execução na instância local de n8n — os dois só ficam
  sincronizados depois de uma reimportação manual (UI do n8n, ou
  `docker compose exec n8n n8n import:workflow --input=/caminho/vitru-router.json`
  seguido de `n8n publish:workflow --id=<id>` e um restart do serviço `n8n`
  para os webhooks recarregarem). Esta versão do arquivo foi reconciliada
  em 2026-08-09 a partir do workflow que estava realmente ativo na instância
  local (que já havia divergido do export anterior, incluindo o node `Load
  Student Context` acima, feito direto na UI e nunca antes exportado) — não
  assuma que edições futuras neste arquivo continuam sincronizadas
  automaticamente; este projeto não tem nenhum mecanismo automático de
  sincronização entre o JSON versionado e o Postgres do n8n.
