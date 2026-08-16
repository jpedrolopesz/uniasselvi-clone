# Sala Virtual — Arquitetura (100% AWS)

> Ambiente 2D com avatares (estilo Habbo Hotel) e voz por proximidade.
> Alunos interagem visualmente, conversam por voz conforme se aproximam, e participam de atividades da comunidade.
> Toda infraestrutura em serviços AWS nativos.

---

## 1. Conceito

```
┌─────────────────────────────────────────────────────────────────┐
│                    SALA VIRTUAL (Canvas 2D)                       │
│                                                                   │
│   🧑 João                    🎓 Mentora Ana                      │
│    ↕ (andando)                                                    │
│         ──────── 🔊 voz ativa (próximos) ────────                │
│                                                                   │
│   👩 Maria     📌 EJ Admin        🏋️ Atlética                   │
│                  (sala temática)    (sala temática)               │
│                                                                   │
│   💬 Chat      🎤 Voz proximity   🎯 Eventos ao vivo            │
└─────────────────────────────────────────────────────────────────┘
```

O aluno:
- Cria um **avatar 2D** customizável
- **Anda** por um mapa isométrico/top-down (estilo Habbo)
- **Ouve** outros alunos quando se aproxima (voz por proximidade)
- **Entra em salas temáticas** (EJ, Pesquisa, Atlética, Networking)
- **Participa de eventos** ao vivo (palestras, mentorias, hangouts)

---

## 2. Arquitetura Completa

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Browser)                                │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Canvas 2D      │  │  WebRTC Audio   │  │  WebSocket (posição)    │  │
│  │  (PixiJS/Phaser)│  │  (voz proximity)│  │  (real-time sync)       │  │
│  │                 │  │                 │  │                         │  │
│  │  • Avatar render│  │  • Mic capture  │  │  • Envia posição x,y    │  │
│  │  • Mapa tiles   │  │  • Spatial audio│  │  • Recebe posição outros│  │
│  │  • Colisões     │  │  • Mute/unmute  │  │  • Estado do avatar     │  │
│  │  • Animações    │  │  • Volume=f(dist)│  │  • Eventos de sala     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘  │
│           │                    │                         │                │
└───────────┼────────────────────┼─────────────────────────┼────────────────┘
            │                    │                         │
            ▼                    ▼                         ▼
┌───────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│  ASSET SERVER     │  │  VOICE SERVER       │  │  GAME SERVER            │
│  (S3 + CloudFront)│  │  (WebRTC SFU)       │  │  (WebSocket)            │
│                   │  │                     │  │                         │
│  • Sprites avatar │  │  • LiveKit Cloud    │  │  • AWS AppSync ou       │
│  • Mapas/tiles    │  │    (ou Agora.io)    │  │    API Gateway WS       │
│  • Animações      │  │  • Spatial audio    │  │  • Lambda handlers      │
│  • Itens/mobília  │  │  • Rooms por sala   │  │  • Posição real-time    │
│                   │  │  • Proximity calc   │  │  • Estado dos avatares  │
└───────────────────┘  └─────────────────────┘  └─────────────────────────┘
                                │                         │
                                │                         │
                                ▼                         ▼
                       ┌─────────────────────────────────────────┐
                       │           AWS CLOUD                      │
                       │                                         │
                       │  Aurora (perfil avatar, inventário)      │
                       │  DynamoDB (posições real-time, TTL)      │
                       │  S3 (assets estáticos)                   │
                       │  CloudFront (CDN global)                 │
                       │  Cognito (auth = mesmo login do AVA)     │
                       └─────────────────────────────────────────┘
```

---

## 3. Componentes Técnicos

### 3.1 Canvas 2D (Renderização)

**Engine:** PixiJS (leve, 2D otimizado) ou Phaser 3 (mais features de game)

| Feature | Implementação |
|---------|--------------|
| Mapa | Tilemap isométrico ou top-down (Tiled editor → JSON) |
| Avatar | Spritesheet com animações (idle, walk N/S/E/W, sit, wave) |
| Movimento | Keyboard (WASD/setas) + click-to-move |
| Colisão | Tile-based collision layer |
| Zoom | Pinch-to-zoom (mobile), scroll (desktop) |
| Salas | Cada sala = mapa diferente, portal para transição |
| Itens | Mobília decorativa (cadeiras, quadros, mesas) |

**Performance:**
- 60 FPS com até 50 avatares na tela
- Sprites em spritesheet atlas (reduz draw calls)
- View culling (só renderiza o que está na viewport)

### 3.2 Voz por Proximidade (Spatial Audio)

**Serviço:** LiveKit Cloud (open-source, hospedável na AWS) ou Agora.io

**Como funciona:**
```
Avatar A está na posição (100, 200)
Avatar B está na posição (120, 210)
Distância = √((120-100)² + (210-200)²) = 22 pixels

Raio de audição = 150 pixels

Se distância < raio:
  volume = 1 - (distância / raio) = 1 - (22/150) = 0.85
  → B ouve A com 85% de volume

Se distância > raio:
  volume = 0 → silêncio total
```

**Implementação:**
```typescript
// Cada frame, ajusta volume de cada peer baseado na distância
function updateProximityAudio(myPosition: Vec2, peers: Map<string, PeerState>) {
  const HEARING_RADIUS = 150; // pixels

  for (const [peerId, peer] of peers) {
    const dx = peer.position.x - myPosition.x;
    const dy = peer.position.y - myPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > HEARING_RADIUS) {
      peer.audioTrack.setVolume(0);
    } else {
      const volume = 1 - (distance / HEARING_RADIUS);
      peer.audioTrack.setVolume(volume);

      // Panning stereo (esquerda/direita)
      const pan = Math.max(-1, Math.min(1, dx / HEARING_RADIUS));
      peer.audioTrack.setPan(pan);
    }
  }
}
```

### 3.3 Game Server (Real-time Sync)

**Opção A — AWS AppSync (GraphQL Subscriptions):**
- Managed, serverless, escala automático
- Subscriptions para updates de posição
- Mutations para ações (andar, sentar, emote)

**Opção B — API Gateway WebSocket + Lambda:**
- Mais controle, menor custo
- Lambda processa conexão, mensagem, desconexão
- DynamoDB armazena estado real-time

**Protocolo de sincronização:**
```json
// Cliente → Servidor (30x por segundo)
{ "type": "move", "x": 150, "y": 220, "direction": "east", "state": "walking" }

// Servidor → Todos na sala (broadcast)
{ "type": "peer_move", "userId": "abc", "x": 150, "y": 220, "direction": "east", "state": "walking" }

// Ações especiais
{ "type": "emote", "emote": "wave" }
{ "type": "sit", "furnitureId": "chair-01" }
{ "type": "enter_room", "roomId": "ej-admin" }
```

### 3.4 Salas Temáticas

| Sala | Propósito | Features |
|------|----------|----------|
| **Hall Principal** | Lobby de entrada | Mural de eventos, portais para salas |
| **Empresa Júnior** | Sede da EJ | Quadro de projetos, mesa de reunião |
| **Grupo de Pesquisa** | Lab acadêmico | Quadro de papers, área de discussão |
| **Atlética** | Espaço esportivo | Mural de campeonatos, troféus |
| **Networking** | Lounge profissional | Sofás, coffee area, cards de LinkedIn |
| **Auditório** | Eventos ao vivo | Palco, plateia, tela de apresentação |
| **Sala de Estudo** | Silêncio / focus | Pomodoro coletivo, sem voz (chat only) |

---

## 4. AWS — Serviços para a Sala Virtual

| Serviço | Função | Custo estimado |
|---------|--------|---------------|
| **API Gateway WebSocket** | Conexões real-time (posição, ações) | ~$3.50/milhão msgs |
| **Lambda** | Processa msgs, broadcast, lógica de sala | ~$5/mês |
| **DynamoDB** | Posições real-time (TTL 5min), estado salas | ~$10/mês |
| **Aurora** | Perfil avatar, inventário, histórico | (já existe) |
| **S3 + CloudFront** | Sprites, mapas, assets | ~$15/mês |
| **Cognito** | Auth (mesmo do AVA) | (já existe) |
| **LiveKit Cloud** | Voz WebRTC com spatial audio | ~$50/mês (10k min) |

**Total adicional:** ~$85/mês para 1.000 alunos simultâneos

---

## 5. Fluxo do Aluno

```
1. Aluno acessa /campus-virtual
   → Cognito autentica (mesmo JWT do AVA)
   → Carrega avatar customizado (S3)
   → Conecta WebSocket (API Gateway)
   → Conecta LiveKit Room (voz)

2. Entra no Hall Principal
   → Vê outros alunos online como avatares
   → Anda com WASD/setas
   → Ao se aproximar: ouve voz do outro (volume = f(distância))

3. Entra na sala "Empresa Júnior"
   → WebSocket: { type: "enter_room", roomId: "ej-admin" }
   → Servidor notifica os outros na sala
   → Mapa muda para o layout da EJ
   → LiveKit troca para Room "ej-admin" (voz separada)

4. Participa de evento no Auditório
   → Palestrante tem voz global (ignora proximidade)
   → Alunos na plateia: voz por proximidade entre si
   → Chat lateral para perguntas
   → Tela compartilhada (slides do palestrante)
```

---

## 6. Avatar System

### Customização (estilo Habbo)

| Parte | Opções |
|-------|--------|
| Corpo | 3 tons de pele |
| Cabelo | 12 estilos × 8 cores |
| Roupa (top) | 15 opções |
| Roupa (bottom) | 10 opções |
| Acessório | 8 (óculos, chapéu, mochila) |
| Expressão | 5 (neutro, feliz, focado, surpreso, sono) |

### Spritesheet

```
avatar_{body}_{hair}_{top}_{bottom}_{accessory}.png

Animações (frames):
- idle: 2 frames (respiração sutil)
- walk_north: 4 frames
- walk_south: 4 frames
- walk_east: 4 frames
- walk_west: 4 frames
- sit: 1 frame
- wave: 3 frames
- study: 2 frames (específico para AVA)
```

### Persistência (Aurora)

```sql
CREATE TABLE campus.avatars (
  student_id UUID PRIMARY KEY REFERENCES academic.students(id),
  body_type TEXT NOT NULL DEFAULT 'default',
  hair_style TEXT NOT NULL DEFAULT 'short_1',
  hair_color TEXT NOT NULL DEFAULT '#3b2f2f',
  top TEXT NOT NULL DEFAULT 'tshirt_blue',
  bottom TEXT NOT NULL DEFAULT 'jeans',
  accessory TEXT,
  display_name TEXT NOT NULL,
  last_position_x INT DEFAULT 0,
  last_position_y INT DEFAULT 0,
  last_room TEXT DEFAULT 'hall',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Integração com o AVA

A sala virtual **não é separada** — é uma extensão do AVA:

```
┌─────────────────────────────────────────────────────────┐
│                      VITRU AVA                           │
│                                                         │
│  /                  → Dashboard (disciplinas, notas)    │
│  /perfil            → Perfil VARK + avatar              │
│  /recomendacoes     → IA recomenda estudo               │
│  /comunidade        → Lista de grupos (join)            │
│  /campus-virtual    → SALA 2D COM AVATARES E VOZ  ←←←  │
│  /calendario        → Planner de estudo                 │
│  /disciplinas/*     → Trilha de aprendizagem            │
│                                                         │
│  [Chat Agentforce]  → Assistente IA (em todas as pgs)   │
└─────────────────────────────────────────────────────────┘
```

**Dados compartilhados:**
- Login = mesmo (Cognito)
- Perfil = mesmo (Aurora)
- Comunidades = mesmas (entra pelo /comunidade ou pela sala virtual)
- Risk Score = participar da sala reduz risco
- Agentforce = disponível dentro da sala (chat overlay)

---

## 8. Voz por Proximidade — Detalhamento Técnico

### LiveKit (recomendado)

```typescript
// Conecta ao LiveKit Room da sala atual
import { Room, RoomEvent, Track } from "livekit-client";

const room = new Room();
await room.connect(LIVEKIT_URL, token);

// Publica áudio do mic local
const localTrack = await room.localParticipant.setMicrophoneEnabled(true);

// Para cada participante remoto, ajusta volume pela distância
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === Track.Kind.Audio) {
    const audioElement = track.attach();
    // Volume será controlado pelo proximity loop
    proximityManager.addPeer(participant.identity, audioElement);
  }
});

// Loop de proximidade (30fps)
setInterval(() => {
  const myPos = getMyAvatarPosition();
  for (const [peerId, peer] of proximityManager.peers) {
    const peerPos = getPeerPosition(peerId);
    const dist = distance(myPos, peerPos);
    const vol = Math.max(0, 1 - dist / HEARING_RADIUS);
    peer.audioElement.volume = vol;
  }
}, 33);
```

### Regras de Voz

| Contexto | Comportamento |
|----------|--------------|
| Andando pelo mapa | Voz por proximidade (raio 150px) |
| Sentado em mesa de reunião | Todos na mesa se ouvem a 100% |
| Auditório (palestrante) | Voz global para toda a sala |
| Auditório (plateia) | Proximidade normal entre si |
| Sala de Estudo | Voz desabilitada (chat only) |

---

## 9. Custo e Escalabilidade

| Cenário | Alunos simultâneos | Custo/mês |
|---------|-------------------|-----------|
| MVP/Demo | 50 | ~$30 |
| Piloto | 500 | ~$85 |
| Produção | 5.000 | ~$400 |
| Escala total | 50.000 | ~$2.500 |

**Bottleneck:** Voz (LiveKit) é o mais caro. Otimizações:
- Só abre mic quando tecla pressionada (push-to-talk opcional)
- Limite de peers com áudio ativo por sala = 20
- Salas menores (máx 30 pessoas) reduzem broadcast

---

## 10. Stack Técnica Resumida

| Camada | Tecnologia |
|--------|-----------|
| Renderização 2D | PixiJS ou Phaser 3 |
| Mapas | Tiled Map Editor → JSON |
| Movimento | Keyboard + pathfinding (A*) |
| Real-time sync | API Gateway WebSocket + Lambda |
| Estado | DynamoDB (posições) + Aurora (perfil avatar) |
| Voz | LiveKit Cloud (WebRTC SFU + spatial audio) |
| Assets | S3 + CloudFront |
| Auth | Cognito (compartilhado com AVA) |
| Frontend | React component embarcado no Next.js |

---

## 11. Roadmap de Implementação

| Fase | Entrega | Prazo |
|------|---------|-------|
| 1 | Mapa básico + avatar andando + WebSocket sync | 2 semanas |
| 2 | Voz por proximidade (LiveKit) | 1 semana |
| 3 | Salas temáticas (EJ, Pesquisa, Atlética) | 1 semana |
| 4 | Customização de avatar | 1 semana |
| 5 | Eventos ao vivo (auditório) | 2 semanas |
| 6 | Integração com risk score + Agentforce | 1 semana |

**Total:** ~8 semanas para versão completa

---

## 12. Impacto na Retenção

| Métrica | Sem sala virtual | Com sala virtual |
|---------|-----------------|-----------------|
| Sensação de isolamento | 25% reportam | Estimativa: <10% |
| Participação em comunidade | 15% dos alunos | Estimativa: 45% |
| Risk score médio (social) | 50/100 | Estimativa: 25/100 |
| Tempo médio no AVA/dia | 12 min | Estimativa: 25 min |

> A presença virtual cria **pertencimento**. Pertencimento reduz evasão.
