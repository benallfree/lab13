import PartySocket from "partysocket";

//#region src/index.ts
function generateUUID() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
function mergeState(target, source) {
	if (source === null) return null;
	if (typeof source !== "object") return source;
	if (typeof target !== "object" || target === null) target = {};
	for (const key in source) if (source.hasOwnProperty(key)) if (source[key] === null) delete target[key];
	else target[key] = mergeState(target[key], source[key]);
	return target;
}
var Js13kClient = class {
	room;
	options;
	socket;
	myId;
	state;
	eventListeners;
	connected;
	shadowState;
	pendingDelta;
	throttleTimer;
	constructor(room, options = {}) {
		this.room = room;
		this.options = {
			host: `https://js13k-mmo.benallfree.com`,
			party: "js13k",
			deltaEvaluator: void 0,
			throttleMs: 50,
			...options
		};
		this.socket = null;
		this.myId = null;
		this.state = {};
		this.eventListeners = {};
		this.connected = false;
		this.shadowState = {};
		this.pendingDelta = {};
		this.throttleTimer = null;
		this.connect();
	}
	shouldSendDelta(delta) {
		if (!this.options.deltaEvaluator) return true;
		return this.options.deltaEvaluator(delta, this.shadowState, this.myId || void 0);
	}
	connect() {
		this.socket = new PartySocket({
			host: this.options.host,
			party: this.options.party,
			room: this.room
		});
		this.socket.addEventListener("open", () => {
			this.connected = true;
			this.emit("connected");
		});
		this.socket.addEventListener("close", () => {
			this.connected = false;
			this.emit("disconnected");
		});
		this.socket.addEventListener("message", (event) => {
			try {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			} catch (error) {
				console.error("Error parsing message:", error);
			}
		});
	}
	handleMessage(data) {
		if (data.id) {
			this.myId = data.id;
			this.emit("id", this.myId);
		} else if (data.connect) this.emit("connect", data.connect);
		else if (data.disconnect) {
			this.emit("disconnect", data.disconnect);
			if (this.state.players && this.state.players[data.disconnect]) delete this.state.players[data.disconnect];
		} else if (data.state) {
			this.state = data.state;
			this.emit("state", this.state);
		} else if (data.delta) {
			this.state = mergeState(this.state, data.delta);
			this.shadowState = mergeState(this.shadowState, data.delta);
			this.emit("delta", data.delta);
		}
	}
	mergeState(target, source) {
		return mergeState(target, source);
	}
	on(event, callback) {
		if (!this.eventListeners[event]) this.eventListeners[event] = [];
		this.eventListeners[event].push(callback);
	}
	off(event, callback) {
		if (this.eventListeners[event]) {
			const index = this.eventListeners[event].indexOf(callback);
			if (index > -1) this.eventListeners[event].splice(index, 1);
		}
	}
	emit(event, data) {
		if (this.eventListeners[event]) this.eventListeners[event].forEach((callback) => {
			try {
				callback(data);
			} catch (error) {
				console.error("Error in event listener:", error);
			}
		});
	}
	getState() {
		return this.state;
	}
	getMyId() {
		return this.myId;
	}
	getMyState(copy = false) {
		if (!this.myId || !this.state.players) return null;
		const state = this.state.players[this.myId];
		return copy ? JSON.parse(JSON.stringify(state)) : state;
	}
	getPlayerState(playerId, copy = false) {
		if (!this.state.players || !this.state.players[playerId]) return null;
		const state = this.state.players[playerId];
		return copy ? JSON.parse(JSON.stringify(state)) : state;
	}
	isConnected() {
		return this.connected;
	}
	sendDelta(delta) {
		if (!this.socket || !this.connected) {
			console.warn("Not connected to server, skipping delta");
			return;
		}
		const deltaString = JSON.stringify({ delta });
		this.socket.send(deltaString);
	}
	updateState(delta) {
		this.addToPendingDelta(delta);
	}
	addToPendingDelta(delta) {
		if (Object.keys(this.pendingDelta).length === 0) this.shadowState = JSON.parse(JSON.stringify(this.state));
		this.state = mergeState(this.state, delta);
		this.pendingDelta = mergeState(this.pendingDelta, delta);
		if (!this.throttleTimer) {
			this.processPendingDelta();
			this.throttleTimer = setTimeout(() => {
				this.throttleTimer = null;
				this.processPendingDelta();
			}, this.options.throttleMs);
		}
	}
	processPendingDelta() {
		if (Object.keys(this.pendingDelta).length === 0) return;
		if (this.shouldSendDelta(this.pendingDelta)) {
			this.sendDelta(this.pendingDelta);
			this.shadowState = {};
		}
		this.pendingDelta = {};
	}
	updateMyState(delta) {
		if (this.myId) this.updateState({ players: { [this.myId]: delta } });
		else console.warn("No myId yet, waiting for server...");
	}
	disconnect() {
		if (this.throttleTimer) {
			clearTimeout(this.throttleTimer);
			this.throttleTimer = null;
		}
		this.pendingDelta = {};
		this.shadowState = {};
		if (this.socket) this.socket.close();
	}
};
var src_default = Js13kClient;
if (typeof window !== "undefined") window.Js13kClient = Js13kClient;

//#endregion
export { src_default as default, generateUUID, mergeState };
//# sourceMappingURL=index.js.map