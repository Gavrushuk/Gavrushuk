import type { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/RoomManager';

let intervalStarted = false;
let currentIo: Server | null = null;

const emitRoomState = (io: Server, code: string): void => {
  const room = roomManager.getRoom(code);
  if (room) {
    io.to(code).emit('room_state', room);
  }
};

const ensureTicker = (io: Server): void => {
  currentIo = io;
  if (intervalStarted) {
    return;
  }
  intervalStarted = true;

  setInterval(() => {
    if (!currentIo) {
      return;
    }
    for (const code of roomManager.getRoomCodes()) {
      roomManager.tick(code);
      emitRoomState(currentIo, code);
    }
  }, 1000);
};

export const registerHandlers = (io: Server, socket: Socket): void => {
  ensureTicker(io);

  socket.on('create_room', ({ playerName }: { playerName: string }) => {
    try {
      const code = roomManager.createRoom(socket.id, playerName);
      socket.join(code);
      emitRoomState(io, code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to create room');
    }
  });

  socket.on('join_room', ({ code, playerName }: { code: string; playerName: string }) => {
    try {
      const room = roomManager.joinRoom(code, socket.id, playerName);
      socket.join(room.code);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to join room');
    }
  });

  socket.on('toggle_ready', ({ code }: { code: string }) => {
    try {
      const room = roomManager.toggleReady(code, socket.id);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to toggle ready state');
    }
  });

  socket.on('start_game', ({ code }: { code: string }) => {
    try {
      const room = roomManager.getRoom(code);
      if (!room) {
        throw new Error('Room not found');
      }
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player?.isHost) {
        throw new Error('Only the host can start the game');
      }
      if (room.players.filter((entry) => entry.isReady).length < 2) {
        throw new Error('At least two players must be ready');
      }
      roomManager.startGame(code);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to start game');
    }
  });

  socket.on('hide_objects', ({ code, objectIds }: { code: string; objectIds: string[] }) => {
    try {
      const room = roomManager.getRoom(code);
      const player = room?.players.find((entry) => entry.id === socket.id);
      if (!room || !player?.isHider) {
        throw new Error('Only the hider can choose hidden objects');
      }
      roomManager.setHiddenObjects(code, objectIds);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to hide objects');
    }
  });

  socket.on('send_chat', ({ code, text, taggedObjectId }: { code: string; text: string; taggedObjectId?: string }) => {
    try {
      const payload = roomManager.addChatMessage(code, socket.id, text, taggedObjectId);
      if (payload.broadcast) {
        io.to(payload.room.code).emit('chat_message', payload.message);
      }
      emitRoomState(io, payload.room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to send chat message');
    }
  });

  socket.on('send_camera', ({ code, azimuth }: { code: string; azimuth: number }) => {
    const room = roomManager.getRoom(code);
    const player = room?.players.find((entry) => entry.id === socket.id);
    if (!room || !player?.isHider) {
      return;
    }
    socket.to(room.code).emit('hider_camera', azimuth);
  });

  socket.on('submit_vote', ({ code, objectIds }: { code: string; objectIds: string[] }) => {
    try {
      const room = roomManager.submitIndividualVote(code, socket.id, objectIds);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to submit vote');
    }
  });

  socket.on('submit_collective_vote', ({ code, objectIds }: { code: string; objectIds: string[] }) => {
    try {
      const room = roomManager.getRoom(code);
      const player = room?.players.find((entry) => entry.id === socket.id);
      if (!room || player?.isHider) {
        throw new Error('Only seekers can submit the final vote');
      }
      roomManager.submitCollectiveVote(code, objectIds);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to submit collective vote');
    }
  });

  socket.on('rate_hider', ({ code, rating }: { code: string; rating: number }) => {
    try {
      const room = roomManager.rateHider(code, rating);
      emitRoomState(io, room.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to rate hider');
    }
  });

  socket.on('play_again', ({ code }: { code: string }) => {
    try {
      const room = roomManager.getRoom(code);
      const player = room?.players.find((entry) => entry.id === socket.id);
      if (!room || !player?.isHost) {
        throw new Error('Only the host can restart the room');
      }
      const resetRoom = roomManager.resetRoom(code);
      emitRoomState(io, resetRoom.code);
    } catch (error) {
      socket.emit('server_error', error instanceof Error ? error.message : 'Unable to reset room');
    }
  });

  socket.on('disconnect', () => {
    const roomCode = roomManager.removePlayer(socket.id);
    if (roomCode) {
      emitRoomState(io, roomCode);
    }
  });
};
