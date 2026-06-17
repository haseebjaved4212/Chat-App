# Full Stack Real-time Chat Application

A real-time chat application built with Django Channels and React.

## Tech Stack
- **Backend**: Django, Django REST Framework, Django Channels, Redis, SQLite (dev)
- **Frontend**: React (Vite), TailwindCSS v4, shadcn/ui-inspired components
- **Real-time**: WebSockets (native API)

## Prerequisites
- Python 3.8+
- Node.js 18+
- Redis (See setup instructions below)

## Local Setup Instructions

### 1. Redis Setup (Windows/Mac/Linux)
Redis is required for Django Channels to handle WebSocket broadcasting.

**Option A: Using Docker (Recommended)**
We have included a `docker-compose.yml` file. If you have Docker installed, simply run:
```bash
docker-compose up -d
```
This will start a Redis container on port 6379 in the background.

**Option B: Native Installation**
- **Mac**: `brew install redis` then `brew services start redis`
- **Linux**: `sudo apt install redis-server` then `sudo systemctl start redis-server`
- **Windows**: Use WSL2 to install Redis via `apt`, or use the official Memurai (Redis for Windows) installer.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt` (Note: ensure you install the packages listed in the project if requirements.txt is missing).
5. Apply database migrations: `python manage.py migrate`
6. Create a superuser (optional): `python manage.py createsuperuser`
7. Run the development server: `python manage.py runserver`

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory.
2. Install Node dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Open your browser at `http://localhost:5173`

## Features Included
- JWT Authentication
- 1-on-1 and Group Chats
- Real-time WebSocket Messaging
- Media Uploads (Images & Videos) with Video Thumbnails
- Infinite Scroll Pagination for Message History
- Typing Indicators & Online Status

## Environment Variables
See `.env.example` for the required environment variables.

