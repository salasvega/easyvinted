#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔧 Configuration de l'automatisation Vinted"
echo "============================================"
echo ""
echo "Ce script va configurer la publication automatique des articles."
echo ""
echo "Choisissez une option:"
echo "  1) Publier tous les jours à une heure précise"
echo "  2) Publier toutes les X heures"
echo "  3) Vérifier les articles programmés toutes les 15 minutes"
echo "  4) Afficher la configuration actuelle"
echo "  5) Supprimer l'automatisation"
echo ""
read -p "Votre choix (1-5): " choice

case $choice in
  1)
    read -p "À quelle heure voulez-vous publier ? (format HH:MM, ex: 10:00): " time_input
    hour=$(echo $time_input | cut -d: -f1)
    minute=$(echo $time_input | cut -d: -f2)

    cron_command="$minute $hour * * * cd $PROJECT_DIR && npm run vinted:auto >> $PROJECT_DIR/logs/vinted-auto.log 2>&1"

    (crontab -l 2>/dev/null | grep -v "vinted:auto"; echo "$cron_command") | crontab -

    mkdir -p "$PROJECT_DIR/logs"

    echo ""
    echo "✅ Automatisation configurée !"
    echo "📅 Les articles seront publiés tous les jours à $time_input"
    echo "📝 Logs disponibles dans: $PROJECT_DIR/logs/vinted-auto.log"
    ;;

  2)
    read -p "Publier toutes les combien d'heures ? (ex: 6 pour toutes les 6h): " hours

    cron_command="0 */$hours * * * cd $PROJECT_DIR && npm run vinted:auto >> $PROJECT_DIR/logs/vinted-auto.log 2>&1"

    (crontab -l 2>/dev/null | grep -v "vinted:auto"; echo "$cron_command") | crontab -

    mkdir -p "$PROJECT_DIR/logs"

    echo ""
    echo "✅ Automatisation configurée !"
    echo "📅 Les articles seront publiés toutes les $hours heures"
    echo "📝 Logs disponibles dans: $PROJECT_DIR/logs/vinted-auto.log"
    ;;

  3)
    cron_command="*/15 * * * * cd $PROJECT_DIR && npm run scheduled:publish >> $PROJECT_DIR/logs/scheduled-publish.log 2>&1"

    (crontab -l 2>/dev/null | grep -v "scheduled:publish"; echo "$cron_command") | crontab -

    mkdir -p "$PROJECT_DIR/logs"

    echo ""
    echo "✅ Automatisation configurée !"
    echo "📅 Les articles programmés seront vérifiés toutes les 15 minutes"
    echo "📝 Logs disponibles dans: $PROJECT_DIR/logs/scheduled-publish.log"
    ;;

  4)
    echo ""
    echo "Configuration actuelle:"
    echo "======================"
    crontab -l 2>/dev/null | grep -E "vinted:auto|scheduled:publish" || echo "Aucune automatisation configurée"
    ;;

  5)
    crontab -l 2>/dev/null | grep -v "vinted:auto" | grep -v "scheduled:publish" | crontab -
    echo ""
    echo "✅ Automatisation supprimée"
    ;;

  *)
    echo "Option invalide"
    exit 1
    ;;
esac

echo ""
