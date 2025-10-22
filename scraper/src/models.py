from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal


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
