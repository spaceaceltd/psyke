import asyncio
import json
import logging
from typing import Dict, Set

import websockets
from websockets.server import WebSocketServerProtocol


logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s")

ROOM_TO_PEERS: Dict[str, Set[WebSocketServerProtocol]] = {}


async def handler(websocket: WebSocketServerProtocol, path: str):
    if not path.startswith("/ws"):
        await websocket.close(code=4000, reason="Invalid path")
        return

    room_code = None
    try:
        # Expect first message to be a join with room code
        first_text = await websocket.recv()
        msg = json.loads(first_text)
        if msg.get("type") != "join" or not msg.get("room"):
            await websocket.send(json.dumps({"type": "error", "message": "First message must be join with room"}))
            await websocket.close(code=4001, reason="Join required")
            return

        room_code = str(msg["room"])[:64]
        peers = ROOM_TO_PEERS.setdefault(room_code, set())
        if len(peers) >= 2:
            await websocket.send(json.dumps({"type": "error", "message": "Room full"}))
            await websocket.close(code=4002, reason="Room full")
            return

        peers.add(websocket)
        logging.info(f"Peer joined room {room_code}. Peers now: {len(peers)}")
        # Notify current room state
        await websocket.send(json.dumps({"type": "joined", "room": room_code, "peers": len(peers)}))

        async for text in websocket:
            try:
                data = json.loads(text)
            except Exception:
                continue

            mtype = data.get("type")
            # Relay signaling messages to the other peer in the room
            if mtype in ("offer", "answer", "candidate"):
                await relay_to_other(room_code, websocket, data)
            elif mtype == "leave":
                break
            else:
                # ignore unknown
                pass

    except websockets.ConnectionClosed:
        pass
    except Exception as e:
        logging.exception("Handler error: %s", e)
    finally:
        if room_code is not None:
            peers = ROOM_TO_PEERS.get(room_code)
            if peers and websocket in peers:
                peers.remove(websocket)
                logging.info(f"Peer left room {room_code}. Peers now: {len(peers)}")
                # Notify remaining peer
                try:
                    await relay_to_other(room_code, websocket, {"type": "peer-left"})
                except Exception:
                    pass
                if not peers:
                    ROOM_TO_PEERS.pop(room_code, None)


async def relay_to_other(room: str, sender: WebSocketServerProtocol, message: dict):
    peers = ROOM_TO_PEERS.get(room, set())
    for peer in list(peers):
        if peer is sender:
            continue
        try:
            await peer.send(json.dumps(message))
        except Exception:
            # drop broken connection
            try:
                peers.remove(peer)
            except Exception:
                pass


async def main():
    port = 8765
    logging.info(f"Starting signaling server on 0.0.0.0:{port}")
    async with websockets.serve(handler, "0.0.0.0", port, ping_interval=20, ping_timeout=20):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

