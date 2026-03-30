import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import Column, String, BigInt, Text, JSON, DateTime, ForeignKey, Enum as SQLEnum, DECIMAL, Boolean
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


# --- Pydantic Models (For Scrapers) ---

class ProductData(BaseModel):
    marketplace: str
    canonical_product_id: Optional[str] = None
    title: str
    price_cents: int
    currency: str = "BRL"
    rating: Optional[Decimal] = None
    review_count: Optional[int] = None
    seller_name: Optional[str] = None
    category: Optional[str] = None
    main_image_url: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    url_affiliate: str
    url_canonical: Optional[str] = None

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else None
        }


# --- SQLAlchemy Models (For Database) ---

class Base(DeclarativeBase):
    pass


class MarketplaceEnum(enum.Enum):
    mercado_livre = "mercado_livre"
    magalu = "magalu"
    shopee = "shopee"


class ScrapeRunStatus(enum.Enum):
    queued = "queued"
    running = "running"
    success = "success"
    error = "error"


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace = Column(SQLEnum(MarketplaceEnum))
    canonical_product_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    price_cents = Column(BigInt, nullable=False)
    currency = Column(String, default="BRL")
    rating = Column(DECIMAL(3, 2), nullable=True)
    review_count = Column(BigInt, nullable=True)  # Prisma mapped Int to BigInt or Int
    seller_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    main_image_url = Column(String, nullable=True)
    images = Column(JSON, default="[]")
    url_affiliate = Column(String, nullable=False)
    url_canonical = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("ProductVersion", back_populates="product", cascade="all, delete-orphan")
    affiliate_links = relationship("AffiliateLink", back_populates="product")


class ProductVersion(Base):
    __tablename__ = "product_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    snapshot = Column(JSON, nullable=False)
    scraped_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="versions")


class AffiliateLink(Base):
    __tablename__ = "affiliate_links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    raw_url = Column(String, nullable=False)
    normalized_url = Column(String, nullable=True)
    marketplace = Column(SQLEnum(MarketplaceEnum))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="affiliate_links")
    scrape_runs = relationship("ScrapeRun", back_populates="affiliate_link")


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    affiliate_link_id = Column(String, ForeignKey("affiliate_links.id", ondelete="SET NULL"), nullable=True)
    status = Column(SQLEnum(ScrapeRunStatus), nullable=False)
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    affiliate_link = relationship("AffiliateLink", back_populates="scrape_runs")
