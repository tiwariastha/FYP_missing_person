# Finding Missing Person Using AI

Final-year engineering project for reporting, tracking, and matching missing persons using AI-powered face recognition.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| AI | InsightFace (ArcFace), OpenCV, cosine similarity |
| Maps | Leaflet, OpenStreetMap |
| Auth | JWT, Role-Based Access Control |

## Project Structure

```
FYP/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # FastAPI application
├── ai/                # Face recognition and image processing
├── database/          # SQLite database files
├── uploads/           # Uploaded images and media
│   ├── cases/
│   ├── sightings/
│   └── temporary/
├── docs/              # Project documentation
└── tests/             # Integration and end-to-end tests
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- Git

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Status

Project structure only. Application features are not yet implemented.
