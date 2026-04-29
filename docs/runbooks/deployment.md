# Deployment

**Last updated:** 2026-04-28
**Status:** Placeholder. Will be filled when the Day 1 deploy step is executed.

## Targets

- **Frontend:** Vercel (production at https://laurel.vercel.app or custom domain)
- **Backend:** Google Cloud Run (us-central1)

## Deploy frontend (Vercel)

TODO. Pending Vercel project creation by the user.

## Deploy backend (Cloud Run)

TODO. Pending GCP project setup. Sketch:

```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/laurel-backend
gcloud run deploy laurel-backend \
  --image gcr.io/PROJECT_ID/laurel-backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=PROJECT_ID
```

## Required GCP setup

- Project with Vertex AI API enabled
- Service account for Cloud Run with roles: Vertex AI User, Cloud Storage Object Admin, Firestore User
- Cloud Storage bucket for moment frames (lifecycle: 30-day TTL)
- Firestore in Native mode

Documented in detail when the deploy step is actually executed.
