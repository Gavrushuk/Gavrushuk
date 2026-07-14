import { create } from 'zustand';
import type { ChatMessage, RoomState } from '@shared/types';

interface GameStore {
  playerId: string;
  playerName: string;
  roomState: RoomState | null;
  chatMessages: ChatMessage[];
  hiderAzimuth: number | null;
  hoveredObjectId: string | null;
  selectedObjectIds: string[];
  myVote: string[] | null;
  hiderRating: number | null;
  setPlayerId: (playerId: string) => void;
  setPlayerName: (playerName: string) => void;
  setRoomState: (roomState: RoomState | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setHiderAzimuth: (azimuth: number | null) => void;
  setHoveredObject: (objectId: string | null) => void;
  toggleSelectedObject: (objectId: string) => void;
  clearSelection: () => void;
  setMyVote: (objectIds: string[] | null) => void;
  setHiderRating: (rating: number | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  playerId: '',
  playerName: '',
  roomState: null,
  chatMessages: [],
  hiderAzimuth: null,
  hoveredObjectId: null,
  selectedObjectIds: [],
  myVote: null,
  hiderRating: null,
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setRoomState: (roomState) =>
    set({
      roomState,
      chatMessages: roomState?.chat ?? [],
      hiderRating: roomState?.players.find((player) => player.isHider)?.hiderRating ?? null,
    }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  setHiderAzimuth: (hiderAzimuth) => set({ hiderAzimuth }),
  setHoveredObject: (hoveredObjectId) => set({ hoveredObjectId }),
  toggleSelectedObject: (objectId) =>
    set((state) => {
      if (state.selectedObjectIds.includes(objectId)) {
        return { selectedObjectIds: state.selectedObjectIds.filter((id) => id !== objectId) };
      }
      if (state.selectedObjectIds.length >= 5) {
        return state;
      }
      return { selectedObjectIds: [...state.selectedObjectIds, objectId] };
    }),
  clearSelection: () => set({ selectedObjectIds: [] }),
  setMyVote: (myVote) => set({ myVote }),
  setHiderRating: (hiderRating) => set({ hiderRating }),
}));
