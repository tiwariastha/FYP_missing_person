# Finding Missing Person Using AI

An AI-powered web application for registering, reporting, tracking, and identifying missing persons using facial recognition technology.

## 📌 Project Overview

**Finding Missing Person Using AI** is a final-year engineering project designed to assist in missing-person investigations.

The system provides a centralized platform where investigators can register missing-person cases, the public can submit sightings/reports, and users can search for potential missing-person matches using an AI-powered facial recognition system.

The application uses **InsightFace** to generate facial embeddings and compares them using **cosine similarity** to identify the most similar registered missing-person cases.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Secure password hashing
* Role-Based Access Control (RBAC)
* Three user roles:

  * **Admin**
  * **Investigator**
  * **Public User**

### 👑 Admin Dashboard

* View registered users
* Manage user roles
* View missing-person cases
* Search and filter cases
* Review public reports
* Update case status
* View case details

### 🕵️ Investigator Dashboard

* Register missing-person cases
* Upload missing-person photographs
* Search and filter cases
* Update case status
* Review public reports
* Use AI-powered face matching
* View potential matching cases

### 👥 Public Dashboard

* Submit missing-person reports/sightings
* Upload photographs
* Track submitted reports
* View report status
* Search for missing persons using AI face matching

### 🤖 AI Face Matching

* Face detection using InsightFace
* Facial feature extraction
* 512-dimensional face embeddings
* Cosine similarity-based comparison
* Ranked matching results
* Configurable matching thresholds
* Best-match identification
* Face detection bounding-box information
* Handles cases where a face cannot be detected

### 📊 Case Management

* Missing-person registration
* Case status tracking
* Active / Found / Closed statuses
* Case search and filtering
* Missing-person photograph management

### 📢 Public Report Management

* Public users can submit reports
* Investigators/Admins can review reports
* Approve or reject submitted reports
* Track report status

---

## 🛠️ Technology Stack

| Category              | Technologies                 |
| --------------------- | ---------------------------- |
| Frontend              | React.js, Vite, Tailwind CSS |
| Frontend Language     | JavaScript (JSX)             |
| API Communication     | Axios                        |
| Backend               | Python, FastAPI              |
| Server                | Uvicorn                      |
| Database              | SQLite                       |
| ORM / Data Modeling   | SQLModel                     |
| Validation            | Pydantic                     |
| AI / Face Recognition | InsightFace (buffalo_l)      |
| Computer Vision       | OpenCV                       |
| Numerical Processing  | NumPy                        |
| Face Matching         | Cosine Similarity            |
| Authentication        | JWT                          |
| Password Security     | Passlib                      |
| Authorization         | Role-Based Access Control    |
| Testing               | Pytest                       |
| Version Control       | Git                          |
| Repository            | GitHub                       |

---

## 🧠 AI Face Recognition Pipeline

```text
Uploaded Photograph
        ↓
   Face Detection
        ↓
Select Best Detected Face
        ↓
InsightFace Face Embedding
        ↓
512-Dimensional Vector
        ↓
Cosine Similarity
        ↓
Compare With Registered Cases
        ↓
Rank Matching Results
        ↓
Display Potential Matches
```

The system does **not** treat similarity scores as probabilities. They represent the similarity between facial embeddings and should be verified by authorized investigators before making an identification.

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────┐
                  │     React Frontend  │
                  │  Vite + Tailwind    │
                  └──────────┬──────────┘
                             │
                           Axios
                             │
                             ▼
                  ┌─────────────────────┐
                  │    FastAPI Backend  │
                  │      REST APIs      │
                  └─────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌───────────┐  ┌─────────────┐
        │ SQLite   │  │  Insight  │  │ File/Image  │
        │ Database │  │   Face    │  │  Storage    │
        └──────────┘  └───────────┘  └─────────────┘
                            │
                            ▼
                    Face Embeddings
                            │
                            ▼
                   Cosine Similarity
                            │
                            ▼
                    Ranked Matches
```

---

## 📁 Project Structure

```text
FYP_missing_person/
│
├── ai/
│   ├── face_matcher.py
│   └── test_face_matcher.py
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── scripts/
│   └── requirements.txt
│
├── database/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── docs/
├── tests/
├── uploads/
│   ├── cases/
│   ├── sightings/
│   └── temporary/
│
├── .gitignore
└── README.md
```

> Uploaded photographs, databases, virtual environments, and other generated/private files are excluded from the Git repository using `.gitignore`.

---

## ⚙️ Prerequisites

Make sure the following are installed:

* Node.js 18+
* Python 3.10+
* Git

---

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/tiwariastha/FYP_missing_person.git
cd FYP_missing_person
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

#### Windows

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔒 Security

The project uses:

* JWT authentication
* Password hashing
* Role-Based Access Control
* Protected API endpoints
* `.gitignore` rules for databases, uploaded images, virtual environments, and environment files

Sensitive credentials and uploaded user data should not be committed to the repository.

---

## 📌 Current Project Status

The core application functionality has been implemented, including:

* ✅ Authentication
* ✅ User registration
* ✅ Role-based access
* ✅ Admin dashboard
* ✅ Investigator dashboard
* ✅ Public dashboard
* ✅ Missing-person case registration
* ✅ Case status management
* ✅ Public report submission
* ✅ Public report review
* ✅ Case search and filtering
* ✅ AI facial recognition
* ✅ Face matching and ranked results
* ✅ Image upload and management
* ✅ GitHub version control

### 🔄 Future Improvements

* Forgot-password / password-reset functionality
* Improved face-matching threshold calibration
* Multiple-face query handling
* Improved model evaluation using a dedicated dataset
* Investigator verification workflow
* Deployment to a production environment
* Additional analytics and reporting

---

## ⚠️ Disclaimer

AI face matching provides **potential matches**, not guaranteed identification.

All AI-generated matches should be reviewed and verified by authorized investigators before taking any official action.

---

## 👩‍💻 Project

**Finding Missing Person Using AI**

Final-Year Engineering Project

GitHub:
https://github.com/tiwariastha/FYP_missing_person
