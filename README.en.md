[简体中文](./README.md)

# Personal Academic Portfolio Platform

This project provides a simple and efficient platform for managing and showcasing personal academic achievements and works.

---

## ✨ Feature Preview

### Public Showcase Page

![Public Showcase Page](./example1.png)

### Admin Dashboard

![Admin Dashboard](./example2.png)

---

## 🚀 Quick Start

Follow these instructions to get the project running on your local machine.

### 1. Prerequisites

You must have **Node.js** (v18 or higher recommended) installed on your system. It comes with `npm` (Node Package Manager).

- To install, visit [https://nodejs.org/](https://nodejs.org/).
- Verify by running `node -v` and `npm -v` in your terminal.

### 2. Installation & Setup

1.  **Clone this repository**.
2.  **Navigate to the project root**: `cd path/to/your/project`
3.  **Create and configure your environment file**:
    - Go to the `backend` folder.
    - Copy the `.env.example` file and rename the copy to `.env`.
    - Open the new `.env` file and set your desired `ADMIN_PASSWORD` and `JWT_SECRET`.
4.  **Install all dependencies**: From the **project root**, run:
    ```bash
    npm run install:all
    ```
    This command installs dependencies for the root, backend, and frontend.

### 3. Running the Application

1.  Make sure you are in the **project root**.
2.  Start both servers with a single command:
    ```bash
    npm run dev
    ```
    This command uses `concurrently` to start both the backend API and the frontend Vite server.

### 4. Accessing the Application

- **Public Portfolio**: `http://localhost:5173`
- **Blog**: `http://localhost:5173/blog`
- **Admin Login**: `http://localhost:5173/login`

---
### 5. Cleanup (Optional)

To remove installed dependencies while preserving the database, uploads, environment files and lockfiles, run this command from the **project root**:
```bash
npm run clean
```

---

## 📄 License

This project is licensed under the MIT License.

Copyright (c) 2025 yuhong
## Configuration and verification

Vite proxies `/api` and `/uploads` to the local backend. Update the proxy targets in
`frontend/vite.config.js` when changing its port. Production hosting needs a reverse
proxy for these paths. For a separate backend origin, set `VITE_API_BASE_URL` in
`frontend/.env` before building. `npm start` remains a local development-style launcher.
Private attachments and attachments of private projects/publications require authentication;
previously downloaded copies cannot be recalled by changing visibility.

```bash
npm test
npm test --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
```
