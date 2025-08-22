// static/js/package-detail.js

/**
 * Script pour la gestion de la page de détail des packages
 * Permet de charger les informations d'un package spécifique et 
 * d'afficher des packages similaires
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'interface utilisateur
    updateUserInterface();
    
    // Récupérer l'ID du package depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('id');
    
    if (!packageId) {
        // Rediriger vers la page des packages si aucun ID n'est spécifié
        showError("ID de package manquant dans l'URL");
        setTimeout(() => {
            window.location.href = 'packages.html';
        }, 2000);
        return;
    }
    
    // Charger les détails du package
    loadPackageDetails(packageId);
    
    // Charger les packages similaires
    loadSimilarPackages(packageId);

    initializeDestinationPage()
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
            authBtn.href = 'profile.html'; // Lien vers la page de profil
        } else {
            authBtn.textContent = 'Connexion';
            authBtn.href = 'auth.html';
        }
    }
    
    // Mettre à jour les autres éléments d'interface selon le statut de connexion
    const userMenuElements = document.querySelectorAll('.user-menu-item');
    if (userMenuElements.length > 0) {
        userMenuElements.forEach(element => {
            element.style.display = isLoggedIn ? 'block' : 'none';
        });
    }
}

/**
 * Charge les détails d'un package spécifique
 * @param {string} packageId - ID du package à charger
 */
function loadPackageDetails(packageId) {
    const packageContent = document.getElementById('package-content');
    
    if (!packageContent) return;
    
    // Afficher un indicateur de chargement
    packageContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement du package...</div>';
    
    // Définir un timeout pour gérer les erreurs de connexion réseau
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Délai d\'attente dépassé (10s)')), 10000);
    });
    
    // Log pour le débogage
    console.log("Tentative de chargement du package ID:", packageId);
    
    // Appel à l'API avec gestion du timeout
    Promise.race([
        fetch(`http://localhost:8000/packages/${packageId}`),
        timeoutPromise
    ])
    .then(response => {
        // Log pour le débogage
        console.log("Réponse de l'API:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(packageData => {
        // Log pour le débogage
        console.log("Données du package reçues:", packageData);
        
        // Vérifier si les données sont valides
        if (!packageData || typeof packageData !== 'object') {
            throw new Error('Format de données invalide');
        }
        
        // Mettre à jour le titre de la page
        document.title = `${packageData.name || 'Package'} - GO`;
        
        // Créer le contenu HTML pour le package
        const html = `
            <div class="package-header">
                <div class="package-image-large">
                    <img src="${getPackageImageUrl(packageData)}" 
                         alt="${packageData.name || 'Package voyage'}" 
                         onerror="this.src='static/images/destinations/Unknown.jpg'"
                         class="package-main-image">
                </div>
                <div class="package-details">
                    <h1>${packageData.name || 'Package sans nom'}</h1>
                    <div class="package-meta-large">
                        <span><i class="fas fa-calendar-alt"></i> ${packageData.duration || 'N/A'} jours</span>
                        <span><i class="fas fa-user-friends"></i> ${packageData.group_size || 'N/A'} personnes max.</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${packageData.destinations ? packageData.destinations.length : 0} destinations</span>
                    </div>
                    <div class="package-price">
                        <span class="price-label">Prix par personne</span>
                        <span class="price-value">${formatPrice(packageData.price)} €</span>
                        ${packageData.old_price ? `<span class="old-price">${formatPrice(packageData.old_price)} €</span>` : ''}
                    </div>
                    <button class="btn-book" id="book-now-btn">Réserver maintenant</button>
                    <div class="share-buttons">
                        <button class="btn-share" id="btn-share-facebook"><i class="fab fa-facebook-f"></i></button>
                        <button class="btn-share" id="btn-share-twitter"><i class="fab fa-twitter"></i></button>
                        <button class="btn-share" id="btn-share-whatsapp"><i class="fab fa-whatsapp"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="package-tabs">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="description">Description</button>
                    <button class="tab-btn" data-tab="itinerary">Itinéraire</button>
                    <button class="tab-btn" data-tab="included">Ce qui est inclus</button>
                    <button class="tab-btn" data-tab="reviews">Avis</button>
                </div>
                
                <div class="tabs-content">
                    <div class="tab-content active" id="description">
                        <h2>À propos de ce voyage</h2>
                        <p>${packageData.description || 'Aucune description disponible pour ce voyage.'}</p>
                        ${packageData.highlights ? `
                            <div class="highlights-section">
                                <h3>Les points forts</h3>
                                <ul class="highlights-list">
                                    ${packageData.highlights.map(highlight => `<li><i class="fas fa-star"></i> ${highlight}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="tab-content" id="itinerary">
                        <h2>Itinéraire du voyage</h2>
                        <div class="itinerary-timeline">
                            ${generateItinerary(packageData.itinerary)}
                        </div>
                    </div>
                    
                    <div class="tab-content" id="included">
                        <h2>Ce qui est inclus dans le prix</h2>
                        <div class="included-grid">
                            <div class="included-section">
                                <h3><i class="fas fa-check"></i> Inclus</h3>
                                <ul>
                                    ${packageData.included ? packageData.included.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('') : '<li>Information non disponible</li>'}
                                </ul>
                            </div>
                            <div class="included-section">
                                <h3><i class="fas fa-times"></i> Non inclus</h3>
                                <ul>
                                    ${packageData.not_included ? packageData.not_included.map(item => `<li><i class="fas fa-times-circle"></i> ${item}</li>`).join('') : '<li>Information non disponible</li>'}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="reviews">
                        <h2>Avis des voyageurs</h2>
                        <div class="reviews-container">
                            ${generateReviews(packageData.reviews)}
                        </div>
                        <button class="btn-primary" id="write-review-btn">Laisser un avis</button>
                    </div>
                </div>
            </div>
            
            <div class="package-destinations">
                <h2>Destinations incluses</h2>
                <div class="destinations-small-grid">
                    ${generateDestinationsGrid(packageData.destinations)}
                </div>
            </div>
            
        `;
        
        // Mettre à jour le contenu
        packageContent.innerHTML = html;
        
        // Initialiser les onglets
        initTabs();
        
        // Initialiser le bouton de réservation
        initBookingButton(packageData);
        
        // Initialiser les boutons de partage
        initShareButtons(packageData);
        
        // Initialiser le bouton d'avis
        initReviewButton(packageData);
        
        // Charger les packages similaires
        loadSimilarPackages(packageId);
    })
    .catch(error => {
        // Log détaillé de l'erreur pour le débogage
        console.error("Erreur lors du chargement du package:", error);
        
        // Afficher un message d'erreur approprié en fonction du type d'erreur
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError("Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.");
        } else if (error.message.includes('Délai d\'attente dépassé')) {
            showError("Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.");
        } else if (error.message.includes('404')) {
            showError("Ce package n'existe pas ou a été supprimé.");
        } else {
            showError(`Impossible de charger les détails de ce package: ${error.message}`);
        }
    });
}

/**
 * Formate un prix avec deux décimales
 * @param {number} price - Le prix à formater
 * @returns {string} - Le prix formaté
 */
function formatPrice(price) {
    if (typeof price !== 'number') return 'N/A';
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Affiche un message d'erreur dans le conteneur spécifié
 * @param {string} message - Le message d'erreur à afficher
 */
function showError(message) {
    const packageContent = document.getElementById('package-content');
    if (packageContent) {
        packageContent.innerHTML = `
            <div class="error-message">
                <h2><i class="fas fa-exclamation-triangle"></i> Erreur</h2>
                <p>${message}</p>
                <a href="packages.html" class="btn-primary">Voir tous les packages</a>
            </div>
        `;
    }
}

/**
 * Initialise le bouton de réservation
 * @param {Object} packageData - Les données du package
 */
function initBookingButton(packageData) {
    const bookButton = document.getElementById('book-now-btn');
    if (!bookButton) return;
    
    bookButton.addEventListener('click', function() {
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            // Stocker la page actuelle pour rediriger après la connexion
            localStorage.setItem('redirectAfterLogin', window.location.href);
            
            // Afficher une alerte et rediriger vers la page de connexion
            alert('Veuillez vous connecter pour réserver ce voyage');
            window.location.href = 'auth.html';
            return;
        }
        
        // Simuler une réservation (dans une application réelle, cela ouvrirait un formulaire de réservation)
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        this.disabled = true;
        
        setTimeout(() => {
            // En cas de réussite, naviguer vers la page de checkout
            sessionStorage.setItem('bookingPackage', JSON.stringify(packageData));
            window.location.href = `checkout.html?package=${packageData.id}`;
        }, 1500);
    });
}

/**
 * Initialise les boutons de partage
 * @param {Object} packageData - Les données du package
 */
function initShareButtons(packageData) {
    const shareUrl = window.location.href;
    const shareText = `Découvrez ce superbe voyage : ${packageData.name} sur GO !`;
    
    const fbBtn = document.getElementById('btn-share-facebook');
    if (fbBtn) {
        fbBtn.addEventListener('click', function() {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 
                        'facebook-share', 'width=580,height=296');
        });
    }
    
    const twitterBtn = document.getElementById('btn-share-twitter');
    if (twitterBtn) {
        twitterBtn.addEventListener('click', function() {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, 
                        'twitter-share', 'width=550,height=235');
        });
    }
    
    const whatsappBtn = document.getElementById('btn-share-whatsapp');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', function() {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, 
                        'whatsapp-share', 'width=580,height=296');
        });
    }
}

/**
 * Initialise le bouton pour laisser un avis
 * @param {Object} packageData - Les données du package
 */
function initReviewButton(packageData) {
    const reviewBtn = document.getElementById('write-review-btn');
    if (!reviewBtn) return;
    
    reviewBtn.addEventListener('click', function() {
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            // Stocker la page actuelle pour rediriger après la connexion
            localStorage.setItem('redirectAfterLogin', window.location.href);
            
            // Afficher une alerte et rediriger vers la page de connexion
            alert('Veuillez vous connecter pour laisser un avis');
            window.location.href = 'auth.html';
            return;
        }
        
        // Créer un modal pour laisser un avis
        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-modal-content">
                <span class="close-modal">&times;</span>
                <h2>Laisser un avis pour "${packageData.name}"</h2>
                <form id="review-form">
                    <div class="rating-select">
                        <span>Votre note :</span>
                        <div class="stars">
                            <i class="far fa-star" data-rating="1"></i>
                            <i class="far fa-star" data-rating="2"></i>
                            <i class="far fa-star" data-rating="3"></i>
                            <i class="far fa-star" data-rating="4"></i>
                            <i class="far fa-star" data-rating="5"></i>
                        </div>
                        <input type="hidden" name="rating" id="rating-value" value="0">
                    </div>
                    <div class="form-group">
                        <label for="review-title">Titre</label>
                        <input type="text" id="review-title" name="title" placeholder="Un titre pour votre avis" required>
                    </div>
                    <div class="form-group">
                        <label for="review-text">Votre avis</label>
                        <textarea id="review-text" name="text" rows="5" placeholder="Partagez votre expérience..." required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Soumettre</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer la fermeture du modal
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Gérer le clic en dehors du modal pour le fermer
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Gérer la sélection des étoiles pour la note
        const stars = modal.querySelectorAll('.stars i');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-rating');
                document.getElementById('rating-value').value = rating;
                
                // Mettre à jour l'affichage des étoiles
                stars.forEach(s => {
                    const sRating = s.getAttribute('data-rating');
                    if (sRating <= rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
        });
        
        // Gérer la soumission du formulaire
        const reviewForm = document.getElementById('review-form');
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const rating = document.getElementById('rating-value').value;
            const title = document.getElementById('review-title').value;
            const text = document.getElementById('review-text').value;
            
            // Vérifier si la note a été donnée
            if (rating === '0') {
                alert('Veuillez attribuer une note à votre avis');
                return;
            }
            
            // Simuler l'envoi de l'avis (dans une application réelle, cela serait envoyé à une API)
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                // Simuler une réponse réussie
                document.body.removeChild(modal);
                
                // Mettre à jour les avis affichés avec le nouvel avis
                const reviewsContainer = document.querySelector('.reviews-container');
                if (reviewsContainer) {
                    const username = localStorage.getItem('userName') || 'Utilisateur';
                    const today = new Date();
                    const dateString = today.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    const newReview = document.createElement('div');
                    newReview.className = 'review-item new-review';
                    newReview.innerHTML = `
                        <div class="review-header">
                            <div class="review-user">
                                <div class="user-avatar">${username.charAt(0)}</div>
                                <div class="user-info">
                                    <div class="user-name">${username}</div>
                                    <div class="review-date">${dateString}</div>
                                </div>
                            </div>
                            <div class="review-rating">
                                ${Array(5).fill().map((_, i) => `
                                    <i class="${i < rating ? 'fas' : 'far'} fa-star"></i>
                                `).join('')}
                            </div>
                        </div>
                        <div class="review-content">
                            <h4>${title}</h4>
                            <p>${text}</p>
                        </div>
                    `;
                    
                    // Ajouter le nouvel avis en haut de la liste
                    reviewsContainer.prepend(newReview);
                    
                    // Animer l'apparition du nouvel avis
                    setTimeout(() => {
                        newReview.classList.add('visible');
                    }, 10);
                    
                    alert('Merci pour votre avis !');
                }
            }, 1500);
        });
    });
}

/**
 * Génère le HTML pour les avis sur le package
 * @param {Array} reviews - Les avis sur le package
 * @returns {string} Le HTML généré
 */
function generateReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p class="no-data">Aucun avis disponible pour ce voyage. Soyez le premier à partager votre expérience !</p>';
    }
    
    return reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-user">
                    <div class="user-avatar">${review.user.charAt(0)}</div>
                    <div class="user-info">
                        <div class="user-name">${review.user}</div>
                        <div class="review-date">${new Date(review.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</div>
                    </div>
                </div>
                <div class="review-rating">
                    ${Array(5).fill().map((_, i) => `
                        <i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>
                    `).join('')}
                </div>
            </div>
            <div class="review-content">
                <h4>${review.title || 'Sans titre'}</h4>
                <p>${review.text}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Génère le HTML pour l'itinéraire du voyage
 * @param {Array} itinerary - Les données de l'itinéraire
 * @returns {string} Le HTML généré
 */
function generateItinerary(itinerary) {
    if (!itinerary || itinerary.length === 0) {
        return '<p class="no-data">Aucun itinéraire disponible pour ce voyage.</p>';
    }
    
    return itinerary.map((day, index) => `
        <div class="itinerary-day">
            <div class="day-number">Jour ${index + 1}</div>
            <div class="day-content">
                <h3>${day.title || `Jour ${index + 1}`}</h3>
                <p>${day.description || 'Description non disponible'}</p>
                ${day.activities && day.activities.length > 0 ? `
                    <div class="day-activities">
                        <h4>Activités :</h4>
                        <ul>
                            ${day.activities.map(activity => `<li><i class="fas fa-check-circle"></i> ${activity}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${day.accommodation ? `
                    <div class="day-accommodation">
                        <h4>Hébergement :</h4>
                        <p><i class="fas fa-hotel"></i> ${day.accommodation}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Récupère l'URL de l'image d'un package
 * @param {Object} packageData - Les données du package
 * @returns {string} L'URL de l'image
 */
function getPackageImageUrl(packageData) {
    // Définir des images spécifiques pour chaque package nommé
    if (packageData.name === 'Tour d\'Europe') {
        // Pour Tour d'Europe, utiliser une image de l'Europe
        return 'static/images/destinations/8502577156ad9ca457e092c791c5117f.jpg';
    } else if (packageData.name.includes('Asie')) {
        // Pour Découverte de l'Asie, utiliser l'image de Tokyo
        return 'static/images/destinations/tokyo.jpg';
    } else if (packageData.name.includes('York') || packageData.name.includes('États-Unis')) {
        return 'static/images/destinations/new-y.jpg';
    } else if (packageData.name.includes('Bali')) {
        return 'static/images/destinations/bali.jpg';
    } else if (packageData.name.includes('Caire')) {
        return 'static/images/destinations/le Caire.jpg'; 
    } else if (packageData.name.includes('Rio')) {
        return 'static/images/destinations/Rio.jpg';
    } else if (packageData.name.includes('Sydney')) {
        return 'static/images/destinations/sydney.jpg';
    }
    
    // Image par défaut si aucune correspondance
    return 'static/images/destinations/Unknown.jpg.jpg';
}

/**
 * Obtient l'URL de l'image pour une destination spécifique
 * @param {Object} destination - L'objet destination
 * @returns {string} L'URL de l'image
 */
function getDestinationImageUrl(destination) {
    // Définir des images par défaut pour chaque destination connue
    if (destination.name === 'Paris') {
        return 'static/images/destinations/8502577156ad9ca457e092c791c5117f.jpg';
    } else if (destination.name === 'Rome') {
        return 'static/images/destinations/rome.jpg';
    } else if (destination.name === 'Barcelone') {
        return 'static/images/destinations/barcelone.jpg';
    } else if (destination.name === 'Londres') {
        return 'static/images/destinations/londres.jpg';
    } else if (destination.name === 'Bali') {
        return 'static/images/destinations/bali.jpg';
    } else if (destination.name === 'New York') {
        return 'static/images/destinations/new-y.jpg';
    } else if (destination.name === 'Tokyo') {
        return 'static/images/destinations/tokyo.jpg';
    } else if (destination.name === 'Le Caire') {
        return 'static/images/destinations/le Caire.jpg';
    } else if (destination.name === 'Rio de Janeiro') {
        return 'static/images/destinations/Rio.jpg';
    } else if (destination.name === 'Sydney') {
        return 'static/images/destinations/sydney.jpg';
    }
    
    // Utiliser l'URL de l'image si disponible, sinon une image par défaut
    return destination.image_url || 'static/images/destinations/placeholder.jpg';
}

/**
 * Génère le HTML pour la grille des destinations incluses
 * @param {Array} destinations - Les destinations incluses dans le package
 * @returns {string} Le HTML généré
 */
function generateDestinationsGrid(destinations) {
    if (!destinations || destinations.length === 0) {
        return '<p class="no-data">Aucune destination spécifique n\'est incluse dans ce package.</p>';
    }
    
    return destinations.map(destination => `
        <div class="destination-small-card">
            <div class="destination-small-image">
                <img src="${getDestinationImageUrl(destination)}" 
                     alt="${destination.name}"
                     onerror="this.src='static/images/destinations/Unknown.jpg'">
            </div>
            <div class="destination-small-info">
                <h3>${destination.name}${destination.country ? `, ${destination.country}` : ''}</h3>
                <a href="destination-detail.html?id=${destination.id}" class="btn-small">Voir détails</a>
            </div>
        </div>
    `).join('');
}

/**
 * Initialise les onglets
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Ajouter du CSS pour l'animation des onglets si nécessaire
    if (!document.getElementById('tab-animations')) {
        const style = document.createElement('style');
        style.id = 'tab-animations';
        style.textContent = `
            .tab-content {
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s, transform 0.3s;
                display: none;
            }
            
            .tab-content.active {
                opacity: 1;
                transform: translateY(0);
                display: block;
            }
            
            .tab-btn {
                position: relative;
                overflow: hidden;
            }
            
            .tab-btn::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 2px;
                height: 2px;
                background-color: var(--primary-color, #3498db);
                transition: width 0.3s ease;
            }
            
            .tab-btn.active::after {
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const activeContent = document.getElementById(tabId);
            
            if (activeContent) {
                // Utiliser setTimeout pour créer une séquence d'animation
                setTimeout(() => {
                    activeContent.classList.add('active');
                }, 50);
            }
        });
    });
}

/**
 * Charge les packages similaires
 * @param {string} currentPackageId - ID du package actuel
 */
function loadSimilarPackages(currentPackageId) {
    const similarPackagesGrid = document.getElementById('similar-packages-grid');
    
    if (!similarPackagesGrid) return;
    
    // Afficher un indicateur de chargement
    similarPackagesGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement des packages similaires...</div>';
    
    // Définir un timeout pour gérer les erreurs de connexion réseau
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Délai d\'attente dépassé')), 10000);
    });
    
    // Appel à l'API pour récupérer tous les packages
    Promise.race([
        fetch('http://localhost:8000/packages/'),
        timeoutPromise
    ])
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(packages => {
        // Filtrer pour exclure le package actuel et limiter à 3 packages
        const similarPackages = packages
            .filter(pkg => pkg.id.toString() !== currentPackageId.toString())
            .slice(0, 3);
        
        // Si aucun package similaire n'est trouvé
        if (similarPackages.length === 0) {
            similarPackagesGrid.innerHTML = '<div class="no-results">Aucun package similaire disponible pour le moment.</div>';
            return;
        }
        
        // Vider le conteneur
        similarPackagesGrid.innerHTML = '';
        
        // Créer une carte pour chaque package similaire
        similarPackages.forEach((pkg, index) => {
            // Ajouter un délai d'animation pour chaque carte
            setTimeout(() => {
                const card = document.createElement('div');
                card.className = 'package-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                card.innerHTML = `
                    <div class="package-image">
                        <img src="${getPackageImageUrl(pkg)}" 
                             alt="${pkg.name}"
                             onerror="this.src='static/images/destinations/Unknown.jpg'"
                             class="package-thumbnail">
                        ${pkg.discount ? `<div class="discount-badge">-${pkg.discount}%</div>` : ''}
                    </div>
                    <div class="package-info">
                        <h3>${pkg.name}</h3>
                        <div class="package-meta">
                            <span><i class="fas fa-calendar-alt"></i> ${pkg.duration} jours</span>
                            <span><i class="fas fa-euro-sign"></i> ${formatPrice(pkg.price)} €</span>
                        </div>
                        <p>${pkg.description ? (pkg.description.substring(0, 100) + (pkg.description.length > 100 ? '...' : '')) : 'Aucune description disponible.'}</p>
                        <a href="package-detail.html?id=${pkg.id}" class="btn-details">Voir plus</a>
                    </div>
                `;
                
                similarPackagesGrid.appendChild(card);
                
                // Déclencher l'animation après l'ajout au DOM
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 150); // Ajouter un délai pour chaque carte
        });
    })
    .catch(error => {
        console.error("Erreur lors du chargement des packages similaires:", error);
        similarPackagesGrid.innerHTML = '<div class="error-message">Une erreur est survenue lors du chargement des suggestions.</div>';
    });
}

/**
 * Fonction pour gérer les favoris
 * @param {string} packageId - ID du package
 */
function toggleFavorite(packageId) {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        alert('Veuillez vous connecter pour ajouter ce voyage à vos favoris');
        return;
    }
    
    // Récupérer les favoris existants
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(packageId);
    
    if (isFavorite) {
        // Supprimer des favoris
        favorites = favorites.filter(id => id !== packageId);
        showToast('Voyage retiré de vos favoris');
    } else {
        // Ajouter aux favoris
        favorites.push(packageId);
        showToast('Voyage ajouté à vos favoris');
    }
    
    // Mettre à jour les favoris dans le localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Mettre à jour l'interface
    const favBtn = document.querySelector(`.fav-btn[data-id="${packageId}"]`);
    if (favBtn) {
        if (isFavorite) {
            favBtn.innerHTML = '<i class="far fa-heart"></i>';
            favBtn.title = 'Ajouter aux favoris';
        } else {
            favBtn.innerHTML = '<i class="fas fa-heart"></i>';
            favBtn.title = 'Retirer des favoris';
        }
    }
}

/**
 * Affiche un toast (message temporaire)
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage en ms
 */
function showToast(message, duration = 3000) {
    // Créer le toast s'il n'existe pas
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        
        // Styles pour le toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        
        document.body.appendChild(toast);
    }
    
    // Définir le message
    toast.textContent = message;
    
    // Afficher le toast
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Cacher le toast après la durée spécifiée
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

/**
 * Ajoute un gestionnaire d'événements pour le défilement de la page
 * Cette fonction active des animations lorsque les éléments deviennent visibles
 */
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('scroll', function() {
        // Animer les éléments lorsqu'ils deviennent visibles
        const animateOnScroll = document.querySelectorAll('.animate-on-scroll');
        animateOnScroll.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    });
    
    // Déclencher l'événement de défilement une fois pour animer les éléments visibles au chargement
    window.dispatchEvent(new Event('scroll'));
});

/**
 * Charge les informations météo pour la destination principale
 * @param {Object} packageData - Les données du package
 */
function loadWeatherInfo(packageData) {
    // Vérifier si le package a des destinations
    if (!packageData.destinations || packageData.destinations.length === 0) return;
    
    const mainDestination = packageData.destinations[0];
    const weatherContainer = document.getElementById('weather-info');
    
    if (!weatherContainer || !mainDestination.name) return;
    
    // Dans une application réelle, vous feriez une requête à une API météo
    // Ici, nous simulons une réponse
    const weather = {
        temperature: Math.floor(Math.random() * 15) + 15, // Entre 15°C et 30°C
        condition: ['Ensoleillé', 'Partiellement nuageux', 'Nuageux', 'Pluvieux'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 30) + 50, // Entre 50% et 80%
        icon: ['fa-sun', 'fa-cloud-sun', 'fa-cloud', 'fa-cloud-rain'][Math.floor(Math.random() * 4)]
    };
    
    weatherContainer.innerHTML = `
        <h3>Météo actuelle à ${mainDestination.name}</h3>
        <div class="weather-display">
            <div class="weather-icon">
                <i class="fas ${weather.icon}"></i>
            </div>
            <div class="weather-details">
                <div class="temperature">${weather.temperature}°C</div>
                <div class="condition">${weather.condition}</div>
                <div class="humidity"><i class="fas fa-tint"></i> Humidité: ${weather.humidity}%</div>
            </div>
        </div>
    `;
}