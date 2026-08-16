import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './campus3d/styles/main.css';
import './campus3d/styles/labels.css';
import { useVoiceOffice } from './voice/useVoiceOffice.js';
import { VoiceBar } from './voice/VoiceBar.jsx';
import { createCampusScene } from './campus3d/bootstrap.js';
import { RoomPanel } from './components/RoomPanel.jsx';
import { getRoomById } from './campus3d/campus/campusData.js';

function App() {
  const voice = useVoiceOffice();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('vo-display-name') || '');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomClickHandler, setRoomClickHandler] = useState(null);

  // Latest handler kept in a ref so the scene-boot effect (which must run
  // exactly once) never closes over a stale displayName/voice reference.
  const handleEnterRoomRef = useRef();
  handleEnterRoomRef.current = (roomId) => {
    // Primeiro mostra o painel da sala
    const room = getRoomById(roomId);
    if (room) {
      setSelectedRoom(room);
    }
  };

  // Função para entrar na sala (chamada pelo botão "Conhecer" do painel)
  const handleJoinRoom = (roomId) => {
    let name = displayName;
    if (!name) {
      name = window.prompt('Como você quer aparecer no canal de voz?', '')?.trim() || 'Anônimo';
      setDisplayName(name);
      localStorage.setItem('vo-display-name', name);
    }
    voice.joinRoom(roomId, name);
  };

  useEffect(() => {
    const scene = createCampusScene(containerRef.current, {
      onEnterRoom: (roomId) => handleEnterRoomRef.current(roomId),
    });
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  // Live occupancy from the voice server feeds straight into the 3D labels.
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const room of Object.values(voice.rooms)) {
      sceneRef.current.updateRoomOccupancy(room.id, room.count, room.maxParticipants);
    }
  }, [voice.rooms]);

  // Persistent green highlight on whichever room/zone the user is connected to.
  useEffect(() => {
    sceneRef.current?.setActiveRoomId(voice.currentRoomId);
  }, [voice.currentRoomId]);

  // Avatar clusters per room. For the room the user is currently in we have
  // the richer `participants` map (live speaking state); for every other
  // occupied room we only know identities via the room snapshot's `peers`
  // list (broadcast to everyone, not just people inside it) — still enough
  // to render who's there, just without a speaking indicator.
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const roomId of Object.keys(voice.rooms)) {
      if (roomId === voice.currentRoomId) {
        const peers = [...voice.participants.entries()].map(([id, info]) => ({
          id,
          displayName: info.displayName,
          speaking: info.speaking,
          isSelf: info.isSelf,
        }));
        sceneRef.current.updateRoomPeers(roomId, peers);
      } else {
        const peers = (voice.rooms[roomId]?.peers || []).map((p) => ({
          id: p.id,
          displayName: p.displayName,
        }));
        sceneRef.current.updateRoomPeers(roomId, peers);
      }
    }
  }, [voice.rooms, voice.participants, voice.currentRoomId]);

  // Helper para pegar participantes de uma sala específica
  const getParticipantsForRoom = (roomId) => {
    if (roomId === voice.currentRoomId) {
      return [...voice.participants.entries()].map(([id, info]) => ({
        id,
        roomId,
        displayName: info.displayName,
        speaking: info.speaking,
        isSelf: info.isSelf,
      }));
    } else {
      return (voice.rooms[roomId]?.peers || []).map((p) => ({
        id: p.id,
        roomId,
        displayName: p.displayName,
        speaking: false,
        isSelf: false,
      }));
    }
  };

  return (
    <>
      <div ref={containerRef} id="campus-scene-root" />

      {voice.error && <div className="voice-toast">{voice.error}</div>}

      {voice.currentRoomId && (
        <VoiceBar
          roomName={voice.rooms[voice.currentRoomId]?.name || voice.currentRoomId}
          participants={voice.participants}
          muted={voice.muted}
          onToggleMute={voice.toggleMute}
          onLeave={voice.leaveRoom}
        />
      )}

      {selectedRoom && (
        <RoomPanel
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onJoinRoom={handleJoinRoom}
          participants={getParticipantsForRoom(selectedRoom.id)}
          messages={getMockMessages(selectedRoom.id)}
          meetings={getMockMeetings(selectedRoom.id)}
          isConnected={voice.currentRoomId === selectedRoom.id}
          muted={voice.muted}
          onToggleMute={voice.toggleMute}
          onLeaveRoom={voice.leaveRoom}
        />
      )}
    </>
  );
}

// Mock data para mensagens (substituir por dados reais depois)
function getMockMessages(roomId) {
  const messages = {
    'design': [
      {
        author: 'Lívia Ramos',
        time: '09:42',
        text: 'Bom dia, pessoal! Preparei as telas do fluxo de onboarding pra crítica de hoje. Deixei tudo no board.',
        reactions: [{ emoji: '👍', count: 4 }]
      },
      {
        author: 'Natasha Lima',
        time: '09:44',
        text: 'Perfeito. Vamos revisar juntos daqui a pouco — abri a sala de vídeo aqui no canal.',
      },
      {
        author: 'Cameron Reis',
        time: '10:03',
        text: 'Chegando! Já vi o board, ficou muito bom.',
      }
    ],
    'auditorio': [
      {
        author: 'Prof. Carlos Silva',
        time: '14:00',
        text: 'Boa tarde! Hoje vamos falar sobre arquitetura de software.',
        reactions: [{ emoji: '👋', count: 12 }]
      },
      {
        author: 'Ana Paula',
        time: '14:05',
        text: 'Professor, vai disponibilizar os slides?',
      }
    ],
    'lab-informatica': [
      {
        author: 'Ricardo Tech',
        time: '11:20',
        text: 'Pessoal, configurei os ambientes de desenvolvimento. Todos podem testar.',
        reactions: [{ emoji: '🚀', count: 5 }]
      }
    ]
  };
  return messages[roomId] || [];
}

// Mock data para reuniões (substituir por dados reais depois)
function getMockMeetings(roomId) {
  const meetings = {
    'design': [
      {
        title: 'Crítica de Design',
        date: 'Terça-feira',
        time: '10:00 - 11:30',
        duration: '48m 12s',
        participants: ['Natasha Lima', 'Lívia Ramos', 'Cameron Reis', 'Pedro Santos'],
        hasButton: true,
        summary: [
          'Alinhamos a hierarquia visual da primeira tela de onboarding.',
          'Decisão: reduzir para 3 passos e adiar o tour interativo.'
        ]
      }
    ],
    'auditorio': [
      {
        title: 'Palestra de Arquitetura',
        date: 'Quarta-feira',
        time: '14:00 - 16:00',
        duration: '2h',
        participants: ['Prof. Carlos Silva', 'Ana Paula', 'João Victor', 'Maria Eduarda', 'Felipe Costa'],
        hasButton: false
      }
    ],
    'sala-projetos': [
      {
        title: 'Sprint Planning',
        date: 'Segunda-feira',
        time: '09:00 - 10:30',
        duration: '1h 30m',
        participants: ['Tech Lead', 'Product Owner', 'Equipe Dev'],
        hasButton: true,
        summary: [
          'Definimos as tarefas da sprint 12.',
          'Prioridade: finalizar módulo de autenticação.',
          'Estimativa: 34 story points.'
        ]
      }
    ]
  };
  return meetings[roomId] || [];
}

createRoot(document.getElementById('root')).render(<App />);
