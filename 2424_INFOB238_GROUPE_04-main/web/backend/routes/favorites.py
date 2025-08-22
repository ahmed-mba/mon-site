# routes/favorites.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import user, destination, favorite

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)

@router.post("/{destination_id}")
async def add_favorite(
    destination_id: int,
    current_user: user.User = Depends(user.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ajouter une destination aux favoris de l'utilisateur.
    """
    # Vérifier si la destination existe
    db_destination = db.query(destination.Destination).filter(
        destination.Destination.id == destination_id
    ).first()
    if db_destination is None:
        raise HTTPException(status_code=404, detail="Destination non trouvée")
    
    # Vérifier si la destination est déjà dans les favoris
    db_favorite = db.query(favorite.Favorite).filter(
        favorite.Favorite.user_id == current_user.id,
        favorite.Favorite.destination_id == destination_id
    ).first()
    
    if db_favorite:
        raise HTTPException(
            status_code=400, 
            detail="Cette destination est déjà dans vos favoris"
        )
    
    # Ajouter aux favoris
    new_favorite = favorite.Favorite(
        user_id=current_user.id, 
        destination_id=destination_id
    )
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return {"message": "Destination ajoutée aux favoris"}

@router.delete("/{destination_id}")
async def remove_favorite(
    destination_id: int,
    current_user: user.User = Depends(user.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer une destination des favoris de l'utilisateur.
    """
    # Rechercher le favori
    db_favorite = db.query(favorite.Favorite).filter(
        favorite.Favorite.user_id == current_user.id,
        favorite.Favorite.destination_id == destination_id
    ).first()
    
    if not db_favorite:
        raise HTTPException(
            status_code=404, 
            detail="Cette destination n'est pas dans vos favoris"
        )
    
    # Supprimer des favoris
    db.delete(db_favorite)
    db.commit()
    
    return {"message": "Destination supprimée des favoris"}

@router.get("/", response_model=List[destination.DestinationResponse])
async def get_favorites(
    current_user: user.User = Depends(user.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les destinations favorites de l'utilisateur.
    """
    # Requête pour obtenir les destinations favorites
    favorites = db.query(destination.Destination).join(
        favorite.Favorite, 
        favorite.Favorite.destination_id == destination.Destination.id
    ).filter(
        favorite.Favorite.user_id == current_user.id
    ).all()
    
    return favorites 