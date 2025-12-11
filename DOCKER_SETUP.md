# Mental Health Chatbot - Docker Setup

## Development Mode

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v3.8 or higher

### Quick Start

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Start services in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

### Services

- **Backend (Flask):** http://localhost:5000
- **Frontend (React/Vite):** http://localhost:5173

### Features

- **Hot Reload:** Changes to source code automatically reload both services
- **Volume Mounting:** Source code is mounted for live development
- **Environment Variables:** Loaded from `.env` files
- **Network Isolation:** Services communicate via Docker network

### Development Workflow

1. Make changes to your code
2. Changes are automatically detected and services reload
3. Test in your browser
4. Commit changes

### Troubleshooting

**Port already in use:**
```bash
# Stop conflicting services or change ports in docker-compose.yml
docker-compose down
```

**Rebuild after dependency changes:**
```bash
docker-compose up --build
```

**View specific service logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Restart a specific service:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

**Execute commands in running container:**
```bash
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Environment Variables

Make sure you have:
- `flask_backend/.env` with Flask configuration
- `chat_botX/.env.local` with React/Vite configuration

### Notes

- Frontend connects to backend via `http://localhost:5000`
- MongoDB connection string should be accessible from Docker containers
- API keys and secrets are loaded from `.env` files (not committed to git)
