import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger.util';

class SocketService {
    private io: SocketIOServer | null = null;

    /**
     * Socket.io serverini initialize qiladi
     * @param server Node.js HTTP Server instance
     */
    public initialize(server: HttpServer): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*', // frontend manzili (ishlab chiqarishda o'zgartiriladi)
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info(`🔌 Yangi mijoz ulandi: ${socket.id}`);

            socket.on('disconnect', () => {
                logger.info(`🔌 Mijoz uzildi: ${socket.id}`);
            });

            // Masalan: alohida xonalarga qo'shilish uchun (role based)
            socket.on('join_room', (room: string) => {
                socket.join(room);
                logger.info(`Mijoz ${socket.id} xonaga qo'shildi: ${room}`);
            });
        });

        logger.info('🚀 Socket.io muvaffaqiyatli ishga tushdi');
    }

    /**
     * Barcha mijozlarga event yuborish
     * @param event Event nomi (masalan: 'PAYMENT_RECEIVED')
     * @param data Ma'lumot (object)
     */
    public emitEvent(event: string, data: any): void {
        if (!this.io) {
            logger.warn(`Emit '${event}' bekor qilindi, Socket.io yoniq emas!`);
            return;
        }
        this.io.emit(event, data);
    }

    /**
     * Faqat ma'lum bir xonadagilarga (masalan: adminlarga)
     */
    public emitToRoom(room: string, event: string, data: any): void {
        if (!this.io) return;
        this.io.to(room).emit(event, data);
    }
}

export const socketService = new SocketService();
