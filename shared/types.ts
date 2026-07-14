export type GamePhase =
  | 'LOBBY'
  | 'HIDING'
  | 'SEARCHING'
  | 'INDIVIDUAL_VOTE'
  | 'COLLECTIVE_VOTE'
  | 'RESULTS';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isHider: boolean;
  isReady: boolean;
  score: number;
  hiderRating?: number;
}

export interface ObjectItem3D {
  id: string;
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  shape: 'box' | 'sphere' | 'cylinder' | 'cone';
  color: string;
  mentionCount?: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  taggedObjectId?: string;
  timestamp: number;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Player[];
  objects: ObjectItem3D[];
  timeRemaining: number;
  hiddenObjectIds: string[];
  suspectedCounts: Record<string, number>;
  individualVotes: Record<string, string[]>;
  collectiveNominations: string[];
  collectiveFinalVotes: string[];
  chat: ChatMessage[];
  debriefMessages: ChatMessage[];
  seekerWin: boolean | null;
  halfwayRevealed: boolean;
  halfwayCount: number | null;
}
