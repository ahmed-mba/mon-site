import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from utils.validators import sanitize_search_term, validate_rating
from database import get_db
from models.destination import Destination, DestinationResponse

router = APIRouter(
    prefix="/destinations",
    tags=["destinations"]
)

@router.get("/", response_model=List[DestinationResponse])
async def get_destinations(
    search: Optional[str] = None,
    continent: Optional[List[str]] = Query(None),
    price_category: Optional[List[str]] = Query(None),
    min_rating: Optional[float] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    # Sécuriser le terme de recherche
    if search:
        search = sanitize_search_term(search)
        if not search:  # Si vide après nettoyage
            search = None

    # Valider la note minimale
    if min_rating is not None and not validate_rating(min_rating):
        raise HTTPException(400, detail="La note doit être entre 0 et 5")
    
    """
    Récupérer la liste des destinations avec filtrage.
    """
    query = db.query(Destination)
    
    # Filtrer par terme de recherche
    if search:
        search = f"%{search}%"
        query = query.filter(
            or_(
                Destination.name.ilike(search),
                Destination.country.ilike(search),
                Destination.description.ilike(search)
            )
        )
    
    # Filtrer par continent
    if continent:
        query = query.filter(Destination.continent.in_(continent))
    
    # Filtrer par catégorie de prix
    if price_category:
        query = query.filter(Destination.price_category.in_(price_category))
    
    # Filtrer par note minimale
    if min_rating is not None:
        query = query.filter(Destination.rating >= min_rating)
    
    # Appliquer pagination
    destinations = query.offset(skip).limit(limit).all()
    
    return destinations

@router.get("/{destination_id}", response_model=DestinationResponse)
async def get_destination(destination_id: int, db: Session = Depends(get_db)):
    """
    Récupérer les détails d'une destination spécifique.
    """
    db_destination = db.query(Destination).filter(Destination.id == destination_id).first()
    if db_destination is None:
        raise HTTPException(status_code=404, detail="Destination non trouvée")
    
    return db_destination