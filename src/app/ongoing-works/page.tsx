import { MajorProjectsDashboard } from "@/components/major-projects/MajorProjectsDashboard";

export const metadata = {
  title: "Ongoing Works | TN National Highways Department",
  description: "Capital highway works, stage monitoring, and review portal for Tamil Nadu National Highways",
};

export default function OngoingWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MajorProjectsDashboard />
      </main>
    </div>
  );
}
