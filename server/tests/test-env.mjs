// Unit tests must not inherit production integrations from a developer's .env.
// This module is imported before the test bundle so config/env.ts always sees
// deterministic, non-production values and never contacts external services.
process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "http://localhost:3000";
process.env.PUBLIC_APP_URL = "";
process.env.DATABASE_URL = "postgresql://zobhunger_test:zobhunger_test@127.0.0.1:5432/zobhunger_test";
process.env.JWT_SECRET = "zobhunger-unit-test-secret-that-is-at-least-32-characters";
process.env.REDIS_ENABLED = "false";
process.env.REDIS_URL = "";
process.env.CHATBOT_ENABLED = "false";
process.env.CHATBOT_CACHE_ENABLED = "false";
process.env.GROQ_API_KEY = "";
