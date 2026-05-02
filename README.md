# AI Travel Planner

Live Demo: http://3.14.87.252:5173  
GitHub: https://github.com/HjShen1/AITravel

## Overview

AI Travel Planner is a full-stack application that generates personalized multi-day travel itineraries using LLMs and location data.

Users can input a city, preference (e.g. food, nature, shopping), and number of days. The system returns a structured day-by-day plan with morning, afternoon, and evening activities.

---

## Features

- AI-generated structured itineraries (JSON → UI panels)
- Real-time streaming responses (SSE)
- Location-aware recommendations using Google Places API
- Vector-based retrieval using pgvector (RAG-style enhancement)
- Clean UI with panel-based itinerary display

---

## Tech Stack

**Frontend**
- React + TypeScript
- Vite
- SSE streaming UI

**Backend**
- Django + Django REST Framework
- OpenAI API (LLM generation)
- Google Places API (POI enrichment)

**Database**
- PostgreSQL
- pgvector (embedding storage & retrieval)

**Infra**
- Docker + Docker Compose
- AWS EC2 (deployment)

---

## Architecture (Simple)

User Input  
→ Frontend (React)  
→ Backend API (Django)  
→ Retrieve POIs (Google Places + pgvector)  
→ LLM generates structured JSON  
→ Stream response via SSE  
→ Frontend renders panels  

---

## Running Locally

```bash
git clone https://github.com/HjShen1/AITravel.git
cd AITravel

# add your keys
backend/.env
