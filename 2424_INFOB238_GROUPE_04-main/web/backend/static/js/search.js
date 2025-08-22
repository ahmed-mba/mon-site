// search.js - Fonctionnalités de recherche

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'interface utilisateur
    updateUserInterface();
    
    // Créer la bannière de recherche si elle n'existe pas
    createSearchBanner();
    
    // Initialiser les étoiles de notation
    initRatingStars();
    
    // Initialiser les boutons de recherche et réinitialisation
    initSearchButtons();
    
    // Initialiser les filtres étendus
    enhanceFilters();

    initeupdateUserInterface();
    
    // Vérifier s'il y a un paramètre de recherche dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        // Remplir la barre de recherche avec le terme
        const searchTerm = document.getElementById('search-term');
        if (searchTerm) {
            searchTerm.value = searchQuery;
        } else {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.id = 'search-term';
            searchInput.className = 'search-term';
            searchInput.value = searchQuery;
            searchInput.placeholder = 'Rechercher par nom, pays...';
            
            // Ajouter avant le premier filtre
            const firstFilterGroup = document.querySelector('.filter-group');
            if (firstFilterGroup) {
                const searchLabel = document.createElement('div');
                searchLabel.className = 'filter-group';
                searchLabel.innerHTML = '<h3>Terme de recherche</h3>';
                
                firstFilterGroup.parentNode.insertBefore(searchLabel, firstFilterGroup);
                firstFilterGroup.parentNode.insertBefore(searchInput, firstFilterGroup);
            }
        }
    }
    
    // Ajouter options de tri
    addSortOptions();
    
    // Charger les destinations (après avoir configuré les filtres)
    searchDestinations();
    
    // Initialiser la pagination
    initPagination();
    
    // Gérer l'affichage des filtres en mode mobile
    handleMobileFilters();
});

/**
 * Crée la bannière de recherche si elle n'existe pas
 */
function createSearchBanner() {
    // Vérifier si la bannière existe déjà
    if (document.querySelector('.search-banner')) return;
    
    // Créer la bannière
    const searchBanner = document.createElement('section');
    searchBanner.className = 'search-banner';
    
    searchBanner.innerHTML = `
        <div class="container">
            <h1>Explorez et découvrez</h1>
            <p>Trouvez votre prochaine destination de rêve</p>
            <div class="main-search-box">
                <input type="text" id="search-term" placeholder="Où souhaitez-vous aller ?">
                <button id="global-search-btn"><i class="fas fa-search"></i> Rechercher</button>
            </div>
        </div>
    `;
    
    // Insérer la bannière après le header
    const header = document.querySelector('header');
    if (header && header.nextElementSibling) {
        header.parentNode.insertBefore(searchBanner, header.nextElementSibling);
    }
    
    // Ajouter l'événement sur le bouton de recherche global
    const globalSearchBtn = document.getElementById('global-search-btn');
    if (globalSearchBtn) {
        globalSearchBtn.addEventListener('click', searchDestinations);
    }
    
    // Ajouter l'événement pour la touche Entrée
    const searchTermInput = document.getElementById('search-term');
    if (searchTermInput) {
        searchTermInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchDestinations();
            }
        });
    }
}

/**
 * Ajoute des options de tri aux résultats
 */
function addSortOptions() {
    const resultsHeader = document.querySelector('.results-header');
    if (!resultsHeader) return;
    
    // Vérifier si les options de tri existent déjà
    if (document.querySelector('.sort-options')) return;
    
    // Créer les options de tri
    const sortOptions = document.createElement('div');
    sortOptions.className = 'sort-options';
    sortOptions.innerHTML = `
        <label for="sort-select">Trier par :</label>
        <select id="sort-select">
            <option value="popularity">Popularité</option>
            <option value="rating-desc">Note (décroissante)</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
        </select>
    `;
    
    // Insérer après le header des résultats
    resultsHeader.parentNode.insertBefore(sortOptions, resultsHeader.nextSibling);
    
    // Ajouter l'événement de tri
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortResults(this.value);
        });
    }
}

/**
 * Améliore l'apparence et la fonctionnalité des filtres
 */
function enhanceFilters() {
    // Ajouter une classe pour styliser les filtres
    const filtersContainer = document.querySelector('.search-filters');
    if (!filtersContainer) return;
    
    // Ajouter un header aux filtres s'il n'existe pas
    if (!document.querySelector('.filters-header')) {
        const filtersHeader = document.createElement('div');
        filtersHeader.className = 'filters-header';
        filtersHeader.innerHTML = `
            <h2><i class="fas fa-filter"></i> Filtres</h2>
            <button id="mobile-filter-toggle" class="mobile-only"><i class="fas fa-sliders-h"></i> Filtrer</button>
        `;
        
        // Envelopper le contenu actuel dans un div
        const filtersBody = document.createElement('div');
        filtersBody.className = 'filters-body';
        
        // Déplacer tous les enfants dans le nouveau div
        while (filtersContainer.firstChild) {
            filtersBody.appendChild(filtersContainer.firstChild);
        }
        
        filtersContainer.appendChild(filtersHeader);
        filtersContainer.appendChild(filtersBody);
    }
    
    // Convertir les checkboxes en checkboxes personnalisées
    document.querySelectorAll('.filter-options label').forEach(label => {
        if (label.classList.contains('custom-checkbox')) return;
        
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        label.classList.add('custom-checkbox');
        
        // Obtenir le texte du label
        const labelText = label.textContent.trim();
        
        // Créer la nouvelle structure
        label.innerHTML = '';
        label.appendChild(checkbox);
        
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        label.appendChild(checkmark);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'label-text';
        textSpan.textContent = labelText;
        
        // Ajouter des icônes pour la catégorie de prix
        if (checkbox.value === 'budget') {
            textSpan.innerHTML = 'Économique <i class="fas fa-dollar-sign"></i>';
        } else if (checkbox.value === 'moderate') {
            textSpan.innerHTML = 'Modéré <i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i>';
        } else if (checkbox.value === 'luxury') {
            textSpan.innerHTML = 'Luxe <i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i><i class="fas fa-dollar-sign"></i>';
        }
        
        label.appendChild(textSpan);
    });
    
    // Améliorer l'affichage des étoiles
    const ratingFilter = document.querySelector('.rating-filter');
    if (ratingFilter && !document.querySelector('.rating-text')) {
        const ratingText = document.createElement('span');
        ratingText.className = 'rating-text';
        ratingText.textContent = '(Sélectionnez une note)';
        ratingFilter.querySelector('.stars-container').appendChild(ratingText);
    }
    
    // Améliorer les boutons d'action
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-button');
    
    if (searchButton && !searchButton.querySelector('i')) {
        searchButton.innerHTML = '<i class="fas fa-search"></i> Rechercher';
    }
    
    if (resetButton && !resetButton.querySelector('i')) {
        resetButton.innerHTML = '<i class="fas fa-undo"></i> Réinitialiser';
    }
    
    // Regrouper les boutons
    if (searchButton && resetButton && !document.querySelector('.filter-actions')) {
        const filterActions = document.createElement('div');
        filterActions.className = 'filter-actions';
        
        searchButton.parentNode.insertBefore(filterActions, searchButton);
        filterActions.appendChild(searchButton);
        filterActions.appendChild(resetButton);
    }
}

/**
 * Gère l'affichage des filtres en mode mobile
 */
function handleMobileFilters() {
    const filtersHeader = document.querySelector('.filters-header');
    const searchFilters = document.querySelector('.search-filters');
    
    if (filtersHeader && searchFilters) {
        filtersHeader.addEventListener('click', function(e) {
            // Ne pas déclencher si on clique sur un bouton dans le header
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            searchFilters.classList.toggle('active');
        });
    }
}

/**
 * Met à jour l'interface utilisateur en fonction du statut de connexion
 */
function initeupdateUserInterface() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    
    // Chercher le bouton d'authentification
    const authBtn = document.querySelector('.auth-btn');
    
    if (authBtn) {
        if (isLoggedIn && userName) {
            // L'utilisateur est connecté, mettre à jour le bouton
            authBtn.textContent = userName;
            authBtn.href = 'javascript:void(0);'; // Empêcher la navigation
            
            // Supprimer les écouteurs d'événements existants pour éviter les doublons
            const newAuthBtn = authBtn.cloneNode(true);
            authBtn.parentNode.replaceChild(newAuthBtn, authBtn);
            
            // Ajouter l'écouteur d'événement pour afficher le menu déroulant
            newAuthBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Empêcher le comportement par défaut
                e.stopPropagation(); // Arrêter la propagation de l'événement
                
                // Supprimer d'abord tout menu déroulant existant
                const existingDropdown = document.querySelector('.profile-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                    return; // Si on a supprimé un menu, on s'arrête (clic pour fermer)
                }
                
                // Créer le menu déroulant
                const dropdown = document.createElement('div');
                dropdown.className = 'profile-dropdown';
                
                // HTML du menu avec les icônes et les liens
                dropdown.innerHTML = `
                    <ul>
                        <li><a href="javascript:void(0);" class="profile-item"><i class="fas fa-user"></i> Mon profil</a></li>
                        <li><a href="favorites.html" class="favorites-item"><i class="fas fa-heart"></i> Mes favoris</a></li>
                        <li><a href="javascript:void(0);" class="logout-item"><i class="fas fa-sign-out-alt"></i> Déconnexion</a></li>
                    </ul>
                `;
                
                // Styles CSS pour le menu déroulant
                dropdown.style.position = 'fixed';
                dropdown.style.top = '60px'; // Ajuster selon votre design
                dropdown.style.right = '10px';
                dropdown.style.backgroundColor = 'white';
                dropdown.style.minWidth = '200px';
                dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                dropdown.style.borderRadius = '5px';
                dropdown.style.zIndex = '1000';
                dropdown.style.overflow = 'hidden';
                
                // Ajouter le menu au document
                document.body.appendChild(dropdown);
                
                // Appliquer des styles CSS aux éléments du menu
                const style = document.createElement('style');
                style.textContent = `
                    .profile-dropdown ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .profile-dropdown ul li {
                        padding: 0;
                    }
                    .profile-dropdown ul li a {
                        display: flex;
                        align-items: center;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        transition: background-color 0.2s;
                    }
                    .profile-dropdown ul li a:hover {
                        background-color: #f5f5f5;
                    }
                    .profile-dropdown ul li a i {
                        margin-right: 10px;
                        width: 20px;
                        text-align: center;
                    }
                    .profile-dropdown ul li:first-child a {
                        border-radius: 5px 5px 0 0;
                    }
                    .profile-dropdown ul li:last-child a {
                        border-radius: 0 0 5px 5px;
                    }
                    .profile-dropdown .logout-item i {
                        color: #4285f4;
                    }
                `;
                document.head.appendChild(style);
                
                // Positionner le menu correctement par rapport au bouton
                const rect = newAuthBtn.getBoundingClientRect();
                dropdown.style.top = rect.bottom + 'px';
                dropdown.style.right = (window.innerWidth - rect.right) + 'px';
                
                // Gérer les clics sur les éléments du menu
                const profileItem = dropdown.querySelector('.profile-item');
                if (profileItem) {
                    profileItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        alert('Fonctionnalité de profil à implémenter');
                        dropdown.remove();
                    });
                }
                
                const logoutItem = dropdown.querySelector('.logout-item');
                if (logoutItem) {
                    logoutItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Sauvegarder la position actuelle de défilement
                        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                        
                        // Supprimer les informations de connexion
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userName');
                        localStorage.removeItem('token');
                        
                        // Stocker temporairement la position de défilement
                        sessionStorage.setItem('scrollPosition', scrollPosition);
                        
                        // Recharger la page
                        window.location.reload();
                    });
                }
                
                // Fermer le menu lorsqu'on clique ailleurs
                document.addEventListener('click', function closeMenu(e) {
                    if (!dropdown.contains(e.target) && e.target !== newAuthBtn) {
                        dropdown.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            });
        } else {
            // L'utilisateur n'est pas connecté
            authBtn.textContent = 'Connexion';
            authBtn.href = 'auth.html';
        }
    }
    
    // Restaurer la position de défilement après le rechargement de la page
    if (sessionStorage.getItem('scrollPosition')) {
        const savedPosition = parseInt(sessionStorage.getItem('scrollPosition'));
        window.scrollTo(0, savedPosition);
        sessionStorage.removeItem('scrollPosition'); // Nettoyer après utilisation
    }
}


/**
 * Initialise les étoiles de notation
 */
function initRatingStars() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('min-rating');
    const ratingText = document.querySelector('.rating-text');
    
    if (!stars.length || !ratingInput) return;
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            ratingInput.value = value;
            
            // Mettre à jour l'affichage des étoiles
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                if (starValue <= value) {
                    s.innerHTML = '<i class="fas fa-star"></i>';
                    s.classList.add('active');
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                    s.classList.remove('active');
                }
            });
            
            // Mettre à jour le texte
            if (ratingText) {
                ratingText.textContent = `${value} étoile${value > 1 ? 's' : ''} ou plus`;
            }
        });
        
        // Effet de survol
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                if (starValue <= value) {
                    s.innerHTML = '<i class="fas fa-star"></i>';
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            const selectedValue = parseInt(ratingInput.value);
            
            stars.forEach(s => {
                const starValue = parseInt(s.getAttribute('data-value'));
                if (starValue <= selectedValue) {
                    s.innerHTML = '<i class="fas fa-star"></i>';
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                }
            });
        });
    });
}

/**
 * Initialise les boutons de recherche et réinitialisation
 */
function initSearchButtons() {
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-button');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            searchDestinations();
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Réinitialiser les filtres
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Réinitialiser la notation
            const ratingInput = document.getElementById('min-rating');
            const ratingText = document.querySelector('.rating-text');
            
            if (ratingInput) {
                ratingInput.value = 0;
                
                // Réinitialiser l'affichage des étoiles
                document.querySelectorAll('.star').forEach(star => {
                    star.innerHTML = '<i class="far fa-star"></i>';
                    star.classList.remove('active');
                });
                
                // Réinitialiser le texte
                if (ratingText) {
                    ratingText.textContent = '(Sélectionnez une note)';
                }
            }
            
            // Réinitialiser le terme de recherche si présent
            const searchTerm = document.getElementById('search-term');
            if (searchTerm) {
                searchTerm.value = '';
            }
            
            // Réinitialiser le tri
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.value = 'popularity';
            }
            
            // Relancer la recherche
            searchDestinations();
        });
    }
}

/**
 * Recherche des destinations selon les filtres
 */
function searchDestinations() {
    const resultsGrid = document.getElementById('search-results-grid');
    const resultsCount = document.querySelector('.results-count');
    
    if (!resultsGrid) return;
    
    // Afficher un indicateur de chargement amélioré
    resultsGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-pulse fa-2x"></i>
            <p>Recherche des meilleures destinations...</p>
        </div>
    `;
    
    // Récupérer les valeurs des filtres
    const selectedContinents = Array.from(document.querySelectorAll('input[name="continent"]:checked')).map(item => item.value);
    const selectedPriceCategories = Array.from(document.querySelectorAll('input[name="price_category"]:checked')).map(item => item.value);
    const minRating = document.getElementById('min-rating') ? parseInt(document.getElementById('min-rating').value) || 0 : 0;
    const searchTerm = document.getElementById('search-term') ? document.getElementById('search-term').value.trim() : '';
    
    // Construire l'URL de l'API avec les paramètres de recherche
    let apiUrl = 'http://localhost:8000/destinations?';
    
    if (selectedContinents.length > 0) {
        apiUrl += selectedContinents.map(c => `continent=${encodeURIComponent(c)}`).join('&') + '&';
    }
    
    if (selectedPriceCategories.length > 0) {
        apiUrl += selectedPriceCategories.map(p => `price_category=${encodeURIComponent(p)}`).join('&') + '&';
    }
    
    if (minRating > 0) {
        apiUrl += `min_rating=${minRating}&`;
    }
    
    if (searchTerm) {
        apiUrl += `search=${encodeURIComponent(searchTerm)}&`;
    }
    
    // Enlever le dernier '&' ou '?' si présent
    apiUrl = apiUrl.replace(/[?&]$/, '');
    
    // Appel à l'API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(destinations => {
            // Mettre à jour le compteur de résultats
            if (resultsCount) {
                resultsCount.textContent = `${destinations.length} destination(s) trouvée(s)`;
            }
            
            // Vider le conteneur
            resultsGrid.innerHTML = '';
            
            // Si aucune destination n'est trouvée
            if (destinations.length === 0) {
                resultsGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search fa-3x" style="color:#ddd;margin-bottom:15px;"></i>
                        <h3>Aucune destination trouvée</h3>
                        <p>Essayez de modifier vos critères de recherche</p>
                        <button class="suggestion-btn" onclick="resetFilters()">Voir toutes les destinations</button>
                    </div>
                `;
                return;
            }
            
            // Tri initial des destinations selon la popularité (par défaut)
            const sortSelect = document.getElementById('sort-select');
            const sortCriterion = sortSelect ? sortSelect.value : 'popularity';
            destinations = sortDestinations(destinations, sortCriterion);
            
            // Créer une carte pour chaque destination avec effet d'animation
            destinations.forEach((destination, index) => {
                const destinationCard = createDestinationCard(destination, index);
                resultsGrid.appendChild(destinationCard);
            });
            
            // Initialiser la pagination si nécessaire
            if (destinations.length > 9) {
                updatePagination(destinations.length);
            } else {
                const paginationContainer = document.getElementById('search-pagination');
                if (paginationContainer) {
                    paginationContainer.innerHTML = '';
                }
            }
            
            // Initialiser les boutons favoris après le chargement
            initFavoriteButtons();
        })
        .catch(error => {
            console.error('Erreur lors de la recherche:', error);
            resultsGrid.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Une erreur est survenue lors de la recherche. Veuillez réessayer plus tard.</p>
                </div>
            `;
        });
}

/**
 * Crée une carte de destination avec animation
 * @param {Object} destination - Données de la destination
 * @param {number} index - Index pour l'animation séquentielle
 * @returns {HTMLElement} - Élément de carte créé
 */
function createDestinationCard(destination, index) {
    // Vérifier si la destination est dans les favoris
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorite = favorites.includes(destination.id.toString());
    
    // Déterminer le chemin de l'image en fonction du nom de la destination
    let imageUrl;
    // Toujours utiliser les images locales basées sur le nom
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
        imageUrl = 'static/images/destinations/rio.jpg';
    } else if (destination.name === 'Sydney') {
        imageUrl = 'static/images/destinations/sydney.jpg';
    } else {
        imageUrl = 'static/images/destinations/placeholder.jpg';
    }
    
    // Créer l'élément de carte
    const card = document.createElement('div');
    card.className = 'destination-card';
    card.style.setProperty('--animation-order', index);
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Construire le HTML de la carte
    card.innerHTML = `
        <div class="destination-image">
            <img src="${imageUrl}" alt="${destination.name}, ${destination.country}">
            <div class="destination-overlay">
                <button class="favorite-btn" data-id="${destination.id}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="destination-info">
            <h3>${destination.name}, ${destination.country}</h3>
            <div class="destination-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${destination.continent}</span>
                <span><i class="fas fa-star"></i> ${destination.rating}/5</span>
            </div>
            <p>${destination.description && destination.description.length > 100 ? 
                destination.description.substring(0, 100) + '...' : 
                destination.description || 'Aucune description disponible'}</p>
            <a href="destination-detail.html?id=${destination.id}" class="btn-details">Voir plus</a>
        </div>
    `;
    
    return card;
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
            
            // Vérifier si l'utilisateur est connecté
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                alert('Veuillez vous connecter pour ajouter des favoris');
                return;
            }
            
            const destinationId = this.getAttribute('data-id');
            const icon = this.querySelector('i');
            const isFavorite = icon.classList.contains('fas');
            
            // Inverser l'état
            if (isFavorite) {
                icon.className = 'far fa-heart';
                toggleFavorite(destinationId, false);
            } else {
                icon.className = 'fas fa-heart';
                toggleFavorite(destinationId, true);
            }
            
            // Animation
            this.classList.add('favorite-animation');
            setTimeout(() => {
                this.classList.remove('favorite-animation');
            }, 300);
        });
    });
}

/**
 * Active/désactive un favori
 * @param {string} destinationId - ID de la destination
 * @param {boolean} add - True pour ajouter, False pour retirer
 */
function toggleFavorite(destinationId, add) {
    // Récupérer les favoris actuels
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (add) {
        // Ajouter aux favoris s'il n'y est pas déjà
        if (!favorites.includes(destinationId)) {
            favorites.push(destinationId);
        }
    } else {
        // Retirer des favoris
        favorites = favorites.filter(id => id !== destinationId);
    }
    
    // Enregistrer les favoris mis à jour
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Si l'utilisateur est connecté, synchroniser avec l'API
    const token = localStorage.getItem('token');
    if (token) {
        const method = add ? 'POST' : 'DELETE';
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
            console.log(`Favori ${add ? 'ajouté' : 'retiré'} avec succès`);
        })
        .catch(error => {
            console.error('Erreur API:', error);
        });
    }
}

/**
 * Initialise la pagination des résultats
 */
function initPagination() {
    // Vérifier si le conteneur de pagination existe
    let paginationContainer = document.getElementById('search-pagination');
    
    // Créer le conteneur s'il n'existe pas
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'search-pagination';
        paginationContainer.className = 'pagination';
        
        // Ajouter après la grille de résultats
        const resultsGrid = document.getElementById('search-results-grid');
        if (resultsGrid && resultsGrid.parentNode) {
            resultsGrid.parentNode.insertBefore(paginationContainer, resultsGrid.nextSibling);
        }
    }
}

/**
 * Met à jour la pagination en fonction du nombre de résultats
 * @param {number} totalItems - Nombre total d'éléments
 * @param {number} itemsPerPage - Nombre d'éléments par page
 */
function updatePagination(totalItems, itemsPerPage = 9) {
    const paginationContainer = document.getElementById('search-pagination');
    if (!paginationContainer) return;
    
    // Calculer le nombre de pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Bouton précédent
    paginationHTML += `<button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    
    // Limiter le nombre de boutons visibles
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Première page
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }
    
    // Pages intermédiaires
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // Dernière page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
        
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Bouton suivant
    paginationHTML += `<button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Ajouter les écouteurs d'événements
    paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('prev')) {
                changePage(currentPage - 1);
            } else if (this.classList.contains('next')) {
                changePage(currentPage + 1);
            } else {
                const page = parseInt(this.getAttribute('data-page'));
                changePage(page);
            }
        });
    });
}

/**
 * Change la page courante et recharge les résultats
 * @param {number} page - Numéro de page
 */
function changePage(page) {
    currentPage = page;
    
    // Rechargement partiel des résultats (à implémenter selon votre API)
    // Pour l'instant, juste un scroll vers le haut et animation
    
    const resultsGrid = document.getElementById('search-results-grid');
    if (resultsGrid) {
        resultsGrid.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Mise à jour visuelle de la pagination
    updatePagination();
}

// Variable pour stocker la page courante
let currentPage = 1;

/**
 * Trie les résultats selon un critère
 * @param {string} criterion - Le critère de tri
 */
function sortResults(criterion) {
    // Récupérer les cartes actuelles
    const cards = Array.from(document.querySelectorAll('.destination-card'));
    const resultsGrid = document.getElementById('search-results-grid');
    
    if (!resultsGrid || cards.length === 0) return;
    
    // Tri des cartes
    cards.sort((a, b) => {
        const nameA = a.querySelector('h3').textContent;
        const nameB = b.querySelector('h3').textContent;
        
        const ratingTextA = a.querySelector('.destination-meta span:nth-child(2)').textContent;
        const ratingTextB = b.querySelector('.destination-meta span:nth-child(2)').textContent;
        
        const ratingA = parseFloat(ratingTextA.match(/\d+\.\d+/)[0]);
        const ratingB = parseFloat(ratingTextB.match(/\d+\.\d+/)[0]);
        
        switch (criterion) {
            case 'popularity':
                // Par défaut, populaire = note élevée
                return ratingB - ratingA;
            case 'rating-desc':
                return ratingB - ratingA;
            case 'name-asc':
                return nameA.localeCompare(nameB);
            case 'name-desc':
                return nameB.localeCompare(nameA);
            default:
                return 0;
        }
    });
    
    // Appliquer une petite animation de fondu
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
    });
    
    // Attendre un court délai avant de réorganiser et animer
    setTimeout(() => {
        // Vider et reconstruire la grille
        resultsGrid.innerHTML = '';
        
        // Ajouter les cartes triées avec animation séquentielle
        cards.forEach((card, index) => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.transitionDelay = `${index * 0.05}s`;
            
            resultsGrid.appendChild(card);
        });
    }, 100);
}

/**
 * Trie un tableau de destinations selon un critère
 * @param {Array} destinations - Tableau des destinations
 * @param {string} criterion - Critère de tri
 * @returns {Array} - Tableau trié
 */
function sortDestinations(destinations, criterion) {
    // Copier le tableau pour ne pas modifier l'original
    const sortedDestinations = [...destinations];
    
    // Appliquer le tri
    sortedDestinations.sort((a, b) => {
        switch (criterion) {
            case 'popularity':
                // Par défaut, populaire = note élevée
                return b.rating - a.rating;
            case 'rating-desc':
                return b.rating - a.rating;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });
    
    return sortedDestinations;
}

/**
 * Réinitialise tous les filtres et lance une nouvelle recherche
 * (Fonction appelée depuis le bouton dans le message "aucun résultat")
 */
function resetFilters() {
    // Réinitialiser les checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Réinitialiser la notation
    const ratingInput = document.getElementById('min-rating');
    const ratingText = document.querySelector('.rating-text');
    
    if (ratingInput) {
        ratingInput.value = 0;
        
        // Réinitialiser l'affichage des étoiles
        document.querySelectorAll('.star').forEach(star => {
            star.innerHTML = '<i class="far fa-star"></i>';
            star.classList.remove('active');
        });
        
        // Réinitialiser le texte
        if (ratingText) {
            ratingText.textContent = '(Sélectionnez une note)';
        }
    }
    
    // Réinitialiser le terme de recherche si présent
    const searchTerm = document.getElementById('search-term');
    if (searchTerm) {
        searchTerm.value = '';
    }
    
    // Réinitialiser le tri
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'popularity';
    }
    
    // Relancer la recherche
    searchDestinations();
}

/**
 * Ajoute une animation d'apparition aux cartes
 */
function animateCards() {
    const cards = document.querySelectorAll('.destination-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.transitionDelay = `${index * 0.1}s`;
        
        // Forcer un reflow
        void card.offsetWidth;
        
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });
}

// Ajouter une classe CSS pour les animations
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .destination-card {
            animation: fadeInUp 0.6s ease both;
            animation-delay: calc(var(--animation-order, 0) * 0.1s);
        }
    `;
    document.head.appendChild(style);
});
// Ajouter un gestionnaire d'erreur pour les images
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter un événement global pour détecter les erreurs d'images
    document.addEventListener('error', function(e) {
        const target = e.target;
        if (target.tagName === 'IMG') {
            console.log('Erreur de chargement d\'image:', target.src);
            target.src = 'static/images/destinations/placeholder.jpg';
        }
    }, true);
});