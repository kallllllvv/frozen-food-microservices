import { io, Socket } from "socket.io-client";

type SocketContextPayload = {
  role?: string;
  email?: string;
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socket;
};

export const joinSocketContext = (payload: SocketContextPayload): void => {
  const activeSocket = getSocket();
  activeSocket.emit("join_context", payload);
};
