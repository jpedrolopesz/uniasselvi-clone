# Vitru

Esta pasta concentra os artefatos do assistente de IA Vitru que não pertencem
diretamente à aplicação Next.js.

## Estrutura

- `docs/`: decisões, arquitetura, contratos e planejamento.
- `infra/`: infraestrutura AWS definida com AWS CDK.
- `n8n/`: documentação e exportações sanitizadas dos workflows do n8n.

As integrações do portal continuarão nas convenções do projeto Next.js, como
`app/`, `components/` e `lib/`. Credenciais, tokens, arquivos `.env` e exports de
workflows contendo segredos não devem ser versionados.

## Estado atual

A etapa atual é de definição e preparação. Nenhuma integração com AWS, Bedrock,
n8n ou Twilio foi implementada ainda.

Consulte [docs/fundamental-decisions.md](docs/fundamental-decisions.md) para as
decisões já aprovadas.
