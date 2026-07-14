import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type TokenPayload = { sub: string; organizationId: string; role: string };
type SocketData = { user?: TokenPayload };

@WebSocketGateway({
  namespace: 'workspace',
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private logger = new Logger(RealtimeGateway.name);
  constructor(private jwt: JwtService) {}
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) return client.disconnect();
      const payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'development-secret-change-me',
      });
      (client.data as SocketData).user = payload;
      await client.join(`organization:${payload.organizationId}`);
      client
        .to(`organization:${payload.organizationId}`)
        .emit('presence:online', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }
  handleDisconnect(client: Socket) {
    const payload = (client.data as SocketData).user;
    if (payload)
      client
        .to(`organization:${payload.organizationId}`)
        .emit('presence:offline', { userId: payload.sub });
  }
  emitToOrganization(organizationId: string, event: string, data: unknown) {
    this.server?.to(`organization:${organizationId}`).emit(event, data);
  }
  emitToUser(userId: string, event: string, data: unknown) {
    for (const socket of this.server?.sockets.sockets.values() ?? [])
      if ((socket.data as SocketData).user?.sub === userId)
        socket.emit(event, data);
  }
}
