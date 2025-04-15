document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const playerList = document.getElementById('player-list');
    const serverStatus = document.getElementById('server-status');
    const refreshPlayers = document.getElementById('refresh-players');
    const refreshStatus = document.getElementById('refresh-status');
    const copyAddress = document.getElementById('copy-address');
    const toast = document.getElementById('toast');
    const refreshTimerEl = document.getElementById('refresh-timer');
    const refreshTimerStatusEl = document.getElementById('refresh-timer-status');
    const onlineCountEl = document.getElementById('online-count');
    const serverActivityChart = document.getElementById('server-activity-chart');
    
    // URLs des APIs
    const playersApiUrl = 'https://panel.omgserv.com/json/447820/players';
    const statusApiUrl = 'https://panel.omgserv.com/json/447820/status';
    
    // Intervalle de rafraîchissement (10 secondes)
    const refreshInterval = 10000;
    let lastRefreshTime = Date.now();
    let refreshTimer;
    
    // Historique des données pour les graphiques
    const activityHistory = {
        times: [],
        players: [],
        cpu: [],
        ram: []
    };
    
    // Fonctions de récupération des données
    async function fetchData(url) {
        try {
            // Tentative directe
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la récupération des données: ${error.message}`);
            
            // Tentative avec proxies CORS si nécessaire
            try {
                return await fetchWithCorsProxy(url);
            } catch (proxyError) {
                console.error('Erreur avec les proxies CORS:', proxyError);
                throw error;
            }
        }
    }
    
    // Fonction pour essayer plusieurs proxies CORS en cas de problème CORS
    async function fetchWithCorsProxy(url) {
        // Liste des proxies CORS à essayer
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ];
        
        // Essayer chaque proxy jusqu'à ce qu'un fonctionne
        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url));
                if (!response.ok) {
                    throw new Error(`Réponse HTTP non valide: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Échec avec le proxy ${proxy}:`, error);
                // Continuer à essayer avec le proxy suivant
            }
        }
        
        // Si aucun proxy ne fonctionne, lancer une erreur
        throw new Error('Tous les proxys CORS ont échoué');
    }
    
    // Fonction pour afficher les notifications toast
    function showToast(message, icon = 'check-circle', isSuccess = true) {
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        toastIcon.className = `fas fa-${icon}`;
        toastIcon.style.color = isSuccess ? 'var(--primary)' : 'var(--accent)';
        toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        // Masquer après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Fonction pour obtenir l'URL de l'avatar du joueur
    function getPlayerAvatarUrl(username) {
        // Utilisation du service mc-heads.net pour obtenir les avatars
        return `https://mc-heads.net/avatar/${username}/40`;
    }
    
    // Fonction pour charger les joueurs
    async function loadPlayers() {
        // État de chargement
        if (playerList.querySelectorAll('.player-item').length === 0) {
            playerList.innerHTML = `
                <li class="player-item loading">
                    <div class="player-avatar">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="player-info">
                        <div class="player-name">Chargement...</div>
                        <div class="player-status">Récupération des joueurs</div>
                    </div>
                </li>
            `;
        }
        
        try {
            // Charger les données
            const data = await fetchData(playersApiUrl);
            
            // Vider la liste des joueurs
            playerList.innerHTML = '';
            
            // Mettre à jour le compteur de joueurs en ligne
            if (onlineCountEl) {
                onlineCountEl.textContent = data.players ? data.players.length : 0;
            }
            
            // Vérifier si des joueurs sont connectés
            if (!data.players || data.players.length === 0) {
                // Aucun joueur connecté
                playerList.innerHTML = `
                    <li class="player-item no-players">
                        <div class="player-avatar">
                            <i class="fas fa-user-slash"></i>
                        </div>
                        <div class="player-info">
                            <div class="player-name">Aucun joueur connecté</div>
                            <div class="player-status">Soyez le premier à rejoindre !</div>
                        </div>
                    </li>
                `;
            } else {
                // Ajouter les joueurs à l'historique
                activityHistory.times.push(new Date().toLocaleTimeString());
                activityHistory.players.push(data.players.length);
                
                // Limiter l'historique à 20 points
                if (activityHistory.times.length > 20) {
                    activityHistory.times.shift();
                    activityHistory.players.shift();
                }
                
                // Mettre à jour le graphique
                updateActivityChart();
                
                // Afficher chaque joueur
                data.players.forEach(player => {
                    // Créer l'élément pour le joueur
                    const playerItem = document.createElement('li');
                    playerItem.className = 'player-item';
                    playerItem.innerHTML = `
                        <div class="player-avatar">
                            <img src="${getPlayerAvatarUrl(player)}" alt="${player}" class="player-head" />
                        </div>
                        <div class="player-info">
                            <div class="player-name">${player}</div>
                            <div class="player-status">En ligne</div>
                        </div>
                        <div class="player-stats">
                            <div class="player-stat">
                                <i class="fas fa-clock"></i>
                                <span>En jeu</span>
                            </div>
                        </div>
                    `;
                    
                    // Ajouter le joueur à la liste
                    playerList.appendChild(playerItem);
                });
            }
        } catch (error) {
            console.error('Erreur avec l\'API des joueurs:', error);
            
            // Afficher un message d'erreur
            if (playerList.querySelectorAll('.player-item').length === 0) {
                playerList.innerHTML = `
                    <li class="player-item error-state">
                        <div class="player-avatar"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="player-info">
                            <div class="player-name">Erreur de connexion</div>
                            <div class="player-status">Impossible de récupérer les données des joueurs</div>
                        </div>
                    </li>
                `;
            }
        }
    }
    
    // Fonction pour charger le statut du serveur
    async function loadServerStatus() {
        try {
            // Charger les données
            const data = await fetchData(statusApiUrl);
            
            if (data && data.status) {
                const status = data.status;
                const isOnline = status.online;
                
                // Ajouter à l'historique
                activityHistory.cpu.push(status.cpu);
                activityHistory.ram.push(Math.round(status.ram / 1024));
                
                // Limiter l'historique
                if (activityHistory.cpu.length > 20) {
                    activityHistory.cpu.shift();
                    activityHistory.ram.shift();
                }
                
                // Statut en ligne/hors ligne
                const statusValue = serverStatus.querySelector('.status-item:nth-child(1) .status-value');
                statusValue.innerHTML = isOnline ? 
                    '<span class="status-online">En ligne</span>' : 
                    '<span class="status-offline">Hors ligne</span>';
                
                // CPU
                const cpuValue = serverStatus.querySelector('.status-item:nth-child(2) .status-value');
                cpuValue.innerHTML = isOnline ? 
                    `<div class="progress-bar"><div class="progress-fill" style="width: ${status.cpu}%"></div><span>${status.cpu}%</span></div>` : 
                    'N/C';
                
                // RAM
                const ramValue = serverStatus.querySelector('.status-item:nth-child(3) .status-value');
                const ramPercent = isOnline ? Math.round((status.ram / (status.players.max * 512 * 1024)) * 100) : 0;
                ramValue.innerHTML = isOnline ? 
                    `<div class="progress-bar"><div class="progress-fill" style="width: ${ramPercent}%"></div><span>${Math.round(status.ram / 1024)} Mo</span></div>` : 
                    'N/C';
                
                // Joueurs
                const playersValue = serverStatus.querySelector('.status-item:nth-child(4) .status-value');
                const playersPercent = isOnline ? Math.round((status.players.online / status.players.max) * 100) : 0;
                playersValue.innerHTML = isOnline ? 
                    `<div class="progress-bar"><div class="progress-fill" style="width: ${playersPercent}%"></div><span>${status.players.online} / ${status.players.max}</span></div>` : 
                    'N/C';
                
                // Mettre à jour le compteur de joueurs en ligne
                if (onlineCountEl) {
                    onlineCountEl.textContent = isOnline ? status.players.online : 0;
                }
                
                // Mettre à jour le graphique
                updateActivityChart();
            } else {
                throw new Error('Format de données invalide');
            }
        } catch (error) {
            console.error('Erreur avec l\'API de statut:', error);
            
            // Afficher un état d'erreur pour chaque élément
            serverStatus.querySelectorAll('.status-value').forEach(value => {
                value.innerHTML = '<span class="status-error">Erreur</span>';
            });
        }
    }
    
    // Fonction pour mettre à jour le graphique d'activité
    function updateActivityChart() {
        if (!serverActivityChart || activityHistory.times.length < 2) return;
        
        // Mettre à jour le graphique avec Chart.js si disponible
        if (window.Chart && serverActivityChart.getContext) {
            if (!window.serverChart) {
                // Créer le graphique pour la première fois
                window.serverChart = new Chart(serverActivityChart.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: activityHistory.times,
                        datasets: [
                            {
                                label: 'Joueurs',
                                data: activityHistory.players,
                                borderColor: 'rgb(82, 165, 53)',
                                backgroundColor: 'rgba(82, 165, 53, 0.1)',
                                tension: 0.3,
                                fill: true
                            },
                            {
                                label: 'CPU %',
                                data: activityHistory.cpu,
                                borderColor: 'rgb(91, 141, 217)',
                                backgroundColor: 'rgba(91, 141, 217, 0.1)',
                                tension: 0.3,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        animation: {
                            duration: 500
                        }
                    }
                });
            } else {
                // Mettre à jour le graphique existant
                window.serverChart.data.labels = activityHistory.times;
                window.serverChart.data.datasets[0].data = activityHistory.players;
                window.serverChart.data.datasets[1].data = activityHistory.cpu;
                window.serverChart.update();
            }
        }
    }
    
    // Fonction pour mettre à jour le timer de rafraîchissement
    function updateRefreshTimer() {
        if (!refreshTimerEl || !refreshTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        // Mettre à jour l'affichage du timer
        refreshTimerEl.textContent = secondsRemaining;
        refreshTimerStatusEl.textContent = secondsRemaining;
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('refresh-progress');
        if (progressBar) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        // Si le temps est écoulé, rafraîchir les données
        if (timeElapsed >= refreshInterval) {
            loadPlayers();
            loadServerStatus();
            lastRefreshTime = now;
        }
    }
    
    // Mettre à jour les événements récents
    function updateServerEvents() {
        const timelineEl = document.querySelector('.timeline');
        if (!timelineEl) return;
        
        // Obtenir la date et l'heure actuelles formatées
        const now = new Date();
        const formattedDateTime = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
        
        // Créer un nouvel événement pour la mise à jour
        const newEvent = document.createElement('div');
        newEvent.className = 'timeline-item';
        newEvent.innerHTML = `
            <div class="timeline-time">${formattedDateTime}</div>
            <div class="timeline-title">Actualisation des données</div>
            <div class="timeline-desc">Les données du serveur ont été mises à jour automatiquement.</div>
        `;
        
        // Ajouter l'événement au début de la timeline
        timelineEl.insertBefore(newEvent, timelineEl.firstChild);
        
        // Limiter à 5 événements
        if (timelineEl.children.length > 5) {
            timelineEl.removeChild(timelineEl.lastChild);
        }
    }
    
    // Copier l'adresse du serveur
    copyAddress.addEventListener('click', function() {
        const serverAddress = document.querySelector('.address-text').textContent;
        navigator.clipboard.writeText(serverAddress)
            .then(() => {
                showToast('Adresse du serveur copiée !');
            })
            .catch(() => {
                showToast('Impossible de copier l\'adresse', 'exclamation-circle', false);
            });
    });
    
    // Événement de clic sur le bouton de rafraîchissement des joueurs
    refreshPlayers.addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('spinning');
        
        loadPlayers();
        lastRefreshTime = Date.now();
        
        // Retirer la classe spinning après 1 seconde
        setTimeout(() => {
            icon.classList.remove('spinning');
        }, 1000);
        
        // Mettre à jour les événements
        updateServerEvents();
    });
    
    // Événement de clic sur le bouton de rafraîchissement du statut
    refreshStatus.addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('spinning');
        
        loadServerStatus();
        lastRefreshTime = Date.now();
        
        // Retirer la classe spinning après 1 seconde
        setTimeout(() => {
            icon.classList.remove('spinning');
        }, 1000);
        
        // Mettre à jour les événements
        updateServerEvents();
    });
    
    // Mettre en place l'animation de "battement de cœur" du serveur
    function setupHeartbeat() {
        const serverHeartbeat = document.getElementById('server-heartbeat');
        if (serverHeartbeat) {
            setInterval(() => {
                serverHeartbeat.classList.add('pulse');
                setTimeout(() => {
                    serverHeartbeat.classList.remove('pulse');
                }, 300);
            }, 2000);
        }
    }
    
    // Démarrer le rafraîchissement automatique
    function startAutoRefresh() {
        // Charger les données immédiatement
        loadPlayers();
        loadServerStatus();
        lastRefreshTime = Date.now();
        
        // Démarrer le timer de rafraîchissement
        refreshTimer = setInterval(updateRefreshTimer, 1000);
    }
    
    // Initialiser l'application
    startAutoRefresh();
    setupHeartbeat();
    
    // Vérifier si le document est visible et ajuster le rafraîchissement
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Suspendre le rafraîchissement automatique
            clearInterval(refreshTimer);
        } else {
            // Reprendre le rafraîchissement automatique
            clearInterval(refreshTimer);
            refreshTimer = setInterval(updateRefreshTimer, 1000);
            
            // Rafraîchir immédiatement les données
            loadPlayers();
            loadServerStatus();
            lastRefreshTime = Date.now();
        }
    });
});