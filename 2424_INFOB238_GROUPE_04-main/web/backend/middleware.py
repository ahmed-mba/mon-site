from fastapi import Request, Response
import time
import json
import logging
from typing import Callable
import os

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("travel_api")

# Créer le répertoire des logs s'il n'existe pas
os.makedirs("./logs", exist_ok=True)

# Middleware d'authentification et de logging
async def auth_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware pour:
    1. Logger les requêtes et réponses
    2. Mesurer le temps de réponse
    3. Gérer les erreurs
    4. Vérifier l'authentification pour les routes protégées
    """
    # Obtenir l'adresse IP du client
    client_host = request.client.host if request.client else "unknown"
    
    # Obtenir le chemin de la requête
    request_path = request.url.path
    
    # Enregistrer le début de la requête
    start_time = time.time()
    logger.info(f"Requête reçue - Méthode: {request.method}, Chemin: {request_path}, Client: {client_host}")
    
    # Vérifier l'authentification pour les routes protégées
    auth_required_routes = []
    token = request.headers.get("Authorization")
    
    # Si la route nécessite une authentification et qu'aucun token n'est fourni
    if any(request_path.startswith(route) for route in auth_required_routes) and (not token or not token.startswith("Bearer ")):
        # Enregistrer la tentative d'accès non autorisée
        logger.warning(f"Tentative d'accès non autorisé - Méthode: {request.method}, Chemin: {request_path}, Client: {client_host}")
        
        # Renvoyer une réponse d'erreur
        return Response(
            content=json.dumps({"detail": "Non autorisé"}),
            status_code=401,
            media_type="application/json",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Traiter la requête
        response = await call_next(request)
        
        # Calculer le temps de réponse
        process_time = time.time() - start_time
        
        # Enregistrer la réponse
        logger.info(f"Réponse envoyée - Statut: {response.status_code}, Temps: {process_time:.4f}s, Chemin: {request_path}")
        
        # Ajouter des en-têtes de performance
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except Exception as e:
        # Enregistrer l'erreur
        logger.error(f"Erreur lors du traitement - Chemin: {request_path}, Erreur: {str(e)}")
        
        # Renvoyer une réponse d'erreur
        return Response(
            content=json.dumps({"detail": "Une erreur est survenue lors du traitement de la requête"}),
            status_code=500,
            media_type="application/json"
        )