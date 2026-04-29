# Deployment

**Last updated:** 2026-04-28

## Targets

- **Frontend:** Vercel
- **Backend:** Google Cloud Run (us-central1)
- **Storage:** Cloud Storage bucket + Firestore (Native mode)

## One-time GCP setup

```bash
# Variables
PROJECT_ID=your-gcp-project-id
REGION=us-central1
BUCKET=laurel-moments

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

# Enable APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com

# Artifact Registry repo for the container image
gcloud artifacts repositories create laurel \
  --repository-format=docker \
  --location="$REGION"

# Cloud Storage bucket for frames (30-day TTL)
gcloud storage buckets create "gs://$BUCKET" --location="$REGION" --uniform-bucket-level-access
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
gcloud storage buckets update "gs://$BUCKET" --lifecycle-file=/tmp/lifecycle.json

# Firestore in Native mode (one-time, in Console or):
gcloud firestore databases create --location="$REGION" --type=firestore-native

# Service account for Cloud Run
gcloud iam service-accounts create laurel-backend
SA="laurel-backend@$PROJECT_ID.iam.gserviceaccount.com"
for role in roles/aiplatform.user roles/storage.objectAdmin roles/datastore.user; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA" --role="$role"
done
```

## Deploy backend (Cloud Run)

```bash
cd backend
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_MOMENTS_BUCKET=laurel-moments,_CORS_ALLOWED_ORIGINS=https://laurel.vercel.app
```

The Cloud Run service uses the `laurel-backend` service account and reads
config from env vars set by the build.

After deploy, note the service URL:

```bash
gcloud run services describe laurel-backend --format='value(status.url)'
```

## Deploy frontend (Vercel)

```bash
cd frontend
vercel link        # one time, links to a Vercel project
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Paste the Cloud Run URL when prompted
vercel --prod
```

## Verifying

- `<vercel-url>/healthz`-equivalent: open the landing page; CTAs should load.
- `<cloud-run-url>/healthz` returns `{"status":"ok"}`.
- `<cloud-run-url>/api/sports` returns 6 sports.
- Capture flow on a phone: load `<vercel-url>/capture`, capture a frame,
  see Gemini-generated explanation streaming in.

## Rollback

```bash
# Backend
gcloud run revisions list --service=laurel-backend
gcloud run services update-traffic laurel-backend --to-revisions=laurel-backend-00002-abc=100

# Frontend
vercel ls
vercel promote <previous-deployment-url>
```
