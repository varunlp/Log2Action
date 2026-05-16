# LOG2ACTION

## A. Architecture

### MVP Architecture (Current Scope)
- **Frontend**: React + Vite (Simple, clean UI)
- **Backend**: FastAPI (Python) - Fast, built-in async support, automatic API docs.
- **Database**: PostgreSQL with `pgvector` (Store log metadata, analysis results, and document embeddings for RAG).
- **AI Provider Abstraction**: A Python module using the Strategy pattern to interface with Gemini, OpenAI, Ollama, or local LLMs. Includes Embedding abstraction for RAG.
- **Deployment**: Docker Compose (App + DB) for easy local development.

### Target Architecture (Future Scope)
- **Ingestion**: API webhooks + Logstash/Fluentd/Promtail integrations.
- **Queue**: Redis + Celery for async processing of large log streams.
- **Storage**: PostgreSQL (Metadata) + Elasticsearch/OpenSearch or Loki (for raw log storage and search).
- **Deployment**: Kubernetes (Helm charts, GitOps).
- **Observability**: OpenTelemetry + Prometheus + Grafana.

---

## B. MVP Plan

**Goal**: Upload a log file, parse it, analyze it using AI, and return structured insights.

1.  **Phase 1: Foundation & Setup**
    *   Initialize the `backend` and `frontend` directories.
    *   Set up `docker-compose.yml` to orchestrate PostgreSQL, the backend, and frontend.
2.  **Phase 2: Backend Core & Database**
    *   Set up SQLAlchemy ORM and Alembic migrations.
    *   Define DB models (`LogUpload`, `AnalysisResult`).
    *   Implement basic log ingestion endpoint (file upload).
3.  **Phase 3: AI & RAG (Retrieval-Augmented Generation) Foundation**
    *   Define `BaseAIProvider` and `BaseEmbeddingProvider` interfaces.
    *   Implement `GeminiProvider` for LLM and Embeddings.
    *   Build Document Ingestion: endpoints to upload runbooks/docs, chunk them, embed, and store in `pgvector`.
    *   Create a prompt engineering module to consistently format instructions.
4.  **Phase 4: Integration & Orchestration**
    *   Connect the log parser -> RAG Retrieval (fetch relevant internal docs) -> AI Provider -> Database.
    *   Expose endpoints to retrieve the analysis results.
5.  **Phase 5: Frontend Dashboard**
    *   Build an upload component.
    *   Build a results view displaying the parsed insights.

---

## C. Exact Project Structure

```text
Log2Action/
├── docker-compose.yml        # Orchestrates the local stack
├── .env                      # Environment variables
├── backend/                  # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── core/             # Settings, configs
│   │   │   └── config.py
│   │   ├── api/              # Routers / API Endpoints
│   │   │   └── routes/
│   │   │       ├── logs.py
│   │   │       ├── documents.py  # Internal docs for RAG
│   │   │       └── analysis.py
│   │   ├── services/         # Business logic
│   │   │   ├── parser.py     # Log parsing logic
│   │   │   ├── rag.py        # Chunking, embedding, vector search
│   │   │   └── orchestrator.py
│   │   ├── ai/               # AI & Embeddings Abstraction
│   │   │   ├── base.py       # BaseAIProvider & BaseEmbeddingProvider
│   │   │   ├── gemini.py     # Gemini LLM and Embedding implementation
│   │   │   ├── ollama.py     # Ollama implementation (future)
│   │   │   └── factory.py    # Returns the configured provider
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   │   └── domain.py
│   │   ├── schemas/          # Pydantic models (Input/Output validation)
│   │   │   └── dto.py
│   │   └── db/               # Database setup
│   │       └── session.py
│   └── alembic/              # Database migrations
└── frontend/                 # React + Vite application
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── components/       # Upload, Results Display
        ├── services/         # API client
        └── index.css
```

---

## D. First Implementation Steps

Let's build this incrementally to avoid overwhelming complexity.

**Step 1: The Foundation**
Set up the core folder structure and the `docker-compose.yml` file, starting with just PostgreSQL.

**Step 2: Backend Scaffold**
Initialize the FastAPI app within the `backend/` directory, set up basic Pydantic configuration (`app/core/config.py`), and ensure the app can boot up.

**Step 3: Database Connection**
Configure SQLAlchemy (`app/db/session.py`) and create the base models. Connect FastAPI to the PostgreSQL container.

**Step 4: AI Abstraction Module**
Implement the `app/ai/` directory. This is the core of the requirement—building an agnostic AI layer. We will define the `BaseAIProvider` and build a mock provider first, then the actual `GeminiProvider`.

### Warnings & Common Mistakes to Avoid:
*   **Coupling AI logic to endpoints**: Keep the API routes thin. The AI calls should be in the `services/` or `ai/` layer.
*   **Sync processing timeouts**: LLM calls can be slow. For the MVP, we might wait synchronously, but we must design the service layer so it can easily be swapped to an async queue (returning a `job_id`) later.
*   **Over-engineering the parser**: Do not try to build a universal regex parser initially. Let's just extract plain text or split by lines, and let the LLM do the heavy lifting of understanding the log structure.
*   **Hardcoding Vendor Details**: Ensure prompts and configurations are not hardcoded to a specific vendor's format within the core logic; use the abstraction layer to map standard inputs to vendor-specific API structures.
