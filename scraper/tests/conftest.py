import os
os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

import sys
from unittest.mock import MagicMock

# Mock psycopg2 before any imports that might use it
mock_psycopg2 = MagicMock()
sys.modules["psycopg2"] = mock_psycopg2
sys.modules["psycopg2.extensions"] = MagicMock()
sys.modules["psycopg2.extras"] = MagicMock()

import pytest

@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    # This might be redundant now but good for safety
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
