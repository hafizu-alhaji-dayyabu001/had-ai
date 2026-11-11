# HAD AI v2

A mobile-first Public Health learning workspace using:
- Static HTML/CSS/JavaScript frontend
- Firebase Authentication and Cloud Firestore
- Vercel serverless API
- OpenAI Responses API (server-side only)

## Required Vercel environment variables
- OPENAI_API_KEY (secret; never expose in browser code)
- OPENAI_MODEL (optional; defaults to gpt-5.5)

## Firebase
The frontend uses the existing Firebase project configuration for Auth and Firestore. Enable Email/Password authentication and create a Firestore database. Configure restrictive Firestore security rules before storing real student data.

## Current foundation
Dashboard, learning academy navigation, mode-specific AI tutor, Firebase email/password authentication, and signed-in chat persistence. Document ingestion, Storage uploads, advanced CBT, research citation workflows, Excel exercises, analytics and real-time voice are planned next phases and are not represented as complete yet.

## Deployment
Vercel should deploy this branch as a Preview Deployment. Do not promote it to the production domain until the preview is tested.
