# Excel Creator Application

This repository contains the backend (Flask/Python) and frontend (React) code for the Excel Creator Application. This application allows users to submit data for approval, generate Excel reports from approved data, search for approved items, and generate UPC barcodes. It also includes administrative features for data management and approval workflows.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Features](#2-features)
3.  [Prerequisites](#3-prerequisites)
4.  [Project Structure](#4-project-structure)
5.  [Setup Instructions](#5-setup-instructions)
    * [Step 5.1: Get the Project Files](#step-51-get-the-project-files)
    * [Step 5.2: Run the Setup Script](#step-52-run-the-setup-script)
6.  [Running the Application](#6-running-the-application)
    * [Step 6.1: Start the Backend Server (Flask)](#step-61-start-the-backend-server-flask)
    * [Step 6.2: Start the Frontend Client (React)](#step-62-start-the-frontend-client-react)
7.  [Common Issues & Troubleshooting](#7-common-issues--troubleshooting)
8.  [Using the Application](#8-using-the-application)
9.  [Notes for Developers](#9-notes-for-developers)

## 1. Introduction

The Excel Creator Application is a full-stack web application designed to streamline data management and reporting. It features:
* User authentication (login/registration) with role-based access control.
* Data submission by users for admin approval.
* Generation of daily Excel reports for approved data.
* Search functionality for approved items with UPC-A barcode generation.
* Email notifications for expiring items.
* Administrative tools for managing submissions and users.

## 2. Features

* **User Management**: Register and login with different roles (user, admin).
* **Data Submission**: Users can submit custom data (via form or JSON) for admin review.
* **Approval Workflow**: Admins can view, approve, or reject pending data submissions.
* **Excel Reporting**:
    * Users can download daily Excel reports of their approved data.
    * Admins can download aggregated Excel reports of all approved data.
    * (Via `ExcelCreatorApp.jsx`, if integrated): Direct Excel creation from custom data or predefined templates.
* **Barcode Generation**: Search approved items and generate scannable UPC-A barcodes (shown on screen).
* **Expiry Notifications**: Automated (admin-triggered) email notifications for items expiring soon or recently expired.

## 3. Prerequisites

Before setting up the application, ensure you have the following installed on your system:

* **Python 3.8+**:
    * Download and install from [python.org](https://www.python.org/downloads/).
    * **Crucial**: During installation, check the box "Add Python to PATH".
* **Node.js and npm**:
    * Download and install from [nodejs.org](https://nodejs.org/en/download/).
    * `npm` (Node Package Manager) is included with Node.js.
* **MongoDB Community Server**:
    * Download and install from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community/).
    * Ensure the MongoDB service is running after installation. On Windows, you can usually verify this in "Services".
* **A Code Editor**: (e.g., VS Code)
* **PowerShell (Windows)**: Built into Windows.

## 4. Project Structure

Your project directory should generally be structured as follows:

YourProject/
├── client/                 # React Frontend application
│   ├── public/
│   ├── src/
│   │   ├── UserDashboardView.jsx
│   │   ├── AdminDashboardView.jsx
│   │   ├── LoginRegister.jsx
│   │   ├── App.jsx
│   │   └── ... other React components
│   ├── package.json
│   └── ... other frontend files
├── server/                 # Flask Backend application
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   └── venv/               # Python Virtual Environment (created during setup)
├── setup.ps1               # PowerShell setup script
└── README.md               # This file


## 5. Setup Instructions

### Step 5.1: Get the Project Files

1.  **Clone the repository** (if applicable) or ensure you have all files in a single main folder (e.g., `Software_Engineering`).

2.  **Create/Verify `server/config.py`**:
    This file holds essential configurations. Create `server/config.py` if it doesn't exist, or update its contents as follows.

    **`server/config.py` example:**
    ```python
    # JWT Configuration
    JWT_SECRET_KEY = "your-very-secret-jwt-key" # **CHANGE THIS IN PRODUCTION**
    JWT_ACCESS_TOKEN_EXPIRES = 3600 # Token expires in 1 hour (in seconds)

    # MongoDB Configuration
    MONGO_URI = "mongodb://localhost:27017/Software_Engineering" # Ensure this matches your MongoDB setup
    DB_NAME = "Software_Engineering"
    TEMPLATES_COLLECTION = "templates"
    USERS_COLLECTION = "users"
    SUBMISSIONS_COLLECTION = "submissions"

    # Email Notification Configuration (for expiring items)
    # You'll need to set these up with a real email service (e.g., Gmail, Outlook SMTP)
    SMTP_SERVER = "smtp.gmail.com" # Example for Gmail
    SMTP_PORT = 587 # Common TLS port
    SENDER_EMAIL = "your_email@example.com" # Your sender email address
    SENDER_PASSWORD = "your_email_app_password" # Your email password or app-specific password
                                                # **IMPORTANT**: NEVER use your main email password directly.
                                                # If using Gmail, generate an "App password" from your Google Account security settings.

    # Feature Toggles (True to enable, False to disable)
    ENABLE_ALL_USERS_DAILY_DOWNLOAD = True # If True, users can download ALL approved data, not just their own
    ENABLE_ALL_USERS_GLOBAL_SEARCH = True  # If True, users can search ALL approved data, not just their own
    ```
    **Remember to replace placeholder values** with your actual, secure credentials.

### Step 5.2: Run the Setup Script

This script automates the installation of all necessary dependencies for both the backend and frontend.

1.  **Open PowerShell.**
2.  **Navigate to your project's root directory** (where `setup.ps1` is located).
    ```powershell
    cd C:\Path\To\YourProject\Software_Engineering
    ```
    (Replace `C:\Path\To\YourProject\Software_Engineering` with your actual path).

3.  **Execute the setup script:**
    ```powershell
    ./setup.ps1
    ```

    * **Troubleshooting:** If you encounter an error like `cannot be loaded. The file ... is not digitally signed.`, you need to adjust PowerShell's execution policy.
        * **Open PowerShell as Administrator.**
        * Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`
        * Close the Administrator PowerShell and retry `./setup.ps1` in your regular PowerShell window.

    This script will:
    * Create a Python virtual environment (`venv`) in your `server` directory.
    * Activate the virtual environment.
    * Install Python packages from `server/requirements.txt` (e.g., `flask`, `pymongo`, `pandas`, `python-barcode`).
    * Navigate to your `client` directory.
    * Install Node.js packages from `client/package.json` (e.g., `react`, `jsbarcode`).

## 6. Running the Application

Once the setup is complete, you will need two separate terminal windows (PowerShell or CMD) to run the backend and frontend concurrently.

### Step 6.1: Start the Backend Server (Flask)

1.  **Open a NEW PowerShell/CMD window.**
2.  **Navigate to the `server` directory:**
    ```powershell
    cd C:\Path\To\YourProject\Software_Engineering\server
    ```
3.  **Activate the Python virtual environment:**
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```
    You should see `(venv)` appear at the beginning of your prompt, indicating the virtual environment is active.
4.  **Run the Flask application:**
    ```powershell
    python main.py
    ```
    * You should see output indicating the Flask server is running (e.g., `Running on http://127.0.0.1:5000/`).
    * Look for log messages related to database initialization (e.g., "Clearing existing templates...", "Default templates initialized.", "Default users initialized.").

### Step 6.2: Start the Frontend Client (React)

1.  **Open a *separate* NEW PowerShell/CMD window.** (Keep the backend server window open and running).
2.  **Navigate to the `client` directory:**
    ```powershell
    cd C:\Path\To\YourProject\Software_Engineering\client
    ```
3.  **Start the React development server:**
    ```powershell
    npm run dev
    ```
    * This will compile your React application and typically open it in your default web browser (usually at `http://localhost:5173`).

## 7. Common Issues & Troubleshooting

* **`PowerShell script cannot be loaded`**: See [Step 5.2](#step-52-run-the-setup-script) for fix.
* **`ModuleNotFoundError` (Python)**:
    * **Reason**: A required Python library isn't installed in your virtual environment.
    * **Fix**: In the `server` directory (with `venv` activated), run `pip install -r requirements.txt`.
* **CORS Errors (e.g., "Access to fetch... has been blocked by CORS policy.")**:
    * **Reason**: Your frontend (e.g., `localhost:5173`) is blocked from accessing the backend (`127.0.0.1:5000`) by browser security.
    * **Fix**: Ensure `ALLOWED_ORIGIN = "http://localhost:5173"` is correctly set in `server/main.py` and that your frontend is indeed running on `http://localhost:5173`. The provided `main.py` should handle the server-side CORS headers.
* **MongoDB Connection Issues**:
    * **Reason**: MongoDB server might not be running or `MONGO_URI` in `config.py` is incorrect.
    * **Fix**: Verify the MongoDB service is running (e.g., via Windows Services). Double-check `MONGO_URI` in `server/config.py`.
* **Port Already in Use (`EADDRINUSE`)**:
    * **Reason**: Another process is using the required port (5000 for Flask, 5173 for React).
    * **Fix**: You can find and kill the process using the port (Google "how to kill process by port Windows" for detailed steps), or simply restart your computer.

## 8. Using the Application

Once both the backend and frontend servers are running:

1.  **Access the Frontend**: Open your web browser and navigate to `http://localhost:5173`.
2.  **Login Credentials**:
    * **Admin User**:
        * Username: `admin`
        * Password: `admin`
    * **Standard User**:
        * Username: `user`
        * Password: `user`
3.  **Explore Features**:
    * **User Dashboard**: Submit data for admin approval, download approved daily reports, and use the search feature to generate UPC-A barcodes for approved items. You'll also see notifications for expiring items.
    * **Admin Panel**: Log in as `admin` to access functionalities like approving/rejecting user submissions, viewing all daily data, and clearing all submission data from the database.

## 9. Notes for Developers

* **`app.debug = True`**: The `server/main.py` is configured to run in debug mode. This enables automatic server reloading on code changes and provides an interactive debugger. It also triggers the clearing and re-insertion of default templates in MongoDB upon every startup. **For production deployments, `app.run(debug=False)` is highly recommended for security and performance reasons.**
* **UPC-A Barcodes**: The application generates UPC-A barcodes. Please note that UPC-A requires a 12-digit numeric code. The current implementation in `server/main.py` attempts to derive an 11-digit numeric value from the `pid` field (or uses a demo value if `pid` is not suitable). **For real industrial applications, you should establish a robust system for assigning and managing unique 12-digit UPC codes to your products.** This often means having a dedicated `upc_code` field in your data that is strictly numeric and of the correct length.
* **Email Configuration**: The email notification feature requires correct SMTP server details and credentials in `server/config.py`. Ensure these are set up securely (e.g., using app passwords for services like Gmail).

---
