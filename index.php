<?php
// Récupération des données des joueurs depuis l'API
$data = json_decode(file_get_contents("https://panel.omgserv.com/json/447820/players"));
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BTSSIO Craft - Serveur Minecraft</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="players-card">
            <div class="players-header">
                <div class="players-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h2 class="players-title">Joueurs connectés</h2>
            </div>
            
            <ul class="player-list">
                <?php
                if (empty($data->players)) {
                    // Aucun joueur connecté
                    echo '<li class="player-item no-players">
                            <div class="player-avatar">?</div>
                            <div class="player-info">
                                <div class="player-name">Aucun joueur connecté</div>
                                <div class="player-status">Soyez le premier à rejoindre !</div>
                            </div>
                          </li>';
                } else {
                    // Affiche chaque joueur connecté
                    foreach ($data->players as $player) {
                        // Récupère la première lettre du pseudo
                        $firstLetter = strtoupper(substr($player, 0, 1));
                        
                        echo '<li class="player-item">
                                <div class="player-avatar">' . $firstLetter . '</div>
                                <div class="player-info">
                                    <div class="player-name">' . $player . '</div>
                                    <div class="player-status">En ligne</div>
                                </div>
                              </li>';
                    }
                }
                ?>
            </ul>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>