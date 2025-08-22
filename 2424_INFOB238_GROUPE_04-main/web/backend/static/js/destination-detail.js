// destination-detail.js - Gestion de la page de détail des destinations

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'interface utilisateur
    updateUserInterface();
    
    // Charger les détails de la destination
    loadDestinationDetails();

    // Initialiser la page de destination
    initializeDestinationPage();
});

/**
 * Met à jour l'interface utilisateur en fonction du statut de connexion
 */
function initializeDestinationPage() {
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
 * Charge les détails de la destination depuis l'API
 */
function loadDestinationDetails() {
    // Récupérer l'ID de la destination depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('id');
    
    if (!destinationId) {
        showError("ID de destination manquant dans l'URL");
        return;
    }
    
    // Récupérer le conteneur
    const contentContainer = document.getElementById('destination-content');
    if (!contentContainer) return;
    
    // Afficher l'indicateur de chargement
    contentContainer.innerHTML = '<div class="loading">Chargement de la destination...</div>';
    
    // Appel à l'API
    fetch(`http://localhost:8000/destinations/${destinationId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(destination => {
            // Afficher les détails de la destination
            displayDestinationDetails(destination, contentContainer);
        })
        .catch(error => {
            console.error('Erreur:', error);
            showError("Impossible de charger les détails de cette destination");
        });
}

/**
 * Détermine l'URL de l'image pour une destination donnée
 * @param {Object} destination - Les données de la destination
 * @returns {string} - L'URL de l'image
 */
function getDestinationImageUrl(destination) {
    // Définir des images par défaut pour chaque destination connue
    if (destination.name === 'Paris') {
        return 'static/images/destinations/8502577156ad9ca457e092c791c5117f.jpg';
    } else if (destination.name === 'Bali') {
        return 'static/images/destinations/bali.jpg';
    } else if (destination.name === 'New York') {
        return 'static/images/destinations/new y.jpg';
    } else if (destination.name === 'Tokyo') {
        return 'static/images/destinations/tokyo.jpg';
    } else if (destination.name === 'Le Caire') {
        return 'static/images/destinations/le Caire.jpg';
    } else if (destination.name === 'Rio de Janeiro') {
        return 'static/images/destinations/Rio.jpg';
    } else if (destination.name === 'Sydney') {
        return 'static/images/destinations/sydney.jpg';
    }
    
    // Image par défaut si aucune correspondance
    return destination.image_url || 'static/images/destinations/placeholder.jpg';
}

/**
 * Affiche les détails d'une destination
 * @param {Object} destination - Les données de la destination
 * @param {HTMLElement} container - Le conteneur HTML
 */
function displayDestinationDetails(destination, container) {
    // Obtenir l'URL de l'image
    const imageUrl = getDestinationImageUrl(destination);
    
    // Construire le HTML des détails
    const detailsHtml = `
        <div class="destination-header">
            <h1>${destination.name}, ${destination.country}</h1>
            <div class="destination-meta-container">
                <div class="destination-meta">
                    <span class="destination-continent"><i class="fas fa-map-marker-alt"></i> ${destination.continent}</span>
                    <span class="destination-rating"><i class="fas fa-star"></i> ${destination.rating}/5</span>
                    <span class="destination-price-category"><i class="fas fa-tag"></i> ${getPriceCategoryText(destination.price_category)}</span>
                </div>
            </div>
        </div>
        
        <div class="destination-gallery">
            <div class="main-image">
                <img src="${imageUrl}" alt="${destination.name}" onerror="this.src='static/images/destinations/placeholder.jpg'">
            </div>
        </div>
        
        <!-- Ajout du bouton de réservation individuelle -->
        <div class="destination-actions">
            <a href="destination-booking.html?id=${destination.id}" class="btn-reserver">RÉSERVER CETTE DESTINATION</a>
        </div>
        
        <div class="destination-content-grid">
            <div class="destination-description">
                <h2>À propos de ${destination.name}</h2>
                <p>${destination.description}</p>
            </div>
            
            <div class="destination-info-box">
                <h3>Informations pratiques</h3>
                <ul class="info-list">
                    <li><strong>Meilleure période:</strong> ${destination.weather_info ? getBestTimeToVisit(destination.weather_info) : 'Information non disponible'}</li>
                    <li><strong>Catégorie de prix:</strong> ${getPriceCategoryText(destination.price_category)}</li>
                    <li><strong>Langue(s):</strong> Information non disponible</li>
                    <li><strong>Monnaie:</strong> Information non disponible</li>
                </ul>
            </div>
            
            <div class="destination-weather">
                <h3>Météo par saison</h3>
                ${getWeatherInfo(destination.weather_info)}
            </div>
            
            <div class="destination-activities">
                <h3>Activités recommandées</h3>
                ${getActivitiesList(destination.activities)}
            </div>
        </div>
        
        <div class="destination-map">
            <h2>Carte</h2>
            <div id="destination-map-container" class="map-container" data-lat="${destination.coordinates?.lat || 0}" data-lng="${destination.coordinates?.lng || 0}">
                <!-- La carte sera chargée ici -->
                <div class="map-placeholder">Carte non disponible</div>
            </div>
        </div>
        
        <div class="related-destinations">
            <h2>Destinations similaires</h2>
            <p>Chargement des destinations similaires...</p>
            <!-- Les destinations similaires seront chargées dynamiquement -->
        </div>
    `;

    // Insérer le HTML dans le conteneur
    container.innerHTML = detailsHtml;
    
    // Initialiser les boutons favoris
    initFavoriteButtons();
    
    // Charger les destinations similaires
    loadSimilarDestinations(destination.continent, destination.id);
    
    // Vérifier si cette destination est dans les favoris de l'utilisateur
    updateFavoriteButtonStatus(destination.id);
    
    // Initialiser la carte
    initMap();
}

/**
 * Charge les destinations similaires
 * @param {string} continent - Le continent de la destination actuelle
 * @param {number} currentId - L'ID de la destination actuelle à exclure
 */
function loadSimilarDestinations(continent, currentId) {
    // Appel à l'API pour récupérer les destinations du même continent
    fetch(`http://localhost:8000/destinations?continent=${encodeURIComponent(continent)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des destinations similaires');
            }
            return response.json();
        })
        .then(destinations => {
            // Filtrer pour exclure la destination actuelle et limiter à 3 destinations
            const similarDestinations = destinations
                .filter(dest => dest.id != currentId)
                .slice(0, 3);
            
            // Afficher les destinations similaires
            displaySimilarDestinations(similarDestinations);
        })
        .catch(error => {
            console.error('Erreur:', error);
            
            // Afficher un message d'erreur
            const relatedContainer = document.querySelector('.related-destinations');
            if (relatedContainer) {
                relatedContainer.innerHTML = '<h2>Destinations similaires</h2><p>Impossible de charger les destinations similaires.</p>';
            }
        });
}

/**
 * Affiche les destinations similaires
 * @param {Array} destinations - Liste des destinations similaires
 */
function displaySimilarDestinations(destinations) {
    const container = document.querySelector('.related-destinations');
    if (!container) return;
    
    if (destinations.length === 0) {
        container.innerHTML = '<h2>Destinations similaires</h2><p>Aucune destination similaire trouvée.</p>';
        return;
    }
    
    let html = '<h2>Destinations similaires</h2><div class="similar-destinations-grid">';
    
    destinations.forEach(destination => {
        // Utiliser la même fonction pour obtenir l'URL de l'image
        const imageUrl = getDestinationImageUrl(destination);
        
        html += `
            <div class="similar-destination-card">
                <div class="similar-destination-image">
                    <img src="${imageUrl}" alt="${destination.name}" onerror="this.src='static/images/destinations/placeholder.jpg'">
                </div>
                <div class="similar-destination-info">
                    <h3>${destination.name}, ${destination.country}</h3>
                    <div class="similar-destination-meta">
                        <span><i class="fas fa-star"></i> ${destination.rating}/5</span>
                    </div>
                    <a href="destination-detail.html?id=${destination.id}" class="btn-view-details">Voir plus</a>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Initialise les boutons favoris
 */
function initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        const destinationId = button.getAttribute('data-id');
        updateFavoriteButtonStatus(destinationId);
    });
}

/**
 * Met à jour le statut du bouton favori pour cette destination
 * @param {number} destinationId - ID de la destination
 */
function updateFavoriteButtonStatus(destinationId) {
    const favoriteButton = document.querySelector(`.favorite-btn[data-id="${destinationId}"]`);
    if (!favoriteButton) return;
    
    // Récupérer les favoris depuis localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // Vérifier si cette destination est dans les favoris
    if (favorites.includes(destinationId.toString())) {
        favoriteButton.innerHTML = '<i class="fas fa-heart"></i> Retirer des favoris';
        favoriteButton.classList.add('active');
    } else {
        favoriteButton.innerHTML = '<i class="far fa-heart"></i> Ajouter aux favoris';
        favoriteButton.classList.remove('active');
    }
    
    // Ajouter un gestionnaire d'événement pour le clic
    favoriteButton.addEventListener('click', function() {
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            alert('Veuillez vous connecter pour gérer vos favoris');
            return;
        }
        
        // Récupérer l'état actuel
        const isFavorite = this.classList.contains('active');
        
        // Inverser l'état
        if (isFavorite) {
            // Retirer des favoris
            this.innerHTML = '<i class="far fa-heart"></i> Ajouter aux favoris';
            this.classList.remove('active');
            toggleFavorite(destinationId, false);
        } else {
            // Ajouter aux favoris
            this.innerHTML = '<i class="fas fa-heart"></i> Retirer des favoris';
            this.classList.add('active');
            toggleFavorite(destinationId, true);
        }
    });
}

/**
 * Active/désactive un favori
 * @param {number|string} destinationId - ID de la destination
 * @param {boolean} addToFavorite - True pour ajouter, False pour retirer
 */
function toggleFavorite(destinationId, addToFavorite) {
    // Récupérer les favoris actuels
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (addToFavorite) {
        // Ajouter aux favoris s'il n'y est pas déjà
        if (!favorites.includes(destinationId.toString())) {
            favorites.push(destinationId.toString());
        }
    } else {
        // Retirer des favoris
        favorites = favorites.filter(id => id !== destinationId.toString());
    }
    
    // Enregistrer les favoris mis à jour
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Appeler l'API si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (token) {
        const method = addToFavorite ? 'POST' : 'DELETE';
        fetch(`http://localhost:8000/favorites/${destinationId}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors de la modification du favori`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Favori ${addToFavorite ? 'ajouté' : 'retiré'} avec succès`);
        })
        .catch(error => {
            console.error('Erreur API:', error);
        });
    }
}

/**
 * Obtient le texte correspondant à la catégorie de prix
 * @param {string} priceCategory - La catégorie de prix
 * @returns {string} - Texte formaté
 */
function getPriceCategoryText(priceCategory) {
    switch(priceCategory) {
        case 'budget':
            return 'Économique';
        case 'moderate':
            return 'Modéré';
        case 'luxury':
            return 'Luxe';
        default:
            return 'Non spécifié';
    }
}

/**
 * Génère le HTML pour les informations météo
 * @param {Object} weatherInfo - Infos météo par saison
 * @returns {string} - HTML généré
 */
function getWeatherInfo(weatherInfo) {
    if (!weatherInfo) {
        return '<p>Informations météorologiques non disponibles</p>';
    }
    
    return `
        <div class="weather-grid">
            <div class="weather-season">
                <h4><i class="fas fa-leaf"></i> Printemps</h4>
                <p>${weatherInfo.spring || 'Non disponible'}</p>
            </div>
            <div class="weather-season">
                <h4><i class="fas fa-sun"></i> Été</h4>
                <p>${weatherInfo.summer || 'Non disponible'}</p>
            </div>
            <div class="weather-season">
                <h4><i class="fas fa-tree"></i> Automne</h4>
                <p>${weatherInfo.autumn || 'Non disponible'}</p>
            </div>
            <div class="weather-season">
                <h4><i class="fas fa-snowflake"></i> Hiver</h4>
                <p>${weatherInfo.winter || 'Non disponible'}</p>
            </div>
        </div>
    `;
}

/**
 * Détermine la meilleure période pour visiter
 * @param {Object} weatherInfo - Infos météo par saison
 * @returns {string} - Période recommandée
 */
function getBestTimeToVisit(weatherInfo) {
    // Logique simplifiée, dans un cas réel on analyserait les données météo
    return 'Printemps et Automne';
}

/**
 * Génère la liste des activités
 * @param {Array} activities - Liste des activités
 * @returns {string} - HTML généré
 */
function getActivitiesList(activities) {
    if (!activities || activities.length === 0) {
        return '<p>Aucune activité recommandée disponible</p>';
    }
    
    return `
        <ul class="activities-list">
            ${activities.map(activity => `<li><i class="fas fa-check-circle"></i> ${activity}</li>`).join('')}
        </ul>
    `;
}

/**
 * Initialise la carte avec Leaflet si disponible
 */
function initMap() {
    const mapContainer = document.getElementById('destination-map-container');
    if (!mapContainer) return;
    
    const lat = parseFloat(mapContainer.getAttribute('data-lat'));
    const lng = parseFloat(mapContainer.getAttribute('data-lng'));
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Coordonnées invalides pour la carte');
        return;
    }
    
    // Vérifier si Leaflet est disponible
    if (typeof L !== 'undefined') {
        // Supprimer le placeholder
        mapContainer.innerHTML = '';
        
        // Créer la carte
        const map = L.map(mapContainer).setView([lat, lng], 10);
        
        // Ajouter le fond de carte
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Ajouter un marqueur
        L.marker([lat, lng]).addTo(map)
            .bindPopup(document.querySelector('.destination-header h1').textContent)
            .openPopup();
    } else {
        console.warn('Leaflet non disponible, la carte ne peut pas être affichée');
    }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    const contentContainer = document.getElementById('destination-content');
    if (contentContainer) {
        contentContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
    }
}
