// Métadonnées d'affichage des types de sortie — module neutre (importable côté
// serveur ET client). Couleurs cohérentes avec le-rond-point.
export const EVENT_TYPE_META: Record<string, { label: string; badge: string }> = {
  BAR: { label: "🍻 Bar", badge: "bg-busy/10 text-busy" },
  RESTO: { label: "🍕 Resto", badge: "bg-destructive/10 text-destructive" },
  SOIREE: { label: "🏡 Soirée", badge: "bg-[#A855F7]/10 text-[#A855F7]" },
  SORTIE: { label: "🏕️ Sortie", badge: "bg-available/10 text-available" },
};
