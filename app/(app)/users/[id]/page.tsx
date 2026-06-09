import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import UserActions from "@/app/components/UserActions";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary",
  ADMIN: "bg-available/10 text-available",
  MEMBER: "bg-surface-raised text-muted",
};
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEMBER: "Membre",
};

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      groupId: true,
      city: true,
      birthday: true,
      phone: true,
      instagram: true,
      snapchat: true,
      tiktok: true,
      linkedin: true,
      isResident: true,
      memberColor: true,
      onboardedAt: true,
      createdAt: true,
      group: { select: { name: true } },
      _count: {
        select: { presences: true, eventsHosted: true, eventRsvps: true },
      },
    },
  });
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [user, groupList] = await Promise.all([
    getUser(params.id),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!user) notFound();

  const socials = [
    { label: "Instagram", value: user.instagram },
    { label: "Snapchat", value: user.snapchat },
    { label: "TikTok", value: user.tiktok },
    { label: "LinkedIn", value: user.linkedin },
  ].filter((s) => s.value);

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="text-sm font-semibold text-muted hover:text-fg"
      >
        ← Tous les utilisateurs
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-fg">{user.name}</h1>
            <span className={`badge ${ROLE_BADGE[user.role] ?? ""}`}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
            {user.isActive ? (
              <span className="badge bg-available/10 text-available">Actif</span>
            ) : (
              <span className="badge bg-surface-raised text-subtle">Inactif</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
      </header>

      {/* Activité */}
      <section className="grid grid-cols-3 gap-4">
        <Stat label="Présences" value={user._count.presences} />
        <Stat label="Sorties organisées" value={user._count.eventsHosted} />
        <Stat label="RSVP" value={user._count.eventRsvps} />
      </section>

      {/* Groupe & actions */}
      <section className="card">
        <h2 className="font-bold text-fg">Groupe &amp; rôle</h2>
        <p className="mt-1 text-sm text-muted">
          {user.groupId ? (
            <>
              Membre de{" "}
              <Link
                href={`/groups/${user.groupId}`}
                className="font-semibold text-primary hover:underline"
              >
                {user.group?.name}
              </Link>{" "}
              · couleur membre #{user.memberColor}
            </>
          ) : (
            <span className="font-semibold text-busy">
              Compte orphelin (aucun groupe)
            </span>
          )}
        </p>
        <div className="mt-4">
          <UserActions
            userId={user.id}
            role={user.role}
            isActive={user.isActive}
            groupId={user.groupId}
            groups={groupList}
          />
        </div>
      </section>

      {/* Profil */}
      <section className="card">
        <h2 className="font-bold text-fg">Profil</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Field label="Ville" value={user.city} />
          <Field label="Anniversaire" value={formatDate(user.birthday)} />
          <Field label="Téléphone" value={user.phone} />
          <Field
            label="Résident du quartier"
            value={user.isResident ? "Oui" : "Non"}
          />
          <Field label="Inscrit le" value={formatDate(user.createdAt)} />
          <Field
            label="Onboarding"
            value={user.onboardedAt ? `complété le ${formatDate(user.onboardedAt)}` : "non complété"}
          />
        </dl>

        {socials.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Réseaux
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li
                  key={s.label}
                  className="badge bg-surface-raised text-muted"
                >
                  {s.label} : @{s.value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-extrabold text-fg">{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-subtle">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-fg">{value || "—"}</dd>
    </div>
  );
}
