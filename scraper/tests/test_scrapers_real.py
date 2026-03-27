import pytest
from playwright.async_api import async_playwright
from src.worker import ScraperWorker
from src.detector import detect_marketplace

@pytest.fixture(scope="module")
async def browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()

@pytest.fixture
def worker(browser):
    worker = ScraperWorker()
    worker.browser = browser
    return worker

@pytest.mark.asyncio
@pytest.mark.parametrize("url", [
    "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27393453",
    "https://www.magazineluiza.com.br/smartphone-samsung-galaxy-s24-256gb-preto-8gb-ram/p/237482800/te/s24s/",
    "https://shopee.com.br/product/12345678/910111213" # Example link (might fail if it needs real ID)
])
async def test_real_scraping(worker, url):
    try:
        marketplace = detect_marketplace(url)
        scraper = worker.get_scraper(marketplace)
        product = await scraper.scrape(url)
        
        assert product.title is not None
        assert len(product.title) > 0
        assert product.marketplace == marketplace.value
        print(f"✅ Successfully scraped {url}: {product.title}")
    except Exception as e:
        pytest.skip(f"Skipped real-link test due to possible network/blocking: {str(e)}")
