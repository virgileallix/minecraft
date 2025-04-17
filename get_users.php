<?php
header('Content-Type: application/json');

// Paramètres de connexion MySQL
$servername = "minecraft3065.omgserv.com";
$username   = "minecraft_447820";
$password   = "tinou123 "; // Remplace "TON_MDP" par ton mot de passe MySQL
$database   = "minecraft_447820";

// Création de la connexion
$conn = new mysqli($servername, $username, $password, $database);

// Vérification de la connexion
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion: " . $conn->connect_error]);
    exit();
}

// Requête SQL pour récupérer les utilisateurs
$sql = "SELECT * FROM users"; // Assure-toi que la table "users" existe dans ta BDD
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de requête: " . $conn->error]);
    exit();
}

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);
$conn->close();
?>
