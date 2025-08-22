// static/js/packages.js
document.addEventListener('DOMContentLoaded', function() {
    // Charger les packages
    loadPackages();
    
    // Initialiser les filtres
    initPackageFilters();
    
    // Initialiser le tri
    initSorting();
    
    // Gestion des filtres mobiles
    initMobileFilters();
    
    // Appliquer les filtres de l'URL si présents
    applyUrlFilters();
    
    // Ajouter animation au scroll
    initScrollAnimations();
});

/**
 * Initialise les animations au défilement
 */
function initScrollAnimations() {
    // Animation des cartes au scroll
    if ('IntersectionObserver' in window) {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, options);
        
        // Observer les éléments à animer
        setTimeout(() => {
            document.querySelectorAll('.package-card').forEach(card => {
                observer.observe(card);
            });
            
            document.querySelectorAll('.testimonial-card').forEach(card => {
                observer.observe(card);
            });
        }, 500);
    }
}

/**
 * Initialise la gestion des filtres en mode mobile
 */
function initMobileFilters() {
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const filtersForm = document.querySelector('.filters-form');
    
    if (mobileFilterToggle && filtersForm) {
        mobileFilterToggle.addEventListener('click', function() {
            filtersForm.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

/**
 * Initialise le tri des packages
 */
function initSorting() {
    const sortSelect = document.getElementById('sort-packages');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', function() {
        const filters = getFormFilters(document.getElementById('package-filters'));
        loadPackages(filters, this.value);
    });
}

/**
 * Applique les filtres présents dans l'URL
 */
function applyUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Vérifier si des filtres sont présents dans l'URL
    if (urlParams.has('search') || urlParams.has('min_price') || 
        urlParams.has('max_price') || urlParams.has('min_duration')) {
        
        const filters = {
            search: urlParams.get('search') || '',
            minPrice: urlParams.get('min_price') || '',
            maxPrice: urlParams.get('max_price') || '',
            minDuration: urlParams.get('min_duration') || ''
        };
        
        // Remplir le formulaire avec les valeurs
        if (document.getElementById('search-package')) {
            document.getElementById('search-package').value = filters.search;
        }
        if (document.getElementById('min-price')) {
            document.getElementById('min-price').value = filters.minPrice;
        }
        if (document.getElementById('max-price')) {
            document.getElementById('max-price').value = filters.maxPrice;
        }
        if (document.getElementById('min-duration')) {
            document.getElementById('min-duration').value = filters.minDuration;
        }
        
        // Charger les packages avec ces filtres
        loadPackages(filters);
    }
}

/**
 * Charge les packages depuis l'API
 * @param {Object} filters - Filtres à appliquer
 * @param {string} sortBy - Critère de tri
 */
function loadPackages(filters = {}, sortBy = 'popularity') {
    const packagesGrid = document.getElementById('packages-grid');
    const packageCount = document.getElementById('package-count');
    
    if (!packagesGrid) return;
    
    // Afficher un indicateur de chargement
    packagesGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-pulse"></i>
            <p>Recherche des meilleurs packages...</p>
        </div>
    `;
    
    // Construire l'URL avec les filtres
    let url = 'http://localhost:8000/packages/';
    const params = new URLSearchParams();
    
    // Ajouter les filtres à l'URL
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    if (filters.minDuration) params.append('min_duration', filters.minDuration);
    
    // Ajouter les paramètres à l'URL
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    // Appel à l'API
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des packages');
            }
            return response.json();
        })
        .then(packages => {
            // Mettre à jour le compteur
            if (packageCount) {
                packageCount.textContent = `${packages.length} package(s) trouvé(s)`;
            }
            
            // Vider le conteneur
            packagesGrid.innerHTML = '';
            
            // Si aucun package n'est trouvé
            if (packages.length === 0) {
                packagesGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search fa-3x" style="color:#ddd;margin-bottom:20px;"></i>
                        <h3>Aucun package disponible</h3>
                        <p>Aucun package ne correspond à vos critères de recherche. Veuillez essayer avec d'autres filtres.</p>
                        <button class="btn-primary" onclick="resetFilters()"><i class="fas fa-undo"></i> Réinitialiser les filtres</button>
                    </div>
                `;
                return;
            }
            
            // Trier les packages si nécessaire
            sortPackages(packages, sortBy);
            
            // Créer une carte pour chaque package avec animation
            packages.forEach((package, index) => {
                const packageCard = createPackageCard(package, index);
                packagesGrid.appendChild(packageCard);
            });
            
            // Initialiser les animations
            initScrollAnimations();
        })
        .catch(error => {
            console.error("Erreur:", error);
            packagesGrid.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Une erreur est survenue lors du chargement des packages. Veuillez réessayer plus tard.</p>
                </div>
            `;
        });
}

/**
 * Trie un tableau de packages
 * @param {Array} packages - Tableau de packages à trier
 * @param {string} sortBy - Critère de tri
 */
function sortPackages(packages, sortBy) {
    switch (sortBy) {
        case 'price-asc':
            packages.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            packages.sort((a, b) => b.price - a.price);
            break;
        case 'duration-asc':
            packages.sort((a, b) => a.duration - b.duration);
            break;
        // Par défaut, tri par popularité (assumé comme étant déjà trié)
        default:
            break;
    }
}

/**
 * Crée une carte de package
 * @param {Object} package - Données du package
 * @param {number} index - Index pour l'animation
 * @returns {HTMLElement} - Élément de carte créé
 */
function createPackageCard(package, index) {
    const card = document.createElement('div');
    card.className = 'package-card';
    card.style.setProperty('--animation-order', index);
    
    // Vérifier si le package a une promotion
    const hasDiscount = package.old_price && package.old_price > package.price;
    const discountPercentage = hasDiscount ? Math.round((1 - package.price / package.old_price) * 100) : 0;
    
    // Déterminer le chemin de l'image en fonction du package
    let imagePath;
    
    if (package.name.includes('Europe')) {
        imagePath = 'static/images/destinations/ER.jpg';
    } else if (package.name.includes('Asie')) {
        imagePath = 'static/images/destinations/AS.jpg';
    } else if (package.image_url && package.image_url.trim() !== '') {
        imagePath = package.image_url;
    } else {
        imagePath = 'static/images/packages/placeholder.jpg';
    }
    
    card.innerHTML = `
        <div class="package-image">
            <img src="${imagePath}" alt="${package.name}" 
                 onerror="this.src='static/images/packages/placeholder.jpg'; this.onerror=null;">
            ${hasDiscount ? `<div class="discount-badge">-${discountPercentage}%</div>` : ''}
            <div class="package-overlay">
                <a href="package-detail.html?id=${package.id}" class="overlay-btn"><i class="fas fa-eye"></i> Voir détails</a>
            </div>
        </div>
        <div class="package-info">
            <h3>${package.name}</h3>
            <div class="package-meta">
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${package.duration} jours</span>
                <span class="meta-item"><i class="fas fa-map-marker-alt"></i> ${package.destinations || '4 destinations'}</span>
            </div>
            <p>${package.description ? package.description.substring(0, 100) + (package.description.length > 100 ? '...' : '') : 'Description non disponible'}</p>
            <div class="package-footer">
                <div class="package-price">
                    ${hasDiscount ? `<span class="old-price">${package.old_price.toFixed(2)} €</span>` : ''}
                    <span class="current-price">${package.price.toFixed(2)} €</span>
                </div>
                <a href="package-detail.html?id=${package.id}" class="btn-details">Voir plus</a>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Initialise les filtres de packages
 */
function initPackageFilters() {
    const filterForm = document.getElementById('package-filters');
    if (!filterForm) return;
    
    // Pour la recherche en temps réel (optionnel)
    const searchInput = document.getElementById('search-package');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Appliquer les filtres après un court délai
                const filters = getFormFilters(filterForm);
                const sortBy = document.getElementById('sort-packages')?.value || 'popularity';
                loadPackages(filters, sortBy);
            }, 500);
        });
    }
    
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer les valeurs des filtres
        const filters = getFormFilters(filterForm);
        const sortBy = document.getElementById('sort-packages')?.value || 'popularity';
        
        // Charger les packages avec les filtres
        loadPackages(filters, sortBy);
    });
    
    // Réinitialiser les filtres
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetFilters();
        });
    }
}

/**
 * Réinitialise les filtres et charge les packages
 */
function resetFilters() {
    const filterForm = document.getElementById('package-filters');
    if (filterForm) {
        filterForm.reset();
        
        // Réinitialiser le tri
        const sortSelect = document.getElementById('sort-packages');
        if (sortSelect) {
            sortSelect.value = 'popularity';
        }
        
        // Charger les packages sans filtres
        loadPackages();
    }
}

/**
 * Récupère les filtres du formulaire
 * @param {HTMLFormElement} form - Le formulaire contenant les filtres
 * @returns {Object} - Les filtres extraits
 */
function getFormFilters(form) {
    if (!form) return {};
    
    return {
        search: document.getElementById('search-package')?.value || '',
        minPrice: document.getElementById('min-price')?.value || '',
        maxPrice: document.getElementById('max-price')?.value || '',
        minDuration: document.getElementById('min-duration')?.value || ''
    };
}