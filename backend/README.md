# QuizCraft AI - Backend

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
```

2. Install dependencies:
```bash
pip install -r requirements/dev.txt
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Run migrations (in Supabase dashboard)

5. Run the server:
```bash
python -m app.main
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
pytest
pytest --cov=app tests/
```

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes
│   ├── core/         # Core configuration
│   ├── models/       # Database models
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic
│   ├── repositories/ # Data access
│   └── utils/        # Utilities
├── tests/            # Test files
└── requirements/     # Dependencies
```