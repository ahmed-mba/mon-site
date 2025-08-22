# models/destination.py - Version FINALE avec les chemins d'images corrigés

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Base

# Modèle SQLAlchemy
class Destination(Base):
    __tablename__ = "destinations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String, index=True)
    continent = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    rating = Column(Float, default=0.0)
    price_category = Column(String)
    coordinates = Column(JSON)
    activities = Column(JSON)
    weather_info = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Modèles Pydantic (inchangés)
class CoordinatesModel(BaseModel):
    lat: float
    lng: float

class WeatherInfoModel(BaseModel):
    spring: str; summer: str; autumn: str; winter: str

class DestinationBase(BaseModel):
    name: str; country: str; continent: str; description: str; image_url: str; price_category: str

class DestinationCreate(DestinationBase):
    coordinates: CoordinatesModel; activities: List[str]; weather_info: WeatherInfoModel

class DestinationResponse(DestinationBase):
    id: int; rating: float; coordinates: Dict[str, float]; activities: List[str]; weather_info: Dict[str, str]; created_at: datetime
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

# Fonction d'initialisation avec les BONS chemins d'images
def initialize_destinations(db):
    if db.query(Destination).count() > 0:
        return
    
    default_destinations = [
        {
            "name": "Paris", "country": "France", "continent": "Europe",
            "description": "La ville de l'amour avec ses monuments emblématiques.",
            "image_url": "/static/images/destinations/paris.jpg", # CORRIGÉ
            "rating": 4.8, "price_category": "luxury",
            "coordinates": {"lat": 48.8566, "lng": 2.3522},
            "activities": ["Tour Eiffel", "Louvre"], "weather_info": {"summer": "18-25°C"}
        },
        {
            "name": "Bali", "country": "Indonésie", "continent": "Asie",
            "description": "Île paradisiaque connue pour ses plages et ses temples.",
            "image_url": "/static/images/destinations/bali.jpg",
            "rating": 4.7, "price_category": "moderate",
            "coordinates": {"lat": -8.4095, "lng": 115.1889},
            "activities": ["Plongée", "Surf"], "weather_info": {"summer": "27-33°C"}
        },
        {
            "name": "New York", "country": "États-Unis", "continent": "Amérique du Nord",
            "description": "La ville qui ne dort jamais, avec ses gratte-ciels emblématiques.",
            "image_url": "/static/images/destinations/new-york.jpg", # CORRIGÉ
            "rating": 4.6, "price_category": "luxury",
            "coordinates": {"lat": 40.7128, "lng": -74.0060},
            "activities": ["Times Square", "Central Park"], "weather_info": {"summer": "23-30°C"}
        },
        {
            "name": "Tokyo", "country": "Japon", "continent": "Asie",
            "description": "Métropole ultramoderne mêlant tradition et futurisme.",
            "image_url": "/static/images/destinations/tokyo.jpg",
            "rating": 4.9, "price_category": "luxury",
            "coordinates": {"lat": 35.6762, "lng": 139.6503},
            "activities": ["Temple Senso-ji", "Shibuya"], "weather_info": {"summer": "25-35°C"}
        },
        {
            "name": "Le Caire", "country": "Égypte", "continent": "Afrique",
            "description": "Célèbre pour ses pyramides et son musée égyptien.",
            "image_url": "/static/images/destinations/cairo.jpg", # CORRIGÉ
            "rating": 4.5, "price_category": "budget",
            "coordinates": {"lat": 30.0444, "lng": 31.2357},
            "activities": ["Pyramides de Gizeh", "Musée égyptien"], "weather_info": {"summer": "30-40°C"}
        },
        {
            "name": "Rio de Janeiro", "country": "Brésil", "continent": "Amérique du Sud",
            "description": "Célèbre pour ses plages comme Copacabana et le Christ Rédempteur.",
            "image_url": "/static/images/destinations/rio-de-janeiro.jpg", # CORRIGÉ
            "rating": 4.7, "price_category": "moderate",
            "coordinates": {"lat": -22.9068, "lng": -43.1729},
            "activities": ["Copacabana", "Christ Rédempteur"], "weather_info": {"summer": "26-33°C"}
        },
        {
            "name": "Sydney", "country": "Australie", "continent": "Océanie",
            "description": "Célèbre pour son opéra emblématique et son harbour bridge.",
            "image_url": "/static/images/destinations/sydney.jpg",
            "rating": 4.8, "price_category": "luxury",
            "coordinates": {"lat": -33.8688, "lng": 151.2093},
            "activities": ["Opéra de Sydney", "Plage de Bondi"], "weather_info": {"summer": "20-26°C"}
        }
    ]
    
    for dest_data in default_destinations:
        db.add(Destination(**dest_data))
    
    db.commit()