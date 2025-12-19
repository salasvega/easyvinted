import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * UI KIT EasyVinted
 * Style : Apple / iCloud / App Store
 *
 * Objectif : réutiliser ces composants pour harmoniser toutes les pages
 * (Dashboard, Détails article, Modales, etc.)
 */

/* --------- WRAPPERS GLOBAUX --------- */

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={
        'min-h-screen w-full bg-slate-50 flex justify-center px-3 sm:px-6 py-4 sm:py-8 ' +
        className
      }
    >
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Section principale de page, fond blanc, arrondi XL, "carte" centrale.
 */
export function PageSection({ children, className = '' }: PageSectionProps) {
  return (
    <section
      className={
        'bg-white rounded-3xl shadow-sm border border-slate-100 px-4 sm:px-6 py-5 sm:py-7 ' +
        className
      }
    >
      {children}
    </section>
  );
}

/* --------- HEADER TYPE APPLE / SHEET --------- */

interface SheetHeaderProps {
  title: string;
  subtitle?: ReactNode;
  leftIcon?: LucideIcon;
  rightSlot?: ReactNode;
  onClose?: () => void;
}

/**
 * Header flottant pour modales ou pages "détail".
 */
export function SheetHeader({
  title,
  subtitle,
  leftIcon: LeftIcon,
  rightSlot,
  onClose,
}: SheetHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {LeftIcon && (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-2">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {rightSlot && <div className="hidden sm:flex items-center gap-2">{rightSlot}</div>}
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            aria-label="Fermer"
          >
            <span className="sr-only">Fermer</span>
            <span className="text-base">×</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* --------- CARDS GÉNÉRIQUES --------- */

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card blanche de base (bloc d'info).
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={
        'bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 ' + className
      }
    >
      {children}
    </div>
  );
}

/**
 * Card avec fond légèrement coloré (par exemple pour les notes, warnings…)
 */
export function SoftCard({ children, className = '' }: CardProps) {
  return (
    <div
      className={
        'rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5 shadow-sm ' +
        className
      }
    >
      {children}
    </div>
  );
}

/* --------- PASTILLES / PILL BADGES --------- */

type PillVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'dark';

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}

/**
 * Pastille type Apple (statut, tags, plateforme…)
 */
export function Pill({ children, variant = 'neutral', className = '' }: PillProps) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ';

  const variants: Record<PillVariant, string> = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border border-blue-100',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    dark: 'bg-slate-900 text-white border border-slate-900/80',
  };

  return <span className={base + variants[variant] + ' ' + className}>{children}</span>;
}

/* --------- ICÔNES DANS CERCLE --------- */

interface IconCircleProps {
  icon: LucideIcon;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft' | 'success' | 'warning';
}

/**
 * Cercle icône (comme dans les lignes prix / frais).
 */
export function IconCircle({
  icon: Icon,
  size = 'md',
  variant = 'soft',
}: IconCircleProps) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const variantClasses: Record<string, string> = {
    solid: 'bg-slate-900 text-white',
    soft: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <div
      className={
        sizeClasses + ' rounded-2xl flex items-center justify-center ' + variantClasses[variant]
      }
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
    </div>
  );
}

/* --------- LIGNES "ICÔNE + TEXTE + VALEUR" --------- */

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  value: ReactNode;
  valueClassName?: string;
  separator?: boolean;
}

/**
 * Ligne type "Prix de vente / Frais / Bénéfice".
 */
export function InfoRow({
  icon,
  title,
  description,
  value,
  valueClassName = '',
  separator = true,
}: InfoRowProps) {
  return (
    <div
      className={
        'flex items-center justify-between py-3 ' +
        (separator ? 'border-b border-slate-100' : '')
      }
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <IconCircle icon={icon} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          {description && (
            <p className="text-xs text-slate-500 truncate">{description}</p>
          )}
        </div>
      </div>
      <div className={'ml-2 flex-shrink-0 text-sm sm:text-base font-semibold ' + valueClassName}>
        {value}
      </div>
    </div>
  );
}

/* --------- CARD GRADIENT POUR STAT CLÉ (ex : BÉNÉFICE NET) --------- */

interface GradientStatCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

/**
 * Bloc stat mis en avant (ex : bénéfice net).
 */
export function GradientStatCard({
  label,
  value,
  sublabel,
}: GradientStatCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-3 sm:px-5 sm:py-4 text-right shadow-md">
      <p className="text-[11px] uppercase tracking-wide text-emerald-100 font-semibold">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-[11px] text-emerald-100/90">{sublabel}</p>
      )}
    </div>
  );
}

/* --------- BOUTONS --------- */

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

/**
 * Bouton principal (CTA).
 */
export function PrimaryButton({
  children,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={
        'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-[15px] font-semibold shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 ' +
        className
      }
    >
      {children}
    </button>
  );
}

/**
 * Bouton secondaire (ghost).
 */
export function GhostButton({
  children,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={
        'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 text-slate-700 px-3.5 sm:px-4 py-2 text-sm font-medium hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 ' +
        className
      }
    >
      {children}
    </button>
  );
}

/**
 * Petit bouton icône (ex : close, options…)
 */
interface IconButtonProps {
  icon: LucideIcon;
  ariaLabel: string;
  onClick?: () => void;
}

export function IconButton({ icon: Icon, ariaLabel, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
    >
      <Icon className="w-4.5 h-4.5" />
    </button>
  );
}
