import json
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
from src.worker import ScraperWorker
from src.detector import Marketplace

@pytest.fixture
def mock_db():
    db = MagicMock()
    # Mocking fetchone for gen_random_uuid() which returns a tuple
    db.execute.return_value.fetchone.return_value = ("test-id",)
    return db

@pytest.fixture
def mock_redis():
    with patch("src.worker.Redis") as mock:
        yield mock.from_url.return_value

@pytest.fixture
def worker(mock_redis):
    # Mock settings.redis_url
    with patch("src.worker.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        worker = ScraperWorker()
        worker.browser = MagicMock()
        return worker

@pytest.mark.asyncio
async def test_process_job_invalid_data(worker):
    # Test job with missing data
    await worker.process_job({})
    # Should log error and return
    # (Integration of logger verification could be added here)

@pytest.mark.asyncio
async def test_process_job_success(worker, mock_db):
    job_data = {"affiliateLinkId": "link-123"}
    
    # Mock DB response for affiliate link
    mock_db.execute.return_value.fetchone.side_effect = [
        ("link-123", "http://mercadolivre.com/p1", "mercado_livre"), # Link query
        ("run-123",), # ScrapeRun insert
        None, # Product check query (No found)
        ("prod-123",), # Product insert
    ]

    # Mock scraper
    mock_scraper = AsyncMock()
    mock_product = MagicMock()
    mock_product.marketplace = "mercado_livre"
    mock_product.canonical_product_id = "ML123"
    mock_product.model_dump.return_value = {"title": "Test Item", "marketplace": "mercado_livre", "canonical_product_id": "ML123"}
    mock_product.images = []
    mock_scraper.scrape.return_value = mock_product

    with patch.object(worker, "get_scraper", return_value=mock_scraper), \
         patch("src.worker.SessionLocal", return_value=mock_db), \
         patch("src.worker.detect_marketplace", return_value=Marketplace.MERCADO_LIVRE):
        
        await worker.process_job(job_data)

    # Verify DB calls
    # 1. Select link
    # 2. Insert scrape run
    # 3. Product check
    # 4. Product insert
    # 5. Update affiliate link
    # 6. Insert version
    # 7. Update scrape run success
    assert mock_db.execute.call_count >= 7
    mock_db.commit.assert_called()

@pytest.mark.asyncio
async def test_process_job_error_update(worker, mock_db):
    job_data = {"affiliateLinkId": "link-123"}
    
    # Mock DB response
    mock_db.execute.return_value.fetchone.side_effect = [
        ("link-123", "http://mercadolivre.com/p1", "mercado_livre"),
        ("run-123",)
    ]

    # Force error during scraping
    with patch.object(worker, "get_scraper", side_effect=Exception("Scrape failed")), \
         patch("src.worker.SessionLocal", return_value=mock_db):
        
        await worker.process_job(job_data)

    # Verify scrape_runs status update to 'error'
    # The 3rd execute call should be the update status to error
    error_update_call = mock_db.execute.call_args_list[2]
    assert "UPDATE scrape_runs" in error_update_call[0][0]
    assert "status = 'error'" in error_update_call[0][0]
    mock_db.commit.assert_called()
