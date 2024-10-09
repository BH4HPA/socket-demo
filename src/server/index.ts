import dgram from 'dgram';
import net from 'net';
import { log, logChain, moduleRemoteLog } from '../log';
import { ConstructTransportMessage, ParseTransportMessage } from '../type';
import { on } from 'events';

const udp_server = dgram.createSocket('udp6');

log('Server Started.');

const online_udp_ports: number[] = [];

// // UDP: 接收数据
// udp_server.on('message', (msg, rinfo) => {
//   moduleRemoteLog('UDP', `${rinfo.port}`, logChain('收到数据', msg));
//   udp_server.send('Hello, UDP Client', rinfo.port, rinfo.address);
// });

// UDP: 监听端口
udp_server.bind(33100, () => {
  log('UDP 服务器正在监听 33100 端口');
});

// TCP: 创建服务器
const tcp_server = net.createServer((socket) => {
  const log = (...message: any[]) => {
    moduleRemoteLog('TCP', `${socket.remotePort}`, ...message);
  };
  log('已连接');
  let udp_client_port = -1;

  // 接收数据
  socket.on('data', (raw_data) => {
    const data = ParseTransportMessage(raw_data.toString());
    log(logChain('收到数据', data.type, data.data));
    if (data.type === 'port') {
      // 发送数据
      udp_client_port = parseInt(data.data);
      udp_server.send('I know you!', udp_client_port, '::1');
      online_udp_ports.push(udp_client_port);
    }
  });

  // 处理连接断开
  socket.on('end', () => {
    log('已断开连接');
    if (udp_client_port !== -1) {
      online_udp_ports.splice(online_udp_ports.indexOf(udp_client_port), 1);
    }
  });

  setInterval(() => {
    socket.write(
      ConstructTransportMessage('ports', online_udp_ports.join(','))
    );
  }, 10000);
});

// 服务器监听端口
tcp_server.listen(33200, () => {
  log('TCP 服务器正在监听 33200 端口');
});

setInterval(() => {
  log('当前在线 UDP 端口', online_udp_ports.join(', '));
}, 10000);
