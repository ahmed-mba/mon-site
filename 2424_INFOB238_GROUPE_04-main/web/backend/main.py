# main.py - Version FINALE et COMPLÈTE avec toutes les routes corrigées

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import distinct
import uvicorn
import json

from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, get_db, engine
import middleware
from models.destination import Destination, initialize_destinations
from models.package import Package, initialize_packages
from models.user import User
from models.favorite import Favorite
from routes import destinations, packages, auth, favorites
from datetime import datetime, timedelta

# Création des tables
User.metadata.create_all(bind=engine)
Destination.metadata.create_all(bind=engine)
Package.metadata.create_all(bind=engine)
Favorite.metadata.create_all(bind=engine)

app = FastAPI(title="GO unamur", version="2.0.0")
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://0.0.0.0",
    "http://0.0.0.0:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.middleware("http")(middleware.auth_middleware)


# ==================== ROUTES HTML PRINCIPALES ====================

@app.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    popular_destinations_obj = db.query(Destination).limit(4).all()
    featured_packages_obj = db.query(Package).limit(2).all()
    destinations_for_js = [{"name": d.name, "lat": d.coordinates.get('lat',0), "lng": d.coordinates.get('lng',0)} for d in popular_destinations_obj]
    destinations_json_string = json.dumps(destinations_for_js)
    return templates.TemplateResponse("index.html", {
        "request": request, "popular_destinations": popular_destinations_obj,
        "featured_packages": featured_packages_obj, "destinations_json_for_map": destinations_json_string,
        "page_title": "GO - Explorez le monde"
    })

# Dans main.py, remplacez la fonction destinations_page

@app.get("/destinations", response_class=HTMLResponse)
async def destinations_page(
    request: Request,
    db: Session = Depends(get_db),
    continent: str = None,
    price_category: str = None,
    min_rating: float = None,
    search: str = None
):
    """Page des destinations AVEC filtres fonctionnels"""
    
    query = db.query(Destination)
    
    # Appliquer les filtres s'ils sont présents dans l'URL
    if continent:
        query = query.filter(Destination.continent == continent)
    if price_category:
        query = query.filter(Destination.price_category == price_category)
    if min_rating:
        query = query.filter(Destination.rating >= min_rating)
    if search:
        query = query.filter(Destination.name.contains(search))
        
    destinations_obj = query.all()
    
    # Convertir les objets en dictionnaires pour le template
    destinations_data = [
        {"id": d.id, "name": d.name, "country": d.country, "description": d.description, "image_url": d.image_url, "rating": d.rating}
        for d in destinations_obj
    ]
    
    # Obtenir la liste de tous les continents pour le menu déroulant du filtre
    continents_data = [c[0] for c in db.query(distinct(Destination.continent)).order_by(Destination.continent).all() if c[0]]

    # Passer les filtres actuels au template pour qu'il puisse les afficher
    current_filters = {
        "continent": continent,
        "price_category": price_category,
        "min_rating": min_rating,
        "search": search
    }

    return templates.TemplateResponse("destinations.html", {
        "request": request, 
        "destinations": destinations_data,
        "all_continents": continents_data, # Renommé pour plus de clarté
        "current_filters": current_filters,
        "page_title": "Nos Destinations"
    })

@app.get("/packages", response_class=HTMLResponse)
async def packages_page(request: Request, db: Session = Depends(get_db)):
    packages_obj = db.query(Package).all()
    packages_data = [{"id": p.id, "name": p.name, "description": p.description, "duration": p.duration, "price": p.price, "image_url": p.image_url} for p in packages_obj]
    return templates.TemplateResponse("packages.html", {
        "request": request, "packages": packages_data, "page_title": "Nos Packages de Voyage"
    })

@app.get("/search", response_class=HTMLResponse)
async def search_page(request: Request, db: Session = Depends(get_db), q: str = None):
    destinations_results, packages_results = [], []
    if q:
        dest_obj = db.query(Destination).filter(Destination.name.contains(q) | Destination.description.contains(q)).all()
        destinations_results = [{"id": d.id, "name": d.name, "country": d.country, "image_url": d.image_url} for d in dest_obj]
        pkg_obj = db.query(Package).filter(Package.name.contains(q) | Package.description.contains(q)).all()
        packages_results = [{"id": p.id, "name": p.name, "duration": p.duration, "image_url": p.image_url} for p in pkg_obj]
    
    return templates.TemplateResponse("search.html", {
        "request": request, "query": q, "destinations": destinations_results,
        "packages": packages_results, "total_results": len(destinations_results) + len(packages_results),
        "page_title": f"Recherche pour '{q}'" if q else "Recherche"
    })

@app.get("/auth", response_class=HTMLResponse)
async def auth_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request, "page_title": "Connexion"})

@app.get("/favorites", response_class=HTMLResponse)
async def favorites_page(request: Request):
    return templates.TemplateResponse("favorites.html", {"request": request, "user": None, "favorites": [], "page_title": "Mes Favoris"})


# ==================== ROUTES HTML DE DÉTAIL ET RÉSERVATION ====================

@app.get("/destination/{destination_id}", response_class=HTMLResponse)
async def destination_detail(request: Request, destination_id: int, db: Session = Depends(get_db)):
    dest_obj = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest_obj: raise HTTPException(status_code=404, detail="Destination non trouvée")
    
    map_data_json = json.dumps({"name": dest_obj.name, "lat": dest_obj.coordinates.get('lat',0), "lng": dest_obj.coordinates.get('lng',0)})
    
    return templates.TemplateResponse("destination-detail.html", {
        "request": request, "destination": dest_obj, "map_data_json": map_data_json, "page_title": dest_obj.name
    })

@app.get("/package/{package_id}", response_class=HTMLResponse)
async def package_detail(request: Request, package_id: int, db: Session = Depends(get_db)):
    pkg_obj = db.query(Package).filter(Package.id == package_id).first()
    if not pkg_obj: raise HTTPException(status_code=404, detail="Package non trouvé")
    
    return templates.TemplateResponse("package-detail.html", {"request": request, "package": pkg_obj, "page_title": pkg_obj.name})


@app.get("/checkout/{package_id}", response_class=HTMLResponse)
async def checkout_page(request: Request, package_id: int, db: Session = Depends(get_db)):
    """Page de paiement pour un package - Version complète"""
    
    package_obj = db.query(Package).filter(Package.id == package_id).first()
    
    if not package_obj:
        raise HTTPException(status_code=404, detail="Package non trouvé")
    
    # On convertit l'objet en dictionnaire pour le template
    package_data = {
        "id": package_obj.id,
        "name": package_obj.name,
        "duration": package_obj.duration,
        "price": package_obj.price,
        "image_url": package_obj.image_url
    }
    
    context = {
        "request": request,
        "package": package_data,
        "page_title": f"Réservation - {package_data['name']}"
    }
    
    return templates.TemplateResponse("checkout.html", context)


@app.get("/destination/{destination_id}/booking", response_class=HTMLResponse)
async def destination_booking_page(request: Request, destination_id: int, db: Session = Depends(get_db)):
    """Page de réservation pour une destination - Version complète et corrigée"""
    
    dest_obj = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest_obj:
        raise HTTPException(status_code=404, detail="Destination non trouvée")

    # On convertit l'objet en dictionnaire pour plus de sécurité
    destination_data = {
        "id": dest_obj.id, "name": dest_obj.name, "country": dest_obj.country,
        "continent": dest_obj.continent, "image_url": dest_obj.image_url,
        "price_category": dest_obj.price_category, "rating": dest_obj.rating
    }

    # Calcul d'un prix de base par jour
    price_map = {'budget': 50, 'moderate': 100, 'luxury': 200}
    base_price = price_map.get(destination_data.get("price_category"), 100)
    
    # Obtenir la date de demain pour le calendrier
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    context = {
        "request": request,
        "destination": destination_data,
        "base_price": base_price,
        "tomorrow_date": tomorrow,
        "page_title": f"Réserver - {destination_data['name']}"
    }
    
    return templates.TemplateResponse("destination-booking.html", context)


# ==================== ROUTES API ET INITIALISATION ====================

app.include_router(auth.router, prefix="/api")
app.include_router(destinations.router, prefix="/api")
app.include_router(packages.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")

def init_db():
    db = SessionLocal()
    try:
        if db.query(Destination).count() == 0:
            print("Initialisation des destinations...")
            initialize_destinations(db)
        if db.query(Package).count() == 0:
            print("Initialisation des packages...")
            initialize_packages(db)
        print("Base de données initialisée.")
    finally:
        db.close()
init_db()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)