// favorites.js - Gestion des favoris

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'interface utilisateur
    patupdateUserInterface();
    
    updateUserInterface();
    // Charger les favoris
    loadFavorites();
});

/**
 * Met à jour l'interface utilisateur en fonction du statut de connexion
 */
function patupdateUserInterface() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    
    // Mettre à jour le bouton d'authentification
    const authBtn = document.querySelector('.auth-btn');
    if (authBtn) {
        if (isLoggedIn && userName) {
            authBtn.textContent = userName;
            authBtn.href = '#'; // Page de profil à implémenter
        } else {
            authBtn.textContent = 'Connexion';
            authBtn.href = 'auth.html';
        }
    }
}

/**
 * Charge les favoris de l'utilisateur
 */
function loadFavorites() {
    console.log("Fonction loadFavorites() appelée");
    
    // Élément conteneur pour les favoris
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) return;
    
    // IMPORTANT: Vérifier si une autre fonction a déjà chargé du contenu
    if (favoritesGrid.children.length > 0) {
        console.log("Contenu déjà chargé, nettoyage...");
        favoritesGrid.innerHTML = '';
    }
    
    // Récupérer directement les IDs des favoris depuis localStorage
    const favoriteIds = JSON.parse(localStorage.getItem('favorites')) || [];
    console.log("IDs des favoris trouvés:", favoriteIds);
    
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        favoritesGrid.innerHTML = `
            <div class="login-required">
                <p>Vous devez être connecté pour voir vos favoris</p>
                <a href="auth.html" class="btn-primary">Se connecter</a>
            </div>
        `;
        return;
    }
    
    // Afficher un indicateur de chargement
    favoritesGrid.innerHTML = '<div class="loading">Chargement de vos favoris...</div>';
    
    if (favoriteIds.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="no-favorites">
                <p>Vous n'avez pas encore de favoris</p>
                <a href="destinations.html" class="btn-primary">Découvrir des destinations</a>
            </div>
        `;
        return;
    }
    
    // Récupérer les détails de chaque destination favorite
    Promise.all(
        favoriteIds.map(id => 
            fetch(`http://localhost:8000/destinations/${id}`)
            .then(response => {
                if (!response.ok) throw new Error(`Destination ${id} non trouvée`);
                return response.json();
            })
            .catch(error => {
                console.error(error);
                return null; // Retourner null pour les destinations non trouvées
            })
        )
    )
    .then(destinations => {
        // Filtrer les destinations null (non trouvées)
        const validDestinations = destinations.filter(dest => dest !== null);
        
        // Afficher les données pour déboguer
        console.log("Données des destinations reçues:", validDestinations);
        
        // IMPORTANT: Marquer le conteneur comme contenant seulement des favoris
        favoritesGrid.setAttribute('data-favorites-loaded', 'true');
        
        displayFavorites(validDestinations, favoritesGrid);
    })
    .catch(error => {
        console.error('Erreur:', error);
        favoritesGrid.innerHTML = `
            <div class="error-message">
                <p>Une erreur est survenue lors du chargement de vos favoris</p>
                <a href="destinations.html" class="btn-primary">Voir toutes les destinations</a>
            </div>
        `;
    });
}

/**
 * Utilise les favoris stockés localement comme solution de secours
 */
function useFallbackFavorites(favoritesGrid) {
    // Récupérer les IDs des favoris depuis localStorage
    const favoriteIds = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favoriteIds.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="no-favorites">
                <p>Vous n'avez pas encore de favoris</p>
                <a href="destinations.html" class="btn-primary">Découvrir des destinations</a>
            </div>
        `;
        return;
    }
    
    // Récupérer les détails de chaque destination favorite
    Promise.all(
        favoriteIds.map(id => 
            fetch(`http://localhost:8000/destinations/${id}`)
            .then(response => {
                if (!response.ok) throw new Error(`Destination ${id} non trouvée`);
                return response.json();
            })
            .catch(error => {
                console.error(error);
                return null; // Retourner null pour les destinations non trouvées
            })
        )
    )
    .then(destinations => {
        // Filtrer les destinations null (non trouvées)
        const validDestinations = destinations.filter(dest => dest !== null);
        displayFavorites(validDestinations, favoritesGrid);
    });
}

/**
 * Affiche les destinations favorites dans la grille
 */
function displayFavorites(favorites, container) {
    // Vider le conteneur
    container.innerHTML = '';
    
    // Si aucun favori n'est trouvé
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="no-favorites">
                <p>Vous n'avez pas encore de favoris</p>
                <a href="destinations.html" class="btn-primary">Découvrir des destinations</a>
            </div>
        `;
        return;
    }
    
    // Créer une carte pour chaque destination favorite
    favorites.forEach(destination => {
        const card = document.createElement('div');
        card.className = 'destination-card';
        
        // Déterminer l'image à utiliser en fonction de la destination
        let imageUrl = destination.image_url;
        
        // Afficher l'URL de l'image pour déboguer
        console.log(`Destination: ${destination.name}, Image URL originale: ${imageUrl}`);
        
        // Définir des images par défaut pour chaque destination connue
        if (destination.name === 'Paris') {
            imageUrl = 'static/images/destinations/8502577156ad9ca457e092c791c5117f.jpg';
        } else if (destination.name === 'Bali') {
            imageUrl = 'static/images/destinations/bali.jpg';
        } else if (destination.name === 'New York') {
            imageUrl = 'static/images/destinations/new y.jpg';
        } else if (destination.name === 'Tokyo') {
            imageUrl = 'static/images/destinations/tokyo.jpg';
        } else if (destination.name === 'Le Caire') {
            imageUrl = 'static/images/destinations/le Caire.jpg';
        } else if (destination.name === 'Rio de Janeiro') {
            imageUrl = 'static/images/destinations/Rio.jpg';
        } else if (destination.name === 'Sydney') {
            imageUrl = 'static/images/destinations/sydney.jpg';
        }
        
        console.log(`Destination: ${destination.name}, Image URL utilisée: ${imageUrl}`);
        
        card.innerHTML = `
            <div class="destination-image">
                <img src="${imageUrl || 'static/images/destinations/placeholder.jpg'}" alt="${destination.name}, ${destination.country}">
                <div class="destination-overlay">
                    <button class="favorite-btn active" data-id="${destination.id}"><i class="fas fa-heart"></i></button>
                </div>
            </div>
            <div class="destination-info">
                <h3>${destination.name}, ${destination.country}</h3>
                <div class="destination-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${destination.continent}</span>
                    <span><i class="fas fa-star"></i> ${destination.rating}/5</span>
                </div>
                <p>${destination.description.substring(0, 100)}${destination.description.length > 100 ? '...' : ''}</p>
                <a href="destination-detail.html?id=${destination.id}" class="btn-details">Voir plus</a>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Initialiser les boutons favoris
    initFavoriteButtons();
}

/**
 * Initialise les boutons favoris
 */
function initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const destinationId = this.getAttribute('data-id');
            
            // Retirer des favoris (puisque nous sommes sur la page des favoris)
            toggleFavorite(destinationId, true);
            
            // Supprimer la carte de destination de l'affichage
            const card = this.closest('.destination-card');
            if (card) {
                card.classList.add('removing');
                setTimeout(() => {
                    card.remove();
                    
                    // Vérifier s'il reste des favoris
                    const remainingCards = document.querySelectorAll('.favorites-grid .destination-card');
                    if (remainingCards.length === 0) {
                        const favoritesGrid = document.querySelector('.favorites-grid');
                        if (favoritesGrid) {
                            favoritesGrid.innerHTML = `
                                <div class="no-favorites">
                                    <p>Vous n'avez pas encore de favoris</p>
                                    <a href="destinations.html" class="btn-primary">Découvrir des destinations</a>
                                </div>
                            `;
                        }
                    }
                }, 300);
            }
        });
    });
}

/**
 * Active/désactive un favori
 * @param {string} destinationId - ID de la destination
 * @param {boolean} isFavorite - Si la destination est déjà en favori
 */
function toggleFavorite(destinationId, isFavorite) {
    // Récupérer les favoris actuels
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (isFavorite) {
        // Retirer des favoris
        favorites = favorites.filter(id => id !== destinationId.toString());
    } else {
        // Ajouter aux favoris
        favorites.push(destinationId.toString());
    }
    
    // Enregistrer les favoris dans le stockage local
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Si l'utilisateur est connecté, synchroniser avec l'API
    const token = localStorage.getItem('token');
    if (token) {
        const method = isFavorite ? 'DELETE' : 'POST';
        fetch(`http://localhost:8000/favorites/${destinationId}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour du favori`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Favori ${isFavorite ? 'retiré' : 'ajouté'} avec succès`);
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
}