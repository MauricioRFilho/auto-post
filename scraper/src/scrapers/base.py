from abc import ABC, abstractmethod
from playwright.async_api import Page, Browser
from src.models import ProductData
from src.logger import logger
import json
import re


class BaseScraper(ABC):
    def __init__(self, browser: Browser):
        self.browser = browser

    @abstractmethod
    async def scrape(self, url: str) -> ProductData:
        """Scrape product data from URL"""
        pass

    async def extract_ld_json(self, page: Page) -> dict:
        """Extract JSON-LD structured data"""
        try:
            ld_json_elements = await page.query_selector_all('script[type="application/ld+json"]')
            for element in ld_json_elements:
                content = await element.text_content()
                if content:
                    data = json.loads(content)
                    if data.get('@type') == 'Product':
                        return data
        except Exception as e:
            logger.warning("Failed to extract LD+JSON", error=str(e))
        return {}

    def parse_price_to_cents(self, price_str: str) -> int:
        """Convert price string to cents (integer)"""
        if not price_str:
            return 0

        # Remove currency symbols and whitespace
        clean = re.sub(r'[^\d,.]', '', price_str)

        # Handle Brazilian format (1.234,56)
        if ',' in clean and '.' in clean:
            clean = clean.replace('.', '').replace(',', '.')
        elif ',' in clean:
            clean = clean.replace(',', '.')

        try:
            price_float = float(clean)
            return int(price_float * 100)
        except ValueError:
            logger.warning("Failed to parse price", price_str=price_str)
            return 0

    async def safe_text_content(self, page: Page, selector: str, default: str = "") -> str:
        """Safely get text content from selector"""
        try:
            element = await page.query_selector(selector)
            if element:
                text = await element.text_content()
                return text.strip() if text else default
        except Exception as e:
            logger.debug("Failed to get text content", selector=selector, error=str(e))
        return default

    async def collect_images(self, page: Page, selectors: list[str]) -> list[str]:
        """Collect image URLs from multiple selectors"""
        images = []
        for selector in selectors:
            try:
                elements = await page.query_selector_all(selector)
                for element in elements:
                    src = await element.get_attribute('src')
                    if src and src.startswith('http'):
                        images.append(src)
            except Exception as e:
                logger.debug("Failed to collect images", selector=selector, error=str(e))
        return list(dict.fromkeys(images))  # Remove duplicates

    def parse_rating(self, rating_str: str) -> Optional[Decimal]:
        """Parse rating string to Decimal"""
        if not rating_str:
            return None
        try:
            # Extract first number that looks like a rating
            match = re.search(r'(\d+[.,]\d+)', rating_str)
            if match:
                rating = match.group(1).replace(',', '.')
                return Decimal(rating)
        except Exception as e:
            logger.debug("Failed to parse rating", rating_str=rating_str, error=str(e))
        return None

    def parse_review_count(self, count_str: str) -> Optional[int]:
        """Parse review count string to integer"""
        if not count_str:
            return None
        try:
            # Extract numbers from string
            numbers = re.sub(r'[^\d]', '', count_str)
            if numbers:
                return int(numbers)
        except Exception as e:
            logger.debug("Failed to parse review count", count_str=count_str, error=str(e))
        return None
