# n8n do Vitru

Ambiente local isolado para desenvolver e testar os workflows do Vitru.

## Serviços

- n8n `2.32.7`, acessível por padrão em `http://localhost:5679`;
- PostgreSQL 16, acessível apenas pela rede interna do Compose;
- volumes próprios para o banco e para os arquivos persistentes do n8n.

A porta `5679` evita conflito com o n8n do projeto `hackathon`, que já utiliza a
porta `5678` desta máquina.

## Preparação

1. Copie `.env.example` para `.env`.
2. Substitua os valores marcados com `change-me` por valores aleatórios fortes.
3. Mantenha a mesma `N8N_ENCRYPTION_KEY` durante toda a vida da instância. Sem
   essa chave, credenciais já salvas pelo n8n não poderão ser descriptografadas.
4. Valide a configuração antes de iniciar:

   ```bash
   docker compose --env-file .env config --quiet
   ```

5. Inicie o ambiente:

   ```bash
   docker compose --env-file .env up -d
   ```

6. Acompanhe a inicialização:

   ```bash
   docker compose logs -f n8n
   ```

## Operação

Parar sem apagar os dados:

```bash
docker compose stop
```

Iniciar novamente:

```bash
docker compose start
```

Atualizar futuramente:

1. altere `N8N_VERSION` no `.env`;
2. leia as notas de versão e instruções de migração do n8n;
3. faça backup do PostgreSQL e do volume `n8n_data`;
4. execute `docker compose pull` e `docker compose up -d`.

Não use `docker compose down --volumes`, pois essa opção remove os volumes e os
dados locais.

## Workflows

As exportações sanitizadas serão armazenadas em `workflows/`. Elas não devem
conter credenciais, tokens, URLs privadas ou dados reais de alunos.

Workflows inicialmente planejados:

- `vitru-router`;
- `vitru-study-planner`;
- `vitru-whatsapp-inbound`;
- `vitru-notifications`.

## Limites deste ambiente

- Configurado somente para desenvolvimento local.
- Não possui HTTPS nem URL pública.
- Não deve receber webhooks reais da Twilio.
- Não representa a topologia de produção na AWS.
- Armazenamento S3 nativo de binários do n8n não está habilitado, pois esse
  recurso requer uma licença Self-hosted Enterprise. Arquivos do Vitru poderão
  ser enviados ao S3 por workflows ou pela API da aplicação.
