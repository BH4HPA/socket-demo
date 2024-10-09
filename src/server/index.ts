import dgram from 'dgram';
import net from 'net';
import * as fs from 'fs';
import { log, logChain, moduleRemoteLog, styles } from '../log';
import {
  ConstructTransportMessage,
  IClient,
  IUser,
  ParseTransportMessage,
} from '../type';

const udp_server = dgram.createSocket('udp6');

log('Server Started.');

const users: IUser[] = JSON.parse(
  fs.readFileSync('./data/users.json').toString()
);
const online_clients: IClient[] = [];

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
  let requestLoginTimeoutId: NodeJS.Timeout | null = null;
  let requestTimes = 0;

  // 接收数据
  socket.on('data', (raw_data) => {
    const data = ParseTransportMessage(raw_data.toString());
    log(logChain('收到数据', data.type, data.data));
    if (data.type === 'port') {
      // 发送数据
      udp_client_port = parseInt(data.data);
      udp_server.send(
        `请使用 ${styles.underline('/login <username> <password>')} 来登录`,
        udp_client_port,
        '::1'
      );

      udp_server.send(
        `也可以使用 ${styles.underline(
          '/register <username> <password>'
        )} 来注册`,
        udp_client_port,
        '::1'
      );
      requestLoginTimeoutId = setInterval(() => {
        requestTimes++;
        if (requestTimes > 60)
          if (requestLoginTimeoutId) {
            clearInterval(requestLoginTimeoutId);
            udp_server.send(
              '很抱歉，由于登录超时，您的连接已被断开。',
              udp_client_port,
              '::1'
            );
            socket.end();
          }
      }, 1000);
    }
    if (data.type === 'login') {
      const [username, password] = data.data.split(' ');
      const user = users.find((u) => u.username === username);
      if (!user) {
        udp_server.send('登录失败，用户名不存在', udp_client_port, '::1');
      } else if (user.password !== password) {
        udp_server.send('登录失败，用户名或密码错误', udp_client_port, '::1');
      } else if (online_clients.find((c) => c.userId === user.userId)) {
        udp_server.send('登录失败，此用户已在线', udp_client_port, '::1');
      } else {
        online_clients.push({ udp_port: udp_client_port, userId: user.userId });
        udp_server.send(`登录成功。`, udp_client_port, '::1');
        for (const client of online_clients) {
          udp_server.send(
            `欢迎 ${user.username}(${udp_client_port}) 加入聊天室`,
            client.udp_port,
            '::1'
          );
        }
        clearInterval(requestLoginTimeoutId as NodeJS.Timeout);
      }
    }
    if (data.type === 'register') {
      const [username, password] = data.data.split(' ');
      if (users.find((u) => u.username === username)) {
        udp_server.send('注册失败，用户名已存在', udp_client_port, '::1');
      } else {
        const userId = Math.max(...users.map((u) => u.userId)) + 1;
        users.push({ userId, username, password });
        fs.writeFileSync('./data/users.json', JSON.stringify(users));
        udp_server.send('注册成功，请继续登录', udp_client_port, '::1');
      }
    }
  });

  // 处理连接断开
  socket.on('end', () => {
    log('已断开连接');
    if (udp_client_port !== -1) {
      online_clients.splice(
        online_clients.findIndex((c) => c.udp_port === udp_client_port),
        1
      );
    }
  });

  setInterval(() => {
    socket.write(
      ConstructTransportMessage(
        'ports',
        online_clients.map((c) => c.udp_port).join(',')
      )
    );
  }, 10000);
});

// 服务器监听端口
tcp_server.listen(33200, () => {
  log('TCP 服务器正在监听 33200 端口');
});

setInterval(() => {
  log(
    logChain('当前在线客户端', online_clients.map((c) => c.udp_port).join(', '))
  );
}, 10000);
