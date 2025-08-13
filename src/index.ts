import {
  Connection,
  ConnectionContext,
  routePartykitRequest,
  Server,
  WSMessage,
} from "partyserver";

// Simple recursive merge function
function mergeState(target: any, source: any): any {
  if (typeof source !== "object" || source === null) {
    return source;
  }

  if (typeof target !== "object" || target === null) {
    target = {};
  }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = mergeState(target[key], source[key]);
    }
  }

  return target;
}

// Define your Server
export class MyServer extends Server {
  private state: any = {};

  onConnect(conn: Connection, ctx: ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
    id: ${conn.id}
    url: ${new URL(ctx.request.url).pathname}`
    );

    // Send initial state to new connection
    conn.send(JSON.stringify({ state: this.state }));
  }

  onMessage(conn: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message.toString());

      if (data.delta) {
        // Merge delta into state
        this.state = mergeState(this.state, data.delta);

        // Broadcast delta to all other clients
        this.broadcast(message, [conn.id]);

        console.log(`Delta applied from ${conn.id}:`, data.delta);
      } else {
        // Handle other message types
        console.log(`connection ${conn.id} sent message: ${message}`);
        this.broadcast(message, [conn.id]);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }
}

export default {
  // Set up your fetch handler to use configured Servers
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
};
