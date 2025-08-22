# utils/validators.py
import re
from typing import Optional
from datetime import datetime

def validate_email(email: str) -> bool:
    """
    Valider le format d'un email.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> dict:
    """
    Valider la force d'un mot de passe.
    Retourne un dictionnaire avec is_valid et les critères manqués.
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Le mot de passe doit contenir au moins 8 caractères")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Le mot de passe doit contenir au moins une majuscule")
    
    if not re.search(r'[a-z]', password):
        errors.append("Le mot de passe doit contenir au moins une minuscule")
    
    if not re.search(r'\d', password):
        errors.append("Le mot de passe doit contenir au moins un chiffre")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Le mot de passe doit contenir au moins un caractère spécial")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

def validate_phone_number(phone: str) -> bool:
    """
    Valider un numéro de téléphone (format français/belge).
    """
    # Supprimer tous les espaces et caractères spéciaux
    clean_phone = re.sub(r'[\s\-\.\(\)]', '', phone)
    
    # Patterns pour différents formats
    patterns = [
        r'^\+33[1-9](\d{8})$',  # France +33
        r'^\+32[1-9](\d{8})$',  # Belgique +32
        r'^0[1-9](\d{8})$',     # Format national français
        r'^0[1-9](\d{7})$',     # Format national belge
    ]
    
    return any(re.match(pattern, clean_phone) for pattern in patterns)

def validate_price(price: float) -> bool:
    """
    Valider qu'un prix est positif et raisonnable.
    """
    return 0 < price <= 50000  # Max 50,000€ pour un voyage

def validate_rating(rating: float) -> bool:
    """
    Valider qu'une note est entre 0 et 5.
    """
    return 0 <= rating <= 5

def validate_duration(duration: int) -> bool:
    """
    Valider qu'une durée de voyage est raisonnable (en jours).
    """
    return 1 <= duration <= 365  # Entre 1 jour et 1 an

def validate_date_range(start_date: datetime, end_date: datetime) -> dict:
    """
    Valider qu'une période de dates est cohérente.
    """
    errors = []
    
    if start_date >= end_date:
        errors.append("La date de début doit être antérieure à la date de fin")
    
    if start_date < datetime.now():
        errors.append("La date de début ne peut pas être dans le passé")
    
    # Vérifier que le voyage ne dépasse pas 1 an
    if (end_date - start_date).days > 365:
        errors.append("La durée du voyage ne peut pas dépasser 1 an")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

def sanitize_search_term(search_term: str) -> str:
    """
    Nettoyer et sécuriser un terme de recherche.
    """
    if not search_term:
        return ""
    
    # Supprimer les caractères dangereux pour éviter les injections
    sanitized = re.sub(r'[<>"\';\\]', '', search_term.strip())
    
    # Limiter la longueur
    return sanitized[:100]

def validate_coordinates(latitude: float, longitude: float) -> bool:
    """
    Valider des coordonnées GPS.
    """
    return (-90 <= latitude <= 90) and (-180 <= longitude <= 180)

def validate_continent(continent: str) -> bool:
    """
    Valider qu'un continent est dans la liste autorisée.
    """
    valid_continents = [
        "Europe", "Asie", "Afrique", "Amérique du Nord", 
        "Amérique du Sud", "Océanie", "Antarctique"
    ]
    return continent in valid_continents

def validate_price_category(category: str) -> bool:
    """
    Valider qu'une catégorie de prix est valide.
    """
    valid_categories = ["Budget", "Moyen", "Luxe", "Premium"]
    return category in valid_categories