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

# Chat Application Implementation Walkthrough

The Full Stack Real-time Chat Application has been successfully bootstrapped and implemented!

## 1. Backend Architecture (Django)
> [!NOTE]
> The backend is built to handle a robust, scalable chat infrastructure using Django REST Framework and Channels.

- **Models**:
  - `CustomUser` models with avatar, online status, and last seen timestamps.
  - `Conversation` and `Message` models that support both 1-on-1 chats and group chats, alongside read receipts and timestamps.
- **REST API**:
  - Full JWT authentication endpoints (`/api/auth/login/`, `/register/`, `/refresh/`).
  - ViewSets with `StandardResultsSetPagination` (30 items per page) for older message history fetching.
  - Multipart/form-data support for uploading image/video attachments to messages.
  - Automatic video thumbnail generation using `moviepy`.
- **WebSockets (Django Channels & Redis)**:
  - An `AsyncWebsocketConsumer` (`ChatConsumer`) handling live connections.
  - WebSocket JWT auth middleware to ensure secure connections.
  - Live broadcast logic for text messages, typing indicators (`activeTyping`), and online/offline presence (`status_update`).

## 2. Frontend Architecture (React + Vite)
> [!TIP]
> The frontend utilizes React Router DOM for single-page routing, TailwindCSS v4 for styling, and standard Context APIs for state management.

- **Context Providers**:
  - `AuthContext`: Manages login/registration APIs, token storage in `localStorage`, and automated token refreshing every 4 minutes to maintain session state.
  - `WebSocketContext`: Maintains the global WebSocket connection stringed to the JWT token. Re-broadcasts socket events to React State (`messages`, `activeTyping`, `onlineUsers`).
- **User Interface**:
  - **Login / Register Pages**: Custom-built with `shadcn/ui` style utility wrappers (`Button`, `Input`) using TailwindCSS. Centered layout with form validation and API feedback.
  - **Sidebar Component**: Polls `/api/conversations/` and displays group or 1-on-1 chats. Real-time online presence indicators are mapped onto user avatars.
  - **Chat Window**: 
    - Handles merging of REST API historical messages and real-time WebSocket messages.
    - Reverse infinite scrolling using the `onScroll` event listener hooked to the top of the chat container.
    - Displays video files with generated `media_thumbnail` poster frames or inline images.
    - Animated `Typing...` indicators for seamless UX.

## 3. Project Configuration
> [!IMPORTANT]
> To run this locally, you must have Redis configured. A `docker-compose.yml` is provided at the root of the project to spin up a quick container.
> Consult the generated `README.md` for specific execution commands and dependency installations.

### What was tested:
1. Virtual environment installation and package dependencies (including fixes for `moviepy` versions).
2. Django Database Migrations.
3. React UI Components (`Button`, `Input`), Tailwind v4 setup, and path aliasing.
4. WebSocket handshake logic.

With the heavy lifting complete, you can now run the app and refine the UI to your exact specifications!
