import dgram from 'dgram';
import net from 'net';
import readline from 'readline';
import { log, logChain, moduleLog, moduleRemoteLog } from '../log';

const udp_client = dgram.createSocket('udp6');
const udp_client_port = Math.floor(Math.random() * 100) + 33100;

async function main() {
  log('Client Started.');

  // UDP: 监听端口
  udp_client.bind(udp_client_port, () => {
    log(`UDP 客户端正在监听 ${udp_client_port} 端口`);
  });

  // UDP: 接收数据
  udp_client.on('message', (msg, rinfo) => {
    const fromPort = rinfo.port;
    if (fromPort === 33100) {
      moduleRemoteLog('UDP', `服务器`, logChain('收到数据', msg));
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // UDP: 发送数据
  udp_client.send('Hello, UDP Server', 33100, '::1');

  // TCP: 连接到服务器
  const tcp_client = net.createConnection({ port: 33200 }, () => {
    moduleLog('TCP', '已连接');
    tcp_client.write('Hello, TCP Server');
  });

  // TCP: 接收服务器发送的数据
  tcp_client.on('data', (data) => {
    moduleLog('TCP', logChain('收到数据', data));
    // tcp_client.end();
  });

  // TCP: 处理连接断开
  tcp_client.on('end', () => {
    moduleLog('TCP', '已断开连接');
  });

  // 创建readline接口实例
  const rl = readline.createInterface({
    input: process.stdin,
  });

  // 监听用户输入
  rl.on('line', (input) => {
    // 当用户输入一行并按下Enter键后，这个事件会被触发
    log(logChain('用户输入', input));
  });

  // 处理用户的错误输入，例如EOF
  rl.on('close', () => {
    console.log('您已经结束输入。');
    process.exit(0); // 退出程序
  });
}

main();
