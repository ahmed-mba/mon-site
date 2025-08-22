from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Base, SessionLocal

# Modèle SQLAlchemy pour la base de données
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Contrainte d'unicité pour éviter les doublons
    __table_args__ = (
        UniqueConstraint('user_id', 'destination_id', name='unique_user_destination'),
    )

# Modèles Pydantic pour les requêtes et réponses API
class FavoriteBase(BaseModel):
    destination_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteResponse(FavoriteBase):
    id: int
    user_id: int
    created_at: DateTime
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

# Fonction pour obtenir tous les favoris d'un utilisateur
def get_user_favorites(db, user_id: int):
    return db.query(Favorite).filter(Favorite.user_id == user_id).all()

# Fonction pour vérifier si une destination est dans les favoris d'un utilisateur
def is_favorite(db, user_id: int, destination_id: int):
    return db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.destination_id == destination_id
    ).first() is not None

# Fonction pour ajouter une destination aux favoris
def add_favorite(db, user_id: int, destination_id: int):
    # Vérifier si déjà dans les favoris
    if is_favorite(db, user_id, destination_id):
        return None
    
    # Créer un nouveau favori
    favorite = Favorite(user_id=user_id, destination_id=destination_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

# Fonction pour supprimer une destination des favoris
def remove_favorite(db, user_id: int, destination_id: int):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.destination_id == destination_id
    ).first()
    
    if favorite:
        db.delete(favorite)
        db.commit()
        return True
    
    return False