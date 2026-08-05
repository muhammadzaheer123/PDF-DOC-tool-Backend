# DocuForge Backend (NestJS)

## System requirements (VPS only — these will NOT work on Vercel serverless)

Install before running any PDF tool:

```bash
sudo apt update
sudo apt install -y ghostscript qpdf poppler-utils libreoffice
```

- `ghostscript` (`gs`) → Compress PDF
- `qpdf` → Unlock PDF, Protect PDF
- `poppler-utils` (`pdftoppm`) → PDF to JPG, AI OCR on scanned PDFs
- `libreoffice` → PDF to Word, Word to PDF

Also required, both local or managed:
- MongoDB (job persistence)
- Redis (BullMQ job queue)

## Setup

```bash
npm install
cp .env.example .env
# fill in MONGO_URI, REDIS_HOST/PORT, GROQ_API_KEY, OPENAI_API_KEY
npm run start:dev
```

Server runs on `http://localhost:4000/api/v1` by default.

## How a request flows

1. Frontend uploads file(s) to a tool endpoint, e.g. `POST /pdf/merge`
2. Controller saves the file(s) to storage, creates a Job document (status `queued`), pushes a job onto the BullMQ queue, and immediately returns `{ jobId, fileKey }`
3. A `Processor` (`pdf.processor.ts` / `ai.processor.ts`) picks the job up in the background, runs the matching engine, saves the result, and marks the job `completed` or `failed`
4. Frontend polls `GET /jobs/:jobId` until `status` is `completed` or `failed`

This exactly matches the `useToolJob` hook on the frontend — no changes needed there.

## AI provider strategy

- OCR and Image-to-Text: Tesseract.js, no API key needed
- All other text tools: Groq first (fast, cheap) — falls back to OpenAI automatically if `GROQ_API_KEY` is empty
- Text-to-Image: OpenAI only (Groq has no image model)

## Adding a new tool

1. Add the tool definition to the frontend's `tools.config.ts`
2. Write an engine function under `pdf-tools/engines/` or `ai-tools/engines/`
3. Add one line to the matching controller and one `case` to the matching processor's switch statement

## Folder structure

```
src/
  main.ts, app.module.ts
  common/            → response shape, exception filter, shared constants
  config/            → typed env config
  modules/
    storage/         → local disk today, swap for S3/R2 by implementing StorageService
    jobs/             → Mongo-backed job lifecycle, GET /jobs/:id
    queue/            → BullMQ + Redis registration
    pdf-tools/        → 10 PDF tools: controller, service, processor, engines/
    ai-tools/         → 13 AI tools: controller, service, processor, engines/, providers/
    upload/           → multer config
```
