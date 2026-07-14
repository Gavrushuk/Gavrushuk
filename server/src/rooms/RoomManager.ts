import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ObjectItem3D, Player, RoomState } from '../../../shared/types';

const MAX_PLAYERS = 10;
const HIDE_COUNT = 5;
const HIDING_TIME = 60;
const SEARCHING_TIME = 300;
const INDIVIDUAL_VOTE_TIME = 60;
const COLLECTIVE_VOTE_TIME = 45;

const OBJECTS_LIST: ObjectItem3D[] = [
  { id: 'lamp', name: 'Lamp', position: [-4, 1, -2], shape: 'cylinder', color: '#f5c542', scale: [0.3, 2, 0.3] },
  { id: 'book', name: 'Book', position: [2, 0.1, 1], shape: 'box', color: '#8b4513', scale: [0.4, 0.05, 0.3] },
  { id: 'vase', name: 'Vase', position: [3, 0.4, -2.5], shape: 'cylinder', color: '#4a90d9', scale: [0.3, 0.8, 0.3] },
  { id: 'clock', name: 'Clock', position: [0, 2.5, -2.9], shape: 'sphere', color: '#888', scale: [0.4, 0.4, 0.1] },
  { id: 'mirror', name: 'Mirror', position: [-3, 2, -2.9], shape: 'box', color: '#c8e6fa', scale: [0.8, 1.2, 0.05] },
  { id: 'rug', name: 'Rug', position: [0, 0.01, 0], shape: 'box', color: '#c0392b', scale: [3, 0.02, 2] },
  { id: 'plant', name: 'Plant', position: [4, 0.8, 2.5], shape: 'sphere', color: '#27ae60', scale: [0.6, 0.8, 0.6] },
  { id: 'sofa', name: 'Sofa', position: [0, 0.5, 2.5], shape: 'box', color: '#7d6e83', scale: [2.5, 0.8, 0.9] },
  { id: 'table', name: 'Table', position: [0, 0.4, 0.5], shape: 'box', color: '#8b6914', scale: [1.5, 0.05, 0.8] },
  { id: 'candle', name: 'Candle', position: [1, 0.5, 0.5], shape: 'cylinder', color: '#fff9c4', scale: [0.08, 0.3, 0.08] },
  { id: 'photo', name: 'Photo Frame', position: [2, 2.2, -2.9], shape: 'box', color: '#bfa07a', scale: [0.5, 0.7, 0.05] },
  { id: 'cushion', name: 'Cushion', position: [-1, 0.9, 2.5], shape: 'box', color: '#e74c3c', scale: [0.5, 0.2, 0.5] },
  { id: 'cup', name: 'Cup', position: [-0.3, 0.5, 0.5], shape: 'cylinder', color: '#fff', scale: [0.12, 0.2, 0.12] },
  { id: 'remote', name: 'Remote', position: [0.5, 0.9, 2.5], shape: 'box', color: '#333', scale: [0.1, 0.04, 0.25] },
  { id: 'cactus', name: 'Cactus', position: [-4, 0.7, 2], shape: 'cylinder', color: '#2ecc71', scale: [0.2, 1.4, 0.2] },
  { id: 'painting', name: 'Painting', position: [0, 2.5, -2.9], shape: 'box', color: '#e67e22', scale: [1.2, 0.8, 0.05] },
  { id: 'bookshelf', name: 'Bookshelf', position: [4.5, 1.2, -2.5], shape: 'box', color: '#5d4037', scale: [0.4, 2.4, 1] },
  { id: 'lamp2', name: 'Floor Lamp', position: [-3.5, 1.5, 2], shape: 'cylinder', color: '#ffeaa7', scale: [0.2, 3, 0.2] },
  { id: 'shoe', name: 'Shoe', position: [2.5, 0.15, 2.8], shape: 'box', color: '#2c3e50', scale: [0.3, 0.15, 0.5] },
  { id: 'key', name: 'Key', position: [0.2, 0.47, 0.5], shape: 'sphere', color: '#f1c40f', scale: [0.07, 0.07, 0.07] },
];

const cloneObjects = (): ObjectItem3D[] =>
  OBJECTS_LIST.map((object) => ({
    ...object,
    position: [...object.position] as [number, number, number],
    rotation: object.rotation ? ([...object.rotation] as [number, number, number]) : undefined,
    scale: object.scale ? ([...object.scale] as [number, number, number]) : undefined,
    mentionCount: 0,
  }));

const uniqueFive = (objectIds: string[]): string[] => Array.from(new Set(objectIds)).slice(0, HIDE_COUNT);

const sampleObjects = (objects: ObjectItem3D[]): string[] =>
  [...objects]
    .sort(() => Math.random() - 0.5)
    .slice(0, HIDE_COUNT)
    .map((item) => item.id);

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerRooms = new Map<string, string>();

  createRoom(hostId: string, hostName: string): string {
    const code = this.generateCode();
    const host: Player = {
      id: hostId,
      name: hostName.trim() || 'Host',
      isHost: true,
      isHider: false,
      isReady: false,
      score: 0,
    };

    this.rooms.set(code, {
      code,
      phase: 'LOBBY',
      players: [host],
      objects: cloneObjects(),
      timeRemaining: 0,
      hiddenObjectIds: [],
      suspectedCounts: {},
      individualVotes: {},
      collectiveNominations: [],
      collectiveFinalVotes: [],
      chat: [],
      debriefMessages: [],
      seekerWin: null,
      halfwayRevealed: false,
      halfwayCount: null,
    });
    this.playerRooms.set(hostId, code);
    return code;
  }

  joinRoom(code: string, playerId: string, playerName: string): RoomState {
    const normalizedCode = code.toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.players.length >= MAX_PLAYERS) {
      throw new Error('Room is full');
    }
    if (room.phase !== 'LOBBY') {
      throw new Error('Game already in progress');
    }
    if (room.players.some((player) => player.id === playerId)) {
      return room;
    }

    room.players.push({
      id: playerId,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      isHost: false,
      isHider: false,
      isReady: false,
      score: 0,
    });
    this.playerRooms.set(playerId, normalizedCode);
    return room;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomCodeForPlayer(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  getRoomCodes(): string[] {
    return [...this.rooms.keys()];
  }

  toggleReady(code: string, playerId: string): RoomState {
    const room = this.requireRoom(code);
    const player = this.requirePlayer(room, playerId);
    if (room.phase !== 'LOBBY') {
      throw new Error('Ready state can only be changed in the lobby');
    }
    player.isReady = !player.isReady;
    return room;
  }

  removePlayer(playerId: string): string | undefined {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) {
      return undefined;
    }

    const room = this.rooms.get(roomCode);
    this.playerRooms.delete(playerId);
    if (!room) {
      return roomCode;
    }

    room.players = room.players.filter((player) => player.id !== playerId);
    delete room.individualVotes[playerId];

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return roomCode;
    }

    if (!room.players.some((player) => player.isHost)) {
      room.players[0].isHost = true;
    }
    if (!room.players.some((player) => player.isHider) && room.phase !== 'LOBBY') {
      room.players[Math.floor(Math.random() * room.players.length)].isHider = true;
    }

    return roomCode;
  }

  startGame(code: string): RoomState {
    const room = this.requireRoom(code);
    if (room.phase !== 'LOBBY') {
      throw new Error('Game already started');
    }
    if (room.players.length < 2) {
      throw new Error('At least 2 players are required');
    }

    room.players.forEach((player) => {
      player.isHider = false;
      player.isReady = false;
    });
    room.players[Math.floor(Math.random() * room.players.length)].isHider = true;
    room.phase = 'HIDING';
    room.timeRemaining = HIDING_TIME;
    room.hiddenObjectIds = [];
    room.individualVotes = {};
    room.collectiveNominations = [];
    room.collectiveFinalVotes = [];
    room.chat = [];
    room.debriefMessages = [];
    room.suspectedCounts = {};
    room.halfwayRevealed = false;
    room.halfwayCount = null;
    room.seekerWin = null;
    room.objects = cloneObjects();
    return room;
  }

  setHiddenObjects(code: string, objectIds: string[]): RoomState {
    const room = this.requireRoom(code);
    if (room.phase !== 'HIDING') {
      throw new Error('Objects can only be hidden during the hiding phase');
    }
    const pickedIds = uniqueFive(objectIds);
    if (pickedIds.length !== HIDE_COUNT) {
      throw new Error('Exactly 5 objects must be hidden');
    }
    if (!pickedIds.every((id) => room.objects.some((object) => object.id === id))) {
      throw new Error('One or more selected objects are invalid');
    }
    room.hiddenObjectIds = pickedIds;
    room.phase = 'SEARCHING';
    room.timeRemaining = SEARCHING_TIME;
    room.halfwayRevealed = false;
    room.halfwayCount = null;
    return room;
  }

  tick(code: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room || room.phase === 'LOBBY' || room.phase === 'RESULTS') {
      return room;
    }

    room.timeRemaining = Math.max(0, room.timeRemaining - 1);

    if (room.phase === 'SEARCHING' && !room.halfwayRevealed && room.timeRemaining === SEARCHING_TIME / 2) {
      room.halfwayRevealed = true;
      room.halfwayCount = room.hiddenObjectIds.filter((id) => (room.suspectedCounts[id] ?? 0) > 0).length;
    }

    if (room.timeRemaining > 0) {
      return room;
    }

    if (room.phase === 'HIDING') {
      const finalIds =
        room.hiddenObjectIds.length === HIDE_COUNT
          ? room.hiddenObjectIds
          : sampleObjects(room.objects);
      return this.setHiddenObjects(room.code, finalIds);
    }
    if (room.phase === 'SEARCHING') {
      room.phase = 'INDIVIDUAL_VOTE';
      room.timeRemaining = INDIVIDUAL_VOTE_TIME;
      return room;
    }
    if (room.phase === 'INDIVIDUAL_VOTE') {
      return this.finishIndividualVote(room);
    }
    if (room.phase === 'COLLECTIVE_VOTE') {
      const fallback = room.collectiveNominations.length
        ? room.collectiveNominations.slice(0, HIDE_COUNT)
        : this.rankObjects(room).slice(0, HIDE_COUNT).map(([id]) => id);
      return this.submitCollectiveVote(room.code, fallback);
    }

    return room;
  }

  submitIndividualVote(code: string, playerId: string, objectIds: string[]): RoomState {
    const room = this.requireRoom(code);
    if (room.phase !== 'INDIVIDUAL_VOTE') {
      throw new Error('Individual voting is not active');
    }
    const player = this.requirePlayer(room, playerId);
    if (player.isHider) {
      throw new Error('Hider cannot vote');
    }

    const vote = uniqueFive(objectIds);
    if (vote.length !== HIDE_COUNT) {
      throw new Error('Exactly 5 objects must be selected');
    }
    room.individualVotes[playerId] = vote;
    const seekers = room.players.filter((entry) => !entry.isHider);
    const allVotesIn = seekers.every((entry) => (room.individualVotes[entry.id] ?? []).length === HIDE_COUNT);
    if (allVotesIn) {
      return this.finishIndividualVote(room);
    }
    return room;
  }

  submitCollectiveVote(code: string, objectIds: string[]): RoomState {
    const room = this.requireRoom(code);
    if (room.phase !== 'COLLECTIVE_VOTE') {
      throw new Error('Collective voting is not active');
    }
    const finalVotes = uniqueFive(objectIds);
    if (finalVotes.length !== HIDE_COUNT) {
      throw new Error('Exactly 5 objects must be selected');
    }
    room.collectiveFinalVotes = finalVotes;
    room.seekerWin = room.hiddenObjectIds.every((objectId) => finalVotes.includes(objectId));
    room.phase = 'RESULTS';
    room.timeRemaining = 0;

    room.players.forEach((player) => {
      if (player.isHider) {
        if (!room.seekerWin) {
          player.score += HIDE_COUNT;
        }
        return;
      }

      const vote = room.individualVotes[player.id] ?? [];
      player.score += vote.filter((id) => room.hiddenObjectIds.includes(id)).length;
    });

    return room;
  }

  resetRoom(code: string): RoomState {
    const room = this.requireRoom(code);
    room.phase = 'LOBBY';
    room.timeRemaining = 0;
    room.hiddenObjectIds = [];
    room.suspectedCounts = {};
    room.individualVotes = {};
    room.collectiveNominations = [];
    room.collectiveFinalVotes = [];
    room.chat = [];
    room.debriefMessages = [];
    room.seekerWin = null;
    room.halfwayRevealed = false;
    room.halfwayCount = null;
    room.objects = cloneObjects();
    room.players.forEach((player) => {
      player.isReady = false;
      player.isHider = false;
      player.hiderRating = undefined;
    });
    return room;
  }

  addChatMessage(code: string, playerId: string, text: string, taggedObjectId?: string): { room: RoomState; message: ChatMessage; broadcast: boolean } {
    const room = this.requireRoom(code);
    const player = this.requirePlayer(room, playerId);
    const trimmedText = text.trim();
    if (!trimmedText && !taggedObjectId) {
      throw new Error('Message cannot be empty');
    }
    const message: ChatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      text: trimmedText || `Tagged ${taggedObjectId}`,
      taggedObjectId,
      timestamp: Date.now(),
    };

    const isSilentHider = player.isHider && room.phase === 'SEARCHING';
    if (isSilentHider) {
      room.debriefMessages.push(message);
      return { room, message, broadcast: false };
    }

    room.chat.push(message);
    if (taggedObjectId) {
      const object = room.objects.find((entry) => entry.id === taggedObjectId);
      if (object) {
        object.mentionCount = (object.mentionCount ?? 0) + 1;
        room.suspectedCounts[taggedObjectId] = (room.suspectedCounts[taggedObjectId] ?? 0) + 1;
      }
    }
    return { room, message, broadcast: true };
  }

  rateHider(code: string, rating: number): RoomState {
    const room = this.requireRoom(code);
    const hider = room.players.find((player) => player.isHider);
    if (!hider) {
      throw new Error('No hider in room');
    }
    hider.hiderRating = Math.max(1, Math.min(5, Math.round(rating)));
    return room;
  }

  private finishIndividualVote(room: RoomState): RoomState {
    room.phase = 'COLLECTIVE_VOTE';
    room.timeRemaining = COLLECTIVE_VOTE_TIME;
    room.collectiveNominations = this.rankObjects(room).slice(0, HIDE_COUNT * 2).map(([id]) => id);
    room.collectiveFinalVotes = [];
    return room;
  }

  private rankObjects(room: RoomState): Array<[string, number]> {
    const scores = new Map<string, number>();

    room.objects.forEach((object) => {
      scores.set(object.id, room.suspectedCounts[object.id] ?? object.mentionCount ?? 0);
    });

    Object.values(room.individualVotes).forEach((votes) => {
      votes.forEach((objectId) => scores.set(objectId, (scores.get(objectId) ?? 0) + 1));
    });

    return [...scores.entries()].sort((left, right) => right[1] - left[1]);
  }

  private requireRoom(code: string): RoomState {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  private requirePlayer(room: RoomState, playerId: string): Player {
    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    return player;
  }

  private generateCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }
}

export const roomManager = new RoomManager();
