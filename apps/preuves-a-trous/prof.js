// Mode professeur de l'application « Preuves à trous » : l'empreinte SHA-256 de
// (sel + mot de passe). Le mot de passe lui-même n'est écrit nulle part ; pour le
// changer, lancer dans ce dossier :  python3 mot-de-passe.py
// (le script réécrit ce fichier et, si le dépôt du site existe, sa copie dans
// apps/preuves-a-trous/ ; il reste ensuite à valider et pousser le site).
window.PREUVES_PROF = {
  sel: 'mathopo-preuves',
  empreinte: 'a2892fff0b2e52c6ca68945f19b8c2b09e0dd7ef8e91e92f795e6e4116d4d894',
};
