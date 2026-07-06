import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { saveChatMessage } from "../models/chat.model";
import { addParticipant, removeParticipant } from "../models/participant.model";
import { updateMeetingStatus, getMeetingByCode } from "../models/meeting.model";

type SignalPayload = {
    roomId: string;
    to: string;
    description?: Record<string, unknown>;
    candidate?: Record<string, unknown>;
};

// Map roomId -> Set of { socketId, userId, name }
type Participant = { socketId: string, userId?: string | undefined, name?: string | undefined };
const rooms = new Map<string, Set<Participant>>();

const getAllowedOrigins = () => {
    const configured = process.env.FRONTEND_URL || process.env.FRONT_URI;
    const defaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
    return (configured ? configured.split(",") : defaults).map((origin) => origin.trim()).filter(Boolean);
};

const removeFromRooms = async (socket: Socket) => {
    for (const [roomId, participants] of rooms.entries()) {
        const participant = Array.from(participants).find(p => p.socketId === socket.id);
        if (participant) {
            participants.delete(participant);
            socket.to(roomId).emit("participant:left", { socketId: socket.id });

            if (participant.userId) {
                 try {
                     const meeting = await getMeetingByCode(roomId);
                     if (meeting) {
                         await removeParticipant(meeting.id, Number(participant.userId));
                     }
                 } catch (e) {
                     console.error("Failed to update participant left_at", e);
                 }
            }

            if (participants.size === 0) {
                rooms.delete(roomId);
            }
        }
    }
};

export const connectToSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                if (!origin || process.env.NODE_ENV === 'development') {
                    callback(null, true);
                } else {
                    const allowed = getAllowedOrigins().includes(origin);
                    callback(null, allowed);
                }
            },
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on("room:create", (callback?: (payload: { roomId: string }) => void) => {
            const roomId = crypto.randomUUID().slice(0, 12);
            callback?.({ roomId });
        });

        socket.on("room:join", async ({ roomId, userId, name }: { roomId?: string, userId?: string, name?: string }, callback?: (payload: { participants: { socketId: string; name: string | undefined; userId: string | undefined }[] }) => void) => {
            if (!roomId || typeof roomId !== "string" || roomId.length === 0 || roomId.length > 64) {
                callback?.({ participants: [] });
                return;
            }

            const participants = rooms.get(roomId) ?? new Set<Participant>();
            
            if (participants.size >= 10) {
                callback?.({ participants: [] });
                return;
            }

            const existingParticipants = Array.from(participants).map(p => ({ socketId: p.socketId, name: p.name, userId: p.userId }));
            
            const newParticipant = { socketId: socket.id, userId, name };
            participants.add(newParticipant);
            rooms.set(roomId, participants);
            socket.join(roomId);

            if (userId) {
                try {
                    const meeting = await getMeetingByCode(roomId);
                    if (meeting) {
                        await addParticipant(meeting.id, Number(userId));
                    }
                } catch (e) {
                    console.error("Failed to add participant to DB", e);
                }
            }

            socket.to(roomId).emit("participant:joined", { socketId: socket.id, userId, name });
            callback?.({ participants: existingParticipants });
        });

        // WebRTC Signaling
        socket.on("offer", ({ roomId, to, description }: SignalPayload) => {
            socket.to(to).emit("offer", { from: socket.id, roomId, description });
        });

        socket.on("answer", ({ roomId, to, description }: SignalPayload) => {
            socket.to(to).emit("answer", { from: socket.id, roomId, description });
        });

        socket.on("ice-candidate", ({ roomId, to, candidate }: SignalPayload) => {
            socket.to(to).emit("ice-candidate", { from: socket.id, roomId, candidate });
        });

        // Chat
        socket.on("message:send", async ({ roomId, text, senderName, userId }: { roomId: string; text: string; senderName: string, userId?: string }) => {
            if (!text || !text.trim() || text.length > 2000) return;

            const messagePayload = {
                id: crypto.randomUUID(),
                sender: senderName,
                text: text.trim(),
                time: new Date().toISOString(),
                userId
            };

            socket.to(roomId).emit("message:received", messagePayload);

            if (userId) {
                try {
                    const meeting = await getMeetingByCode(roomId);
                    if (meeting) {
                        await saveChatMessage(meeting.id, Number(userId), text.trim());
                    }
                } catch (e) {
                    console.error("Failed to save chat message", e);
                }
            }
        });

        socket.on("chat:typing", ({ roomId, name }: { roomId: string, name: string }) => {
            socket.to(roomId).emit("chat:typing", { name });
        });

        socket.on("media:state", ({ roomId, camOn, micOn }: { roomId: string, camOn: boolean, micOn: boolean }) => {
            socket.to(roomId).emit("media:state", { socketId: socket.id, camOn, micOn });
        });

        // Host controls
        socket.on("room:end", async ({ roomId }: { roomId: string }) => {
            io.to(roomId).emit("room:ended");
            const participants = rooms.get(roomId);
            if (participants) {
                for (const p of participants) {
                    const participantSocket = io.sockets.sockets.get(p.socketId);
                    if (participantSocket) {
                        participantSocket.leave(roomId);
                    }
                }
                rooms.delete(roomId);
            }
            try {
                const meeting = await getMeetingByCode(roomId);
                if (meeting) {
                    await updateMeetingStatus(meeting.id, 'completed');
                }
            } catch (e) {
                console.error("Failed to end meeting in DB", e);
            }
        });

        // Extras
        socket.on("participant:raise_hand", ({ roomId, name }: { roomId: string, name: string }) => {
            socket.to(roomId).emit("participant:raise_hand", { name });
        });

        socket.on("room:leave", () => {
            removeFromRooms(socket);
        });

        socket.on("disconnecting", () => {
            removeFromRooms(socket);
        });
    });

    return io;
};
