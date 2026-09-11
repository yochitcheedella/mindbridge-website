from fastapi import WebSocket
from typing import List
import json
import asyncio

class AlertManager:
    def __init__(self):
        self.active_clinicians: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_clinicians.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_clinicians:
            self.active_clinicians.remove(websocket)

    async def broadcast_alert(self, alert_data: dict):
        """
        Broadcast an emergency alert to all connected clinicians.
        """
        message = json.dumps(alert_data)
        # Use asyncio.gather to send to all concurrently and handle disconnected sockets
        tasks = []
        for connection in self.active_clinicians:
            tasks.append(connection.send_text(message))
            
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            # Cleanup broken connections
            for conn, result in zip(self.active_clinicians[:], results):
                if isinstance(result, Exception):
                    self.disconnect(conn)

    def dispatch_alert(self, alert_data: dict):
        """Safely dispatches an alert broadcast whether running in an async event loop or a worker thread."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast_alert(alert_data))
        except RuntimeError:
            asyncio.run(self.broadcast_alert(alert_data))

alert_manager = AlertManager()
