from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Définir le chemin du fichier de base de données SQLite
DATABASE_URL = "sqlite:///./data/travel_db.sqlite"

# Créer le répertoire data s'il n'existe pas
os.makedirs(os.path.dirname("./data/"), exist_ok=True)

# Créer l'engine SQLAlchemy
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Créer une session locale
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Créer une classe de base pour les modèles
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()