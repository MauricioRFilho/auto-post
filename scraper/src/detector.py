from urllib.parse import urlparse
from enum import Enum


class Marketplace(str, Enum):
    MERCADO_LIVRE = "mercado_livre"
    MAGALU = "magalu"
    SHOPEE = "shopee"


def detect_marketplace(url: str) -> Marketplace:
    """Detect marketplace from URL"""
    hostname = urlparse(url).netloc.lower()

    if 'mercadolivre' in hostname or 'mercadolibre' in hostname:
        return Marketplace.MERCADO_LIVRE
    elif 'magazineluiza' in hostname or 'magalu' in hostname:
        return Marketplace.MAGALU
    elif 'shopee' in hostname:
        return Marketplace.SHOPEE
    else:
        raise ValueError(f'Marketplace not supported: {hostname}')
