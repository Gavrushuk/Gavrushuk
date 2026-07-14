import { io } from 'socket.io-client';
import type { ChatMessage, RoomState } from '@shared/types';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { useGameStore } from '../store/gameStore';

type GameStore = ReturnType<typeof useGameStore.getState>;
type GameStoreHook = UseBoundStore<StoreApi<GameStore>>;

export const socket = io({ autoConnect: true });

export const createRoom = (playerName: string): void => {
  socket.emit('create_room', { playerName });
};
export const joinRoom = (code: string, playerName: string): void => {
  socket.emit('join_room', { code, playerName });
};
export const toggleReady = (code: string): void => {
  socket.emit('toggle_ready', { code });
};
export const startGame = (code: string): void => {
  socket.emit('start_game', { code });
};
export const hideObjects = (code: string, objectIds: string[]): void => {
  socket.emit('hide_objects', { code, objectIds });
};
export const sendChat = (code: string, text: string, taggedObjectId?: string): void => {
  socket.emit('send_chat', { code, text, taggedObjectId });
};
export const sendCamera = (code: string, azimuth: number): void => {
  socket.emit('send_camera', { code, azimuth });
};
export const submitVote = (code: string, objectIds: string[]): void => {
  socket.emit('submit_vote', { code, objectIds });
};
export const submitCollectiveVote = (code: string, objectIds: string[]): void => {
  socket.emit('submit_collective_vote', { code, objectIds });
};
export const rateHider = (code: string, rating: number): void => {
  socket.emit('rate_hider', { code, rating });
};
export const leaveRoom = (): void => {
  socket.emit('leave_room');
};
export const playAgain = (code: string): void => {
  socket.emit('play_again', { code });
};

let listenersInitialized = false;

export const initSocketListeners = (store: GameStoreHook): void => {
  if (listenersInitialized) {
    return;
  }
  listenersInitialized = true;

  socket.on('connect', () => {
    if (socket.id) {
      store.getState().setPlayerId(socket.id);
    }
  });

  socket.on('room_state', (roomState: RoomState) => {
    if (socket.id) {
      store.getState().setPlayerId(socket.id);
    }
    store.getState().setRoomState(roomState);
  });

  socket.on('chat_message', (message: ChatMessage) => {
    store.getState().addChatMessage(message);
  });

  socket.on('hider_camera', (azimuth: number) => {
    store.getState().setHiderAzimuth(azimuth);
  });
};
