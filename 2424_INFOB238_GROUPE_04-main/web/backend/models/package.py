from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Base, SessionLocal

# Table d'association pour les destinations dans les packages
package_destinations = Table(
    "package_destinations",
    Base.metadata,
    Column("package_id", Integer, ForeignKey("packages.id")),
    Column("destination_id", Integer, ForeignKey("destinations.id"))
)

# Modèle SQLAlchemy pour la base de données
class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    duration = Column(Integer)  # en jours
    price = Column(Float)
    discount_price = Column(Float, nullable=True)
    is_promoted = Column(Boolean, default=False)
    included_services = Column(JSON)  # Liste des services inclus
    itinerary = Column(JSON)  # Détails de l'itinéraire
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relation avec les destinations
    destinations = relationship("Destination", secondary=package_destinations, backref="packages")

# Modèles Pydantic pour les requêtes et réponses API
class ItineraryDayModel(BaseModel):
    day: int
    title: str
    description: str
    activities: List[str]

class PackageBase(BaseModel):
    name: str
    description: str
    image_url: str
    duration: int
    price: float
    discount_price: Optional[float] = None
    is_promoted: bool = False
    included_services: List[str]

class PackageCreate(PackageBase):
    destination_ids: List[int]
    itinerary: List[ItineraryDayModel]

class DestinationBrief(BaseModel):
    id: int
    name: str
    country: str
    image_url: str
    
    class Config:
        from_attributes = True

class PackageResponse(PackageBase):
    id: int
    destinations: List[DestinationBrief]
    itinerary: List[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Fonction pour initialiser quelques packages par défaut
def initialize_packages(db):
    # Vérifier si des packages existent déjà
    if db.query(Package).count() > 0:
        return
    
    # S'assurer que nous avons des destinations
    from models.destination import Destination
    destinations = db.query(Destination).all()
    if not destinations:
        return
    
    # Créer un dictionnaire pour faciliter l'accès aux destinations
    dest_dict = {d.name: d for d in destinations}
    
    # Liste des packages par défaut
    default_packages = [
        {
            "name": "Tour d'Europe",
            "description": "Découvrez 4 capitales européennes en 10 jours : Paris, Rome, Barcelone et Londres. Un voyage culturel inoubliable à travers les plus belles villes d'Europe.",
            "image_url": "/static/images/destinations/europe-tour.jpg",
            "duration": 10,
            "price": 2500,
            "discount_price": 1999,
            "is_promoted": True,
            "included_services": [
                "Vols internationaux",
                "Transferts entre les villes",
                "Hébergement en hôtel 4 étoiles",
                "Petit-déjeuner inclus",
                "Visites guidées"
            ],
            "itinerary": [
                {
                    "day": 1,
                    "title": "Arrivée à Paris",
                    "description": "Accueil à l'aéroport et transfert à l'hôtel. Temps libre pour découvrir la ville.",
                    "activities": ["Promenade sur les Champs-Élysées", "Dîner de bienvenue"]
                },
                {
                    "day": 2,
                    "title": "Paris - Monuments emblématiques",
                    "description": "Journée dédiée à la découverte des principaux monuments parisiens.",
                    "activities": ["Tour Eiffel", "Arc de Triomphe", "Musée du Louvre"]
                },
                {
                    "day": 3,
                    "title": "Paris - Montmartre et Seine",
                    "description": "Découverte du quartier artistique et croisière sur la Seine.",
                    "activities": ["Visite de Montmartre", "Basilique du Sacré-Cœur", "Croisière sur la Seine"]
                },
                {
                    "day": 4,
                    "title": "Transfert à Rome",
                    "description": "Vol pour Rome. Accueil et transfert à l'hôtel. Soirée libre.",
                    "activities": ["Vol Paris-Rome", "Installation à l'hôtel", "Promenade dans le centre historique"]
                },
                {
                    "day": 5,
                    "title": "Rome antique",
                    "description": "Visite des sites antiques de la capitale italienne.",
                    "activities": ["Colisée", "Forum romain", "Mont Palatin"]
                },
                {
                    "day": 6,
                    "title": "Vatican",
                    "description": "Journée consacrée à la découverte de la Cité du Vatican.",
                    "activities": ["Musées du Vatican", "Chapelle Sixtine", "Basilique Saint-Pierre"]
                },
                {
                    "day": 7,
                    "title": "Transfert à Barcelone",
                    "description": "Vol pour Barcelone. Accueil et transfert à l'hôtel.",
                    "activities": ["Vol Rome-Barcelone", "Installation à l'hôtel", "Promenade sur Las Ramblas"]
                },
                {
                    "day": 8,
                    "title": "Barcelone - Gaudí",
                    "description": "Découverte des œuvres du célèbre architecte catalan.",
                    "activities": ["Sagrada Familia", "Parc Güell", "Casa Batlló"]
                },
                {
                    "day": 9,
                    "title": "Barcelone - Quartier gothique",
                    "description": "Visite du quartier gothique et temps libre.",
                    "activities": ["Cathédrale de Barcelone", "Place Royale", "Plage de Barceloneta"]
                },
                {
                    "day": 10,
                    "title": "Retour",
                    "description": "Transfert à l'aéroport et vol de retour.",
                    "activities": ["Transfert à l'aéroport", "Vol de retour"]
                }
            ],
            "destinations_names": ["Paris"]  # Seul Paris est dans notre liste de destinations
        },
        {
            "name": "Découverte de l'Asie",
            "description": "Un voyage inoubliable à travers l'Asie, incluant Tokyo, Bali et d'autres destinations enchanteresses. Traditions, cuisine locale et paysages à couper le souffle.",
            "image_url": "/static/images/destinations/asia-discovery.jpg",
            "duration": 14,
            "price": 2250,
            "discount_price": None,
            "is_promoted": False,
            "included_services": [
                "Vols internationaux",
                "Hébergement en hôtel 3-4 étoiles",
                "Petit-déjeuner inclus",
                "Transferts aéroport-hôtel",
                "Guide anglophone"
            ],
            "itinerary": [
                {
                    "day": 1,
                    "title": "Arrivée à Tokyo",
                    "description": "Accueil à l'aéroport et transfert à l'hôtel. Temps libre.",
                    "activities": ["Installation à l'hôtel", "Dîner de bienvenue"]
                },
                {
                    "day": 2,
                    "title": "Tokyo moderne",
                    "description": "Découverte des quartiers modernes et animés de Tokyo.",
                    "activities": ["Quartier de Shibuya", "Tour de Tokyo", "Shopping à Ginza"]
                },
                {
                    "day": 3,
                    "title": "Tokyo traditionnelle",
                    "description": "Visite des sites historiques et traditionnels.",
                    "activities": ["Temple Senso-ji", "Parc Ueno", "Marché aux poissons Tsukiji"]
                },
                {
                    "day": 4,
                    "title": "Excursion au Mont Fuji",
                    "description": "Journée d'excursion au célèbre Mont Fuji.",
                    "activities": ["Mont Fuji", "Lac Kawaguchi", "Village traditionnel"]
                },
                {
                    "day": 5,
                    "title": "Transfert à Bali",
                    "description": "Vol pour Bali. Accueil et transfert à l'hôtel.",
                    "activities": ["Vol Tokyo-Bali", "Installation à l'hôtel"]
                },
                {
                    "day": 6,
                    "title": "Bali - Plages",
                    "description": "Journée détente sur les plages balinaises.",
                    "activities": ["Plage de Kuta", "Surf", "Massage balinais"]
                },
                {
                    "day": 7,
                    "title": "Bali - Temples",
                    "description": "Découverte des temples emblématiques de l'île.",
                    "activities": ["Temple Tanah Lot", "Temple Uluwatu", "Danse traditionnelle kecak"]
                },
                {
                    "day": 8,
                    "title": "Bali - Ubud",
                    "description": "Visite du centre culturel et artistique de Bali.",
                    "activities": ["Forêt des singes", "Rizières en terrasses", "Marché d'Ubud"]
                },
                {
                    "day": 9,
                    "title": "Journée libre à Bali",
                    "description": "Journée libre pour profiter de l'île à votre rythme.",
                    "activities": ["Activités au choix", "Détente"]
                },
                {
                    "day": 10,
                    "title": "Transfert à Bangkok",
                    "description": "Vol pour Bangkok. Accueil et transfert à l'hôtel.",
                    "activities": ["Vol Bali-Bangkok", "Installation à l'hôtel"]
                },
                {
                    "day": 11,
                    "title": "Bangkok - Palais et temples",
                    "description": "Visite des sites emblématiques de la capitale thaïlandaise.",
                    "activities": ["Grand Palais", "Wat Pho", "Wat Arun"]
                },
                {
                    "day": 12,
                    "title": "Bangkok - Marchés et canaux",
                    "description": "Découverte des marchés traditionnels et balade sur les canaux.",
                    "activities": ["Marché flottant", "Balade en bateau sur les canaux", "Marché nocturne"]
                },
                {
                    "day": 13,
                    "title": "Journée libre à Bangkok",
                    "description": "Journée libre pour découvrir la ville à votre rythme.",
                    "activities": ["Shopping", "Massage thaï", "Cuisine locale"]
                },
                {
                    "day": 14,
                    "title": "Retour",
                    "description": "Transfert à l'aéroport et vol de retour.",
                    "activities": ["Transfert à l'aéroport", "Vol de retour"]
                }
            ],
            "destinations_names": ["Tokyo", "Bali"]
        }
    ]
    
    # Ajouter les packages à la base de données
    for pkg_data in default_packages:
        # Extraire les noms des destinations
        destinations_names = pkg_data.pop("destinations_names")
        
        # Créer le package
        package = Package(**pkg_data)
        
        # Ajouter les destinations au package
        for dest_name in destinations_names:
            if dest_name in dest_dict:
                package.destinations.append(dest_dict[dest_name])
        
        db.add(package)
    
    db.commit()