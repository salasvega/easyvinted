# Script PowerShell pour configurer le Planificateur de tâches Windows

$ProjectDir = Split-Path -Parent $PSScriptRoot
$TaskNameAuto = "VintedAutoPublish"
$TaskNameScheduled = "VintedScheduledPublish"

Write-Host "🔧 Configuration de l'automatisation Vinted (Windows)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choisissez une option:"
Write-Host "  1) Publier tous les jours à une heure précise"
Write-Host "  2) Publier toutes les X heures"
Write-Host "  3) Vérifier les articles programmés toutes les 15 minutes"
Write-Host "  4) Afficher la configuration actuelle"
Write-Host "  5) Supprimer l'automatisation"
Write-Host ""

$choice = Read-Host "Votre choix (1-5)"

switch ($choice) {
    1 {
        $time = Read-Host "À quelle heure voulez-vous publier ? (format HH:MM, ex: 10:00)"

        $action = New-ScheduledTaskAction -Execute "npm" -Argument "run vinted:auto" -WorkingDirectory $ProjectDir
        $trigger = New-ScheduledTaskTrigger -Daily -At $time
        $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

        Register-ScheduledTask -TaskName $TaskNameAuto -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

        Write-Host ""
        Write-Host "✅ Automatisation configurée !" -ForegroundColor Green
        Write-Host "📅 Les articles seront publiés tous les jours à $time" -ForegroundColor Yellow
    }

    2 {
        $hours = Read-Host "Publier toutes les combien d'heures ? (ex: 6 pour toutes les 6h)"

        $action = New-ScheduledTaskAction -Execute "npm" -Argument "run vinted:auto" -WorkingDirectory $ProjectDir
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours $hours) -RepetitionDuration ([TimeSpan]::MaxValue)
        $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

        Register-ScheduledTask -TaskName $TaskNameAuto -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

        Write-Host ""
        Write-Host "✅ Automatisation configurée !" -ForegroundColor Green
        Write-Host "📅 Les articles seront publiés toutes les $hours heures" -ForegroundColor Yellow
    }

    3 {
        $action = New-ScheduledTaskAction -Execute "npm" -Argument "run scheduled:publish" -WorkingDirectory $ProjectDir
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
        $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

        Register-ScheduledTask -TaskName $TaskNameScheduled -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

        Write-Host ""
        Write-Host "✅ Automatisation configurée !" -ForegroundColor Green
        Write-Host "📅 Les articles programmés seront vérifiés toutes les 15 minutes" -ForegroundColor Yellow
    }

    4 {
        Write-Host ""
        Write-Host "Configuration actuelle:" -ForegroundColor Cyan
        Write-Host "======================" -ForegroundColor Cyan

        $taskAuto = Get-ScheduledTask -TaskName $TaskNameAuto -ErrorAction SilentlyContinue
        $taskScheduled = Get-ScheduledTask -TaskName $TaskNameScheduled -ErrorAction SilentlyContinue

        if ($taskAuto -or $taskScheduled) {
            if ($taskAuto) {
                Write-Host "`nPublication automatique:" -ForegroundColor Yellow
                $taskAuto | Select-Object TaskName, State, @{Name="Trigger";Expression={$_.Triggers[0].ToString()}}
            }
            if ($taskScheduled) {
                Write-Host "`nPublication programmée:" -ForegroundColor Yellow
                $taskScheduled | Select-Object TaskName, State, @{Name="Trigger";Expression={$_.Triggers[0].ToString()}}
            }
        } else {
            Write-Host "Aucune automatisation configurée" -ForegroundColor Yellow
        }
    }

    5 {
        Unregister-ScheduledTask -TaskName $TaskNameAuto -Confirm:$false -ErrorAction SilentlyContinue
        Unregister-ScheduledTask -TaskName $TaskNameScheduled -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "✅ Automatisation supprimée" -ForegroundColor Green
    }

    default {
        Write-Host "Option invalide" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
