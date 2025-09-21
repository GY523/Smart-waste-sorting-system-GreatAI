# Quick Setup Guide

## 🚀 Start the Server

### Option 1: Double-click the batch file
```
start-server.bat
```

### Option 2: Manual commands
```bash
npm install
node server.js
```

## 🌐 Access the Kiosk

1. **Local access**: http://localhost:3000
2. **Network access**: http://[your-computer-ip]:3000

## 🔧 Find Your IP Address

Open Command Prompt and run:
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter.

## ✅ What's Fixed

- ✅ Camera initialization and permissions
- ✅ Centralized server with session validation
- ✅ Automatic localhost configuration
- ✅ Security features (session expiration, point limits)
- ✅ Static file serving
- ✅ Network accessibility

## 🎯 Server Endpoints

- `POST /session/generate` - Create new session
- `POST /session/validate` - Validate session ID
- `POST /session/add` - Add scanned item
- `GET /session/:id` - Get session details

The kiosk is now ready to use!