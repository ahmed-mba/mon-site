# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.validators import validate_password, validate_email
from database import get_db
from models import user
from utils.auth_utils import authenticate_user, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/login")
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Connexion utilisateur - Version simplifiée pour le frontend
    """
    user_obj = authenticate_user(db, form_data.username, form_data.password)
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou mot de passe incorrect"
        )
    
    # Créer le token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user_obj.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_email": user_obj.email,
        "user_name": user_obj.name
    }

from models.user import UserCreate, User, create_user

# Modifier la fonction register_user
@router.post("/register")
async def register_user(
    user_data: user.UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Enregistrer un nouvel utilisateur.
    """
    # Valider l'email
    if not validate_email(user_data.email):
        raise HTTPException(status_code=400, detail="Format d'email invalide")
    
    # Valider le mot de passe
    password_check = validate_password(user_data.password)
    if not password_check["is_valid"]:
        raise HTTPException(status_code=400, detail=password_check["errors"])
    
    # Vérifier si l'email existe déjà
    db_user = db.query(user.User).filter(user.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Créer un nouvel utilisateur
    new_user = user.create_user(db, user_data)
    
    return {"message": "Utilisateur créé avec succès", "user_id": new_user.id}