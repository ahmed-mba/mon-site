from passlib.context import CryptContext

import jwt
from datetime import datetime, timedelta
from typing import Optional


SECRET_KEY = "votre_clé_secrète_à_changer_en_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Crée un token JWT avec les données fournies et une expiration
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Configuration pour le hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """
    Vérifie si un mot de passe en clair correspond à un mot de passe haché
    """
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db, email: str, password: str):
    """
    Vérifie les identifiants d'un utilisateur et retourne l'utilisateur si valide
    """
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from models.user import User
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user