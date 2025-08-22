// static/js/destinations.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation des destinations...");
    
    // Initialiser les filtres
    initDestinationFilters();
    
    // Gestion des filtres mobiles
    initMobileFilters();
});

/**
 * Initialise le comportement du bouton de filtrage mobile
 */
function initMobileFilters() {
    // Sélectionner le bouton et le formulaire
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const filtersForm = document.querySelector('.filters-form');
    
    // Si les éléments existent
    if (mobileFilterToggle && filtersForm) {
        console.log("Éléments de filtrage mobile trouvés");
        
        // Au chargement, forcer le formulaire à être masqué en mode mobile
        if (window.innerWidth <= 768) {
            filtersForm.style.display = 'none';
            filtersForm.classList.remove('active');
        }
        
        // Ajouter l'événement de clic
        mobileFilterToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Clic sur bouton de filtrage mobile détecté");
            
            // Basculer l'affichage du formulaire
            if (filtersForm.classList.contains('active')) {
                filtersForm.classList.remove('active');
                filtersForm.style.display = 'none';
                this.innerHTML = '<i class="fas fa-filter"></i> Filtres';
            } else {
                filtersForm.classList.add('active');
                filtersForm.style.display = 'block';
                this.innerHTML = '<i class="fas fa-times"></i> Masquer filtres';
            }
            
            // Ajouter la classe active au bouton
            this.classList.toggle('active');
        });
    } else {
        console.warn("Éléments de filtrage mobile non trouvés:", 
                    "bouton =", mobileFilterToggle, 
                    "formulaire =", filtersForm);
    }
}

/**
 * Initialise les filtres de destination
 */
function initDestinationFilters() {
    console.log("Initialisation des filtres de destination");
    
    // Récupérer le formulaire et les boutons
    const filterForm = document.getElementById('destination-filters');
    const filterBtn = document.querySelector('.btn-primary');
    const resetBtn = document.getElementById('reset-filters');
    
    console.log("Formulaire:", filterForm);
    console.log("Bouton filtrer:", filterBtn);
    console.log("Bouton réinitialiser:", resetBtn);
    
    // Gestionnaire pour la soumission du formulaire
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulaire soumis");
            
            // Récupérer les valeurs des filtres
            const continent = document.getElementById('continent').value;
            const budget = document.getElementById('budget').value;
            const note = document.getElementById('Note').value;
            
            console.log("Filtrage avec:", {continent, budget, note});
            
            // Utiliser la fonction loadDestinations de main.js avec des filtres
            const filters = {};
            if (continent) filters.continent = continent;
            if (budget) filters.price_category = budget;
            if (note) filters.min_rating = note;
            
            // Appeler la fonction loadDestinations de main.js
            loadDestinations(filters);
        });
    }
    
    // Gestionnaire pour le bouton réinitialiser
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Réinitialisation des filtres");
            
            // Réinitialiser les sélecteurs
            document.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Recharger toutes les destinations sans filtres
            loadDestinations();
        });
    }
}

/**
 * Fonction globale pour réinitialiser les filtres
 * (accessible depuis le HTML)
 */
function resetFilters() {
    console.log("Réinitialisation des filtres (fonction globale)");
    
    // Réinitialiser les sélecteurs
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Recharger toutes les destinations
    loadDestinations();
}