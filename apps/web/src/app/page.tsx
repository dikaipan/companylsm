import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, Play, Star, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations('home');

  const features = [
    {
      icon: BookOpen,
      titleKey: "internalModules",
      descKey: "internalModulesDesc"
    },
    {
      icon: CheckCircle,
      titleKey: "skillAssessment",
      descKey: "skillAssessmentDesc"
    },
    {
      icon: Users,
      titleKey: "knowledgeSharing",
      descKey: "knowledgeSharingDesc"
    },
    {
      icon: Star,
      titleKey: "certifications",
      descKey: "certificationsDesc"
    },
    {
      icon: Play,
      titleKey: "videoArchive",
      descKey: "videoArchiveDesc"
    },
    {
      icon: ArrowRight,
      titleKey: "developmentPlan",
      descKey: "developmentPlanDesc"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans bg-background text-foreground">
      {/* Navbar with Glassmorphism */}
      <main className="flex-1">
        {/* Hero Section with Gradients */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--color-primary)_0%,transparent_100%)] opacity-10" />
          <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {t('heroTitle')} <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{t('heroHighlight')}</span>
              </h1>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent opacity-90 pb-1 leading-relaxed">
                {t('heroSubtitle')}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                {t('heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/courses"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105"
                >
                  {t('startLearning')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 bg-muted/30 rounded-3xl my-10 border border-white/5">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('platformFeatures')}</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              {t('platformFeaturesDesc')}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border bg-background p-8 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-bold">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 shadow-2xl sm:px-16 md:pt-20 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
              <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-24 lg:text-left relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                  {t('readyToUpskill')}
                  <br />
                  {t('loginToDashboard')}
                </h2>
                <p className="mt-6 text-lg leading-8 text-primary-foreground/80">
                  {t('accessTraining')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                  <Link
                    href="/login"
                    className="rounded-md bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-sm hover:bg-primary-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t('employeeLogin')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('footerLearning')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">{t('footerCatalog')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('footerMyProgress')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('footerSupport')}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">{t('footerItHelpdesk')}</Link></li>
                <li><Link href="#" className="hover:text-primary">{t('footerHrPortal')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {t('footerCopyright')}</p>
          </div>
        </div>
      </footer>

    </div >
  );
}

