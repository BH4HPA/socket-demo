import dgram from 'dgram';
import net from 'net';
import readline from 'readline';
import { log, logChain, messageLog, moduleLog, moduleRemoteLog } from '../log';
import {
  ConstructTransportMessage,
  IClient,
  ParseTransportMessage,
} from '../type';
import { parse } from 'path';

const udp_client = dgram.createSocket('udp6');
const udp_client_port = Math.floor(Math.random() * 100) + 33100;

let current_online_udp_ports: number[] = [];
let current_online_clients: IClient[] = [];

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
      messageLog('服务器', msg.toString());
    } else {
      // moduleRemoteLog('UDP', `${fromPort}`, logChain('收到数据', msg));
      messageLog(
        current_online_clients.find((c) => c.udp_port === fromPort)?.username ||
          fromPort,
        msg.toString()
      );
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  // // UDP: 发送数据
  // udp_client.send('Hello, UDP Server', 33100, '::1');

  // TCP: 连接到服务器
  const tcp_client = net.createConnection({ port: 33200 }, async () => {
    moduleLog('TCP', '已连接');
    tcp_client.write(
      ConstructTransportMessage('port', udp_client_port.toString())
    );
  });

  // TCP: 接收服务器发送的数据
  tcp_client.on('data', (raw_data) => {
    const data = ParseTransportMessage(raw_data.toString());
    // moduleLog('TCP', logChain('收到数据', data.type, data.data));
    if (data.type === 'ports') {
      const ports = data.data.split(',');
      // moduleLog('TCP', logChain('在线 UDP 客户端端口', ports));
      current_online_udp_ports = ports.map((port) => parseInt(port));
    } else if (data.type === 'clients') {
      const clients = JSON.parse(data.data) as IClient[];
      // moduleLog('TCP', logChain('在线客户端', clients));
      current_online_clients = clients;
    }
  });

  // TCP: 处理连接断开
  tcp_client.on('end', () => {
    moduleLog('TCP', '已断开连接');
    process.exit(0);
  });

  // 创建readline接口实例
  const rl = readline.createInterface({
    input: process.stdin,
  });

  // 监听用户输入
  rl.on('line', (input) => {
    if (input.startsWith('/')) {
      // command
      const [command, ...args] = input.split(' ');
      if (command === '/login') {
        const [username, password] = args;
        tcp_client.write(
          ConstructTransportMessage('login', `${username} ${password}`)
        );
      } else if (command === '/register') {
        const [username, password] = args;
        tcp_client.write(
          ConstructTransportMessage('register', `${username} ${password}`)
        );
      } else if (command === '/list') {
        console.log('当前在线客户端：');
        for (const client of current_online_clients) {
          console.log(
            `- ${client.username}(${client.userId}) @ ${client.udp_port}`
          );
        }
      } else if (command === '/msg') {
        const [userId, ...message] = args;
        const targetClient = current_online_clients.find(
          (c) => c.userId === parseInt(userId)
        );
        if (targetClient) {
          udp_client.send(
            '(私聊) ' + message.join(' '),
            targetClient.udp_port,
            '::1'
          );
        } else {
          console.log('用户不在线');
        }
      }
    } else {
      for (const port of current_online_udp_ports) {
        udp_client.send(input, port, '::1');
      }
    }
  });

  // 处理用户的错误输入，例如EOF
  rl.on('close', () => {
    console.log('您已经结束输入。');
    process.exit(0); // 退出程序
  });
}

main();
