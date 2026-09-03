import os
import asyncio
import json
import math
import time
import serial
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from contextlib import asynccontextmanager
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(serial_reader())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api-status")
async def api_status():
    return {
        "status": "online",
        "service": "C.A.R.E. Healthcare Telemetry API",
        "docs_url": "http://localhost:8000/docs",
    }

# Configuration
SERIAL_PORT = 'COM3'
BAUD_RATE = 115200

# Auth Configuration
SECRET_KEY = "super_secret_care_key_telemetry_system_32bytes"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

MOCK_USERS = {
    "user@care.com": {"password": "password", "role": "User"},
    "admin@care.com": {"password": "password", "role": "Admin"},
    "doctor@care.com": {"password": "password", "role": "Doctor"},
    "doctor2@care.com": {"password": "password", "role": "Doctor"}
}

MOCK_PATIENTS = {
    "doctor@care.com": [
        { "id": 1, "name": "John Doe", "status": "Stable", "room": "101" },
        { "id": 2, "name": "Jane Smith", "status": "Stable", "room": "102" },
        { "id": 3, "name": "Robert Johnson", "status": "Observation", "room": "204" }
    ],
    "doctor2@care.com": []
}

class PatientCreate(BaseModel):
    name: str
    room: str
    status: str = "Observation"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    user = MOCK_USERS.get(email)
    if user is None:
        raise credentials_exception
    return {"email": email, "role": role}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = MOCK_USERS.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/patients")
async def get_patients(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patients")
    email = current_user["email"]
    return MOCK_PATIENTS.get(email, [])

@app.post("/patients")
async def add_patient(patient: PatientCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Doctor":
        raise HTTPException(status_code=403, detail="Only doctors can add patients")
    email = current_user["email"]
    if email not in MOCK_PATIENTS:
        MOCK_PATIENTS[email] = []
    
    new_id = len(MOCK_PATIENTS[email]) + 1
    new_patient = {
        "id": new_id,
        "name": patient.name,
        "status": patient.status,
        "room": patient.room
    }
    MOCK_PATIENTS[email].append(new_patient)
    return new_patient

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

def get_mock_data(start_time):
    current_time = time.time() - start_time
    ecg_value = 2048 + int(1000 * math.sin(current_time * 5) + 200 * math.sin(current_time * 20))
    # Default panic is 0 to avoid telemetry event spamming
    panic = 0
    return {
        "ecg": ecg_value,
        "hr": 72 + int(5 * math.sin(current_time * 0.5)),
        "gsr": 500 + int(20 * math.sin(current_time * 0.1)),
        "panic": panic
    }

async def serial_reader():
    start_time = time.time()
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        while True:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line:
                try:
                    data = json.loads(line)
                    # ensure essential keys are present
                    data.setdefault("ecg", 2048)
                    data.setdefault("hr", 0)
                    data.setdefault("gsr", 0)
                    data.setdefault("panic", 0)
                    await manager.broadcast(json.dumps(data))
                except json.JSONDecodeError:
                    pass
            else:
                data = get_mock_data(start_time)
                await manager.broadcast(json.dumps(data))
            await asyncio.sleep(0.01)
    except Exception:
        print(f"Could not open {SERIAL_PORT}. Using mock data generator.")
        while True:
            data = get_mock_data(start_time)
            await manager.broadcast(json.dumps(data))
            await asyncio.sleep(0.05) # ~20 FPS

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = os.path.join(frontend_dist, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "status": "online",
        "message": "Backend API is running. Frontend build not found. Run 'npm run build' in web_monitor/frontend to serve frontend on this port.",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
