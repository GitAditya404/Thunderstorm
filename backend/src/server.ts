import app from './index.ts'
import websocket from './websocket.ts'

const httpServer = app.listen(8080)
websocket(httpServer)