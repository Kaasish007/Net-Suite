@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd frontend
call npx -y create-vite@latest . --template react-ts
call npm install
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p
call npm install cytoscape react-cytoscapejs recharts lucide-react axios
call npm install -D @types/cytoscape @types/react-cytoscapejs vitest @testing-library/react @testing-library/jest-dom jsdom
