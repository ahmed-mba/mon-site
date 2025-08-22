// map.js - Implémentation de la carte interactive

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si le conteneur de carte existe
    const mapContainer = document.getElementById('worldMap');
    if (!mapContainer) return;
    
    // Initialiser la carte - dans une application réelle, nous utiliserions une API comme Leaflet ou Google Maps
    initializeMap(mapContainer);
});

/**
 * Initialise la carte interactive
 * @param {HTMLElement} container - L'élément conteneur de la carte
 */
function initializeMap(container) {
    // En attendant d'intégrer une véritable API de carte,
    // nous allons créer une carte simple et interactive en SVG
    
    // Créer le conteneur SVG

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1200 600');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Ajouter un rectangle de fond pour l'océan
    const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ocean.setAttribute('width', '100%');
    ocean.setAttribute('height', '100%');
    ocean.setAttribute('fill', '#e6f7ff');
    svg.appendChild(ocean);
    
    // Ajouter un titre
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '50%');
    title.setAttribute('y', '30');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '24');
    title.setAttribute('fill', '#2a9df4');
    title.textContent = 'Carte interactive des destinations';
    svg.appendChild(title);
    
    // Ajouter un sous-titre
    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', '50%');
    subtitle.setAttribute('y', '60');
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('font-size', '16');
    subtitle.setAttribute('fill', '#555');
    subtitle.textContent = 'Cliquez sur un point pour voir les détails';
    svg.appendChild(subtitle);
    
    // Couleurs par continent
    const continentColors = {
        'Europe': '#4CAF50',
        'Asie': '#FF5722',
        'Amérique du Nord': '#2196F3',
        'Amérique du Sud': '#9C27B0',
        'Afrique': '#FFC107',
        'Océanie': '#009688'
    };
    
    // Points de base pour chaque continent (pour répartir les destinations sans coordonnées)
    const continentBasePoints = {
        'Europe': { x: 500, y: 200, spread: 60 },
        'Asie': { x: 800, y: 250, spread: 80 },
        'Amérique du Nord': { x: 300, y: 220, spread: 70 },
        'Amérique du Sud': { x: 350, y: 400, spread: 60 },
        'Afrique': { x: 550, y: 300, spread: 70 },
        'Océanie': { x: 950, y: 450, spread: 50 }
    };
    
    // Ajouter les continents (représentation simplifiée)
    addSimplifiedContinents(svg);
    
    // Ajouter une légende
    addLegend(svg, continentColors);
    
    // Créer un groupe pour les destinations
    const destinationsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(destinationsGroup);
    
    // Créer un élément pour afficher les détails sur hover
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.setAttribute('visibility', 'hidden');
    
    const tooltipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    tooltipRect.setAttribute('rx', '5');
    tooltipRect.setAttribute('ry', '5');
    tooltipRect.setAttribute('fill', 'white');
    tooltipRect.setAttribute('stroke', '#ccc');
    tooltipRect.setAttribute('stroke-width', '1');
    tooltipRect.setAttribute('opacity', '0.9');
    tooltip.appendChild(tooltipRect);
    
    const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tooltipText.setAttribute('font-size', '14');
    tooltipText.setAttribute('fill', '#333');
    tooltipText.setAttribute('x', '10');
    tooltipText.setAttribute('y', '20');
    tooltip.appendChild(tooltipText);
    
    svg.appendChild(tooltip);
    
    // Ajouter le message de chargement
    const loadingText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    loadingText.setAttribute('x', '50%');
    loadingText.setAttribute('y', '50%');
    loadingText.setAttribute('text-anchor', 'middle');
    loadingText.setAttribute('font-size', '18');
    loadingText.setAttribute('fill', '#666');
    loadingText.setAttribute('id', 'loading-text');
    loadingText.textContent = 'Chargement des destinations...';
    svg.appendChild(loadingText);
    
    // Charger les destinations depuis l'API
    fetch('http://localhost:8000/destinations')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des destinations: ${response.status}`);
            }
            return response.json();
        })
        .then(apiDestinations => {
            // Supprimer le message de chargement
            const loadingElement = document.getElementById('loading-text');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Compteur par continent pour répartir les destinations sans coordonnées
            const continentCounters = {
                'Europe': 0,
                'Asie': 0,
                'Amérique du Nord': 0,
                'Amérique du Sud': 0, 
                'Afrique': 0,
                'Océanie': 0
            };
            
            // Transformer les données de l'API en format attendu pour la carte
            const destinations = apiDestinations.map(dest => {
                // Calculer une position approximative sur la carte
                let x, y;
                
                if (dest.coordinates && dest.coordinates.lat && dest.coordinates.lng) {
                    // Convertir lat/lng en coordonnées SVG approximatives
                    x = ((dest.coordinates.lng + 180) / 360) * 1200; // -180 à +180 → 0 à 1200
                    y = ((90 - dest.coordinates.lat) / 180) * 600;   // +90 à -90 → 0 à 600
                } else {
                    // Position par défaut basée sur le continent avec léger décalage pour éviter la superposition
                    const basePoint = continentBasePoints[dest.continent] || { x: 600, y: 300, spread: 50 };
                    // Incrémenter le compteur pour ce continent
                    continentCounters[dest.continent] = (continentCounters[dest.continent] || 0) + 1;
                    const counter = continentCounters[dest.continent];
                    
                    // Calculer angle et rayon pour répartition circulaire
                    const angle = (counter * Math.PI * 0.5) % (Math.PI * 2);
                    const radius = Math.min(20 + (counter % 5) * 10, basePoint.spread);
                    
                    x = basePoint.x + Math.cos(angle) * radius;
                    y = basePoint.y + Math.sin(angle) * radius;
                }
                
                return {
                    id: dest.id,
                    name: dest.name,
                    country: dest.country || '',
                    x: x,
                    y: y,
                    continent: dest.continent,
                    description: dest.description || ''
                };
            });
            
            // Gérer le cas où il y a beaucoup de destinations
            const shouldShowLabels = destinations.length < 30; // Ne pas afficher les étiquettes s'il y a trop de destinations
            
            // Ajouter chaque destination
            destinations.forEach((dest, index) => {
                const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                point.setAttribute('cx', dest.x);
                point.setAttribute('cy', dest.y);
                point.setAttribute('r', '8');
                point.setAttribute('fill', continentColors[dest.continent] || '#999');
                point.setAttribute('stroke', 'white');
                point.setAttribute('stroke-width', '2');
                point.setAttribute('cursor', 'pointer');
                point.setAttribute('class', 'destination-point');
                point.setAttribute('data-id', dest.id);
                point.setAttribute('data-name', dest.name);
                point.setAttribute('data-continent', dest.continent);
                
                // Animation au survol
                point.addEventListener('mouseenter', function(e) {
                    this.setAttribute('r', '10');
                    this.setAttribute('stroke-width', '3');
                    
                    // Afficher l'infobulle
                    tooltipText.textContent = `${dest.name}, ${dest.country}`;
                    const textBBox = tooltipText.getBBox();
                    
                    tooltipRect.setAttribute('width', textBBox.width + 20);
                    tooltipRect.setAttribute('height', textBBox.height + 10);
                    
                    tooltip.setAttribute('transform', `translate(${dest.x + 15}, ${dest.y - 15})`);
                    tooltip.setAttribute('visibility', 'visible');
                });
                
                point.addEventListener('mouseleave', function() {
                    this.setAttribute('r', '8');
                    this.setAttribute('stroke-width', '2');
                    tooltip.setAttribute('visibility', 'hidden');
                });
                
                // Redirection vers la page de détail
                point.addEventListener('click', function() {
                    window.location.href = `destination-detail.html?id=${dest.id}`;
                });
                
                destinationsGroup.appendChild(point);
                
                // Ajouter le nom de la destination (seulement si peu nombreuses)
                if (shouldShowLabels) {
                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', dest.x);
                    label.setAttribute('y', dest.y + 25);
                    label.setAttribute('text-anchor', 'middle');
                    label.setAttribute('font-size', '12');
                    label.setAttribute('fill', '#333');
                    label.setAttribute('font-weight', 'bold');
                    label.textContent = dest.name;
                    destinationsGroup.appendChild(label);
                }
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des destinations:', error);
            // Supprimer le message de chargement
            const loadingElement = document.getElementById('loading-text');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Afficher un message d'erreur sur la carte
            const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            errorText.setAttribute('x', '50%');
            errorText.setAttribute('y', '50%');
            errorText.setAttribute('text-anchor', 'middle');
            errorText.setAttribute('font-size', '18');
            errorText.setAttribute('fill', '#e74c3c');
            errorText.textContent = 'Impossible de charger les destinations';
            svg.appendChild(errorText);
            
            // Ajouter un bouton pour réessayer
            const retryButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            retryButton.setAttribute('cursor', 'pointer');
            
            const retryRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            retryRect.setAttribute('x', '50%');
            retryRect.setAttribute('y', '50%');
            retryRect.setAttribute('width', '120');
            retryRect.setAttribute('height', '40');
            retryRect.setAttribute('fill', '#3498db');
            retryRect.setAttribute('rx', '5');
            retryRect.setAttribute('ry', '5');
            retryRect.setAttribute('transform', 'translate(-60, 20)');
            
            const retryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            retryText.setAttribute('x', '50%');
            retryText.setAttribute('y', '50%');
            retryText.setAttribute('text-anchor', 'middle');
            retryText.setAttribute('dominant-baseline', 'middle');
            retryText.setAttribute('font-size', '16');
            retryText.setAttribute('fill', 'white');
            retryText.setAttribute('transform', 'translate(0, 40)');
            retryText.textContent = 'Réessayer';
            
            retryButton.appendChild(retryRect);
            retryButton.appendChild(retryText);
            svg.appendChild(retryButton);
            
            retryButton.addEventListener('click', function() {
                // Recharger la page
                window.location.reload();
            });
        });
    
    // Ajouter la carte au conteneur
    container.appendChild(svg);
    
    // Ajouter un message d'instruction pour l'utilisateur
    const instructionDiv = document.createElement('div');
    instructionDiv.style.textAlign = 'center';
    instructionDiv.style.marginTop = '20px';
    instructionDiv.style.padding = '10px';
    instructionDiv.style.color = '#666';
    instructionDiv.textContent = 'Note: Dans la version finale, cette carte sera remplacée par une API cartographique interactive complète.';
    container.after(instructionDiv);
}

/**
 * Ajoute une représentation simplifiée des continents
 * @param {SVGElement} svg - L'élément SVG conteneur
 */
function addSimplifiedContinents(svg) {
    // Groupe pour les continents
    const continentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    continentsGroup.setAttribute('opacity', '0.2');
    
    // Formes simplifiées des continents (représentation schématique)
    
    // Europe
    const europe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    europe.setAttribute('d', 'M480,170 Q520,150 560,180 Q590,200 580,230 Q560,260 520,250 Q490,230 470,210 Q460,190 480,170 Z');
    europe.setAttribute('fill', '#4CAF50');
    continentsGroup.appendChild(europe);
    
    // Asie
    const asia = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    asia.setAttribute('d', 'M600,180 Q650,150 720,160 Q800,180 860,220 Q920,240 950,280 Q970,320 950,370 Q920,400 880,380 Q830,350 780,330 Q720,310 680,290 Q640,270 620,240 Q600,210 600,180 Z');
    asia.setAttribute('fill', '#FF5722');
    continentsGroup.appendChild(asia);
    
    // Amérique du Nord
    const northAmerica = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    northAmerica.setAttribute('d', 'M200,150 Q250,120 300,150 Q350,190 380,240 Q390,290 370,330 Q330,360 280,340 Q240,310 210,270 Q190,220 200,180 Q190,160 200,150 Z');
    northAmerica.setAttribute('fill', '#2196F3');
    continentsGroup.appendChild(northAmerica);
    
    // Amérique du Sud
    const southAmerica = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    southAmerica.setAttribute('d', 'M300,350 Q330,330 360,360 Q380,400 370,450 Q350,490 320,480 Q290,460 280,420 Q280,380 300,350 Z');
    southAmerica.setAttribute('fill', '#9C27B0');
    continentsGroup.appendChild(southAmerica);
    
    // Afrique
    const africa = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    africa.setAttribute('d', 'M500,260 Q540,240 580,250 Q620,280 640,330 Q650,380 630,420 Q600,450 560,440 Q520,410 500,370 Q490,320 500,260 Z');
    africa.setAttribute('fill', '#FFC107');
    continentsGroup.appendChild(africa);
    
    // Océanie
    const oceania = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    oceania.setAttribute('d', 'M900,430 Q930,410 960,430 Q980,460 970,490 Q940,510 910,490 Q890,460 900,430 Z');
    oceania.setAttribute('fill', '#009688');
    continentsGroup.appendChild(oceania);
    
    svg.appendChild(continentsGroup);
}

/**
 * Ajoute une légende des continents
 * @param {SVGElement} svg - L'élément SVG conteneur
 * @param {Object} colors - Couleurs par continent
 */
function addLegend(svg, colors) {
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('transform', 'translate(50, 500)');
    
    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('font-size', '16');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.setAttribute('fill', '#333');
    legendTitle.textContent = 'Légende';
    legend.appendChild(legendTitle);
    
    let yOffset = 25;
    
    // Ajouter chaque élément de légende
    Object.entries(colors).forEach(([continent, color], index) => {
        // Cercle de couleur
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '10');
        circle.setAttribute('cy', yOffset);
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '1');
        legend.appendChild(circle);
        
        // Texte du continent
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '25');
        text.setAttribute('y', yOffset + 5);
        text.setAttribute('font-size', '14');
        text.setAttribute('fill', '#333');
        text.textContent = continent;
        legend.appendChild(text);
        
        yOffset += 25;
    });
    
    svg.appendChild(legend);
}