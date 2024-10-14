基于 Node.js 实现的基于套接字的简单聊天室。

> 本在线聊天室系统是一个通过 TypeScript 实现的即时通信工具，利用 TCP 和 UDP Socket 技术，在简洁高效的架构中实现了多人实时交流的功能。系统以 TCP 连接为指令通道，管理用户的登录与状态同步；而通过 UDP 则承担消息传输的职责，直接实现客户端之间的点对点通信，使得每条信息都仿佛穿梭在无形的网络之间，瞬间抵达他人耳畔。服务端充当协调者的角色，维护着用户的在线状态，确保每一次连接变动都能被及时广播。客户端用户在接入后，可以发送公共消息与众人分享瞬间，也可通过私聊享受一对一的深度交流。整个过程无需经过服务端中继，使得聊天体验更加流畅与纯粹。

## 系统概述

### 系统环境

- Node.js 18
- TypeScript Compiler 5.2.2

### 编译和启动

```bash
npm install # 下载并构建依赖
npm run server # 启动服务端
npm run client # 启动客户端
```

### 开发环境

- macOS 15, arm64
- Visual Studio Code 1.9.40

### 程序文件列表

```bash
.
├── data    # 程序数据文件夹
│ └── users.json    # 服务端记录的用户数据
├── src     # 源代码文件夹
│ ├── client        # 客户端代码
│ │ └── index.ts
│ ├── server        # 服务端代码
│ │ └── index.ts
│ ├── log.ts        # 公用的日志函数
│ └── type.ts       # 公用的类型定义
├── nodemon_client.json
├── nodemon_server.json
├── package.json
├── tsconfig.json
└── yarn.lock
```

## 主要数据结构

1. `IUser`：表示用户的结构体，包含以下字段：
   - `userId`: 用户的唯一标识符，用于区分不同的用户。
   - `username`: 用户名，供用户登录时使用。
   - `password`: 用户的密码，用于身份验证。

```typescript
interface IUser {
  userId: number;
  username: string;
  password: string;
}
```

2. `IClient`：表示客户端的结构体，包含以下字段：
   - `udp_port`: 客户端的 UDP 端口，用于接收其他客户端的消息。
   - `userId`: 登录后用户的唯一标识符。
   - `username`: 登录后用户的用户名。

```typescript
interface IClient {
  udp_port: number;
  userId: number;
  username: string;
}
```

3. `TransportMessage`：客户端与服务端之间通信的消息结构体，用于传输指令和数据。
   - `type`: 消息类型，表示数据的用途（如 `port`, `login`, `register`, `clients`, 等）。
   - `data`: 实际数据内容，根据 `type` 的不同用途，存储相关的信息。

```typescript
type ITransportMessageType =
  | 'ports'
  | 'port'
  | 'login'
  | 'register'
  | 'clients';

export interface ITransportMessage {
  type: ITransportMessageType;
  data: string;
}
```

## 主要算法结构

1. 客户端启动流程：
   - 启动 UDP 客户端并监听随机端口（33100-33199），用于接收来自其他客户端的消息。
   - 启动 TCP 客户端，连接到服务器，向服务端汇报自身的 UDP 端口。
   - 通过 `/login` 或 `/register` 指令向服务端发送登录或注册请求。
   - 维护当前在线的客户端列表，定时更新，通过服务端的广播信息获取所有在线的 UDP 端口及客户端信息。
2. 服务端启动流程：

   - 启动 UDP 服务器监听固定端口（33100），用于与客户端通信。
   - 启动 TCP 服务器监听固定端口（33200），接受客户端连接并管理客户端状态。
   - 处理客户端连接的生命周期，包括登录、注册和断开连接。
   - 广播当前在线的客户端列表，定时向所有连接的客户端同步在线状态。

3. 消息发送机制：
   - 通过 TCP，客户端和服务端之间传输指令和状态信息。
   - 通过 UDP，客户端之间进行点对点通信，实现聊天功能。公共聊天室通过向所有在线的 UDP 端口广播消息，私聊则向特定的 UDP 端口发送消息。
4. 客户端登录及注册逻辑：
   - 用户通过 TCP 连接向服务端发送 `/login <username> <password>` 或 `/register <username> <password>` 命令。
   - 服务端对用户信息进行验证（检查用户是否存在或是否已在线），若符合条件则更新在线客户端列表并广播。

## 程序使用手册

1. 启动服务端

   如同吹响号角般开启交流的序章，只需在命令行中轻敲 `npm run server`，便可唤醒服务端程序。此刻，它将静静守候在 TCP 端口 33200 和 UDP 端口 33100，等待每一位客户端的到来，为接下来的对话铺就桥梁。

2. 启动客户端

   通过 `npm run client` 轻松启动客户端，便可踏上这场数字化的社交旅程。初次见面时，系统会向你发出指引，期待你以 `/login` 或 `/register` 命令揭开身份的面纱。无论是老友重逢，还是新客光临，都会在这里找到属于自己的位置。

3. 聊天指令

   - `/list`：只需输入 `/list`，便能纵览当前在线的所有用户名单，仿佛浏览一本繁忙聊天室的目录。每位用户的用户名、用户 ID 及其所在的 UDP 端口尽在掌握，让你在这片数字海洋中不至迷失。
   - `/msg <userId> <message>`：悄悄在命令行输入 `/msg`，再接上用户 ID 和想说的话语，便可向那位特定的听众送去私密的信息。这样的对话如同夜幕下的耳语，专属于你们二人。
   - 公共聊天：想要大声分享心情，只需直接输入消息内容，按下回车键，便能将文字抛向聊天室的每一个角落，与众人一同分享那一瞬间的感悟。

4. 退出程序

   当你决定暂别这片热闹的虚拟天地，只需轻轻按下 `Ctrl+C` 告诉系统：“我该走了”。程序会体贴地结束，让你在纷繁的对话之后重返宁静。

让每一次对话都成为美好回忆的起点，让每一个命令都能唤起新的故事。这个在线聊天室，正等待着你的加入，让网络另一端的人倾听你的声音。
