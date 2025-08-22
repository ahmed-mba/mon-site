# routes/packages.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models.package import Package, PackageResponse

router = APIRouter(
    prefix="/packages",
    tags=["packages"]
)

@router.get("/", response_model=List[PackageResponse])
async def get_packages(
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_duration: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    
    
   
    """
    Récupérer la liste des packages avec filtrage.
    """
    query = db.query(Package)
    
    # Filtrage par recherche
    if search:
        search = f"%{search}%"
        query = query.filter(Package.name.ilike(search) | Package.description.ilike(search))
    
    # Filtrage par prix
    if min_price is not None:
        query = query.filter(Package.price >= min_price)
    if max_price is not None:
        query = query.filter(Package.price <= max_price)
    
    # Filtrage par durée
    if min_duration is not None:
        query = query.filter(Package.duration >= min_duration)
    
    # Pagination
    packages = query.offset(skip).limit(limit).all()
    
    return packages

@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(package_id: int, db: Session = Depends(get_db)):
    """
    Récupérer les détails d'un package spécifique.
    """
    db_package = db.query(Package).filter(Package.id == package_id).first()
    if db_package is None:
        raise HTTPException(status_code=404, detail="Package non trouvé")
    
    return db_package