# Ce fichier __init__.py permet de définir le package "models"
# et de simplifier les imports dans le reste du code

# Ajouter le chemin parent pour les imports absolus
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importer tous les modèles pour qu'ils soient accessibles via models.*
# Utilisez soit des imports absolus, SOIT des imports relatifs, pas les deux
# Option 1: Imports absolus
from models.user import User, UserCreate, UserResponse
from models.destination import Destination, DestinationCreate, DestinationResponse, initialize_destinations
from models.package import Package, PackageCreate, PackageResponse, initialize_packages
from models.favorite import Favorite, FavoriteCreate, FavoriteResponse

# Option 2: Pour utiliser des imports relatifs, vous devez exécuter Python comme un module
# from .user import User, UserCreate, UserResponse
# from .destination import Destination, DestinationCreate, DestinationResponse, initialize_destinations
# from .package import Package, PackageCreate, PackageResponse, initialize_packages
# from .favorite import Favorite, FavoriteCreate, FavoriteResponse

# Définir ce qui est accessible avec "from models import *"
__all__ = [
    'User', 'UserCreate', 'UserResponse',
    'Destination', 'DestinationCreate', 'DestinationResponse',
    'Package', 'PackageCreate', 'PackageResponse',
    'Favorite', 'FavoriteCreate', 'FavoriteResponse',
    'initialize_destinations', 'initialize_packages'
]