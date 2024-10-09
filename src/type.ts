type ITransportMessageType = 'ports' | 'port' | 'login' | 'register';

export interface ITransportMessage {
  type: ITransportMessageType;
  data: string;
}

export interface IClient {
  udp_port: number;
  userId: number;
}

export interface IUser {
  userId: number;
  username: string;
  password: string;
}

export function ConstructTransportMessage(
  type: ITransportMessageType,
  data: string
): string {
  return JSON.stringify({ type, data });
}

export function ParseTransportMessage(message: string): ITransportMessage {
  return JSON.parse(message);
}
