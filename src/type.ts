export interface TransportMessage {
  type: 'ports' | 'port';
  data: string;
}

export function ConstructTransportMessage(
  type: 'ports' | 'port',
  data: string
): string {
  return JSON.stringify({ type, data });
}

export function ParseTransportMessage(message: string): TransportMessage {
  return JSON.parse(message);
}