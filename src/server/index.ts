import dgram from 'dgram';
import net from 'net';
import { log, logChain, moduleRemoteLog } from '../log';

const udp_server = dgram.createSocket('udp6');

log('Server Started.');

// UDP: 接收数据
udp_server.on('message', (msg, rinfo) => {
  moduleRemoteLog('UDP', `${rinfo.port}`, logChain('收到数据', msg));
  udp_server.send('Hello, UDP Client', rinfo.port, rinfo.address);
});

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

  // 接收数据
  socket.on('data', (data) => {
    log(logChain('收到数据', data));
    // 发送数据
    socket.write('Hello, TCP Client');
  });

  // 处理连接断开
  socket.on('end', () => {
    log('已断开连接');
  });
});

// 服务器监听端口
tcp_server.listen(33200, () => {
  log('TCP 服务器正在监听 33200 端口');
});
