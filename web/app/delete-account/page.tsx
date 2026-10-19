import type { Metadata } from "next";
import BracketLabel from "@/components/hud/BracketLabel";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "How to delete your VALSYNC account and referral data.",
  alternates: { canonical: "/delete-account.html" },
};

export default function DeleteAccountPage() {
  return (
    <main id="content" className="legal-page">
      <section className="legal-head">
        <div className="container">
          <BracketLabel tone="red">Account deletion</BracketLabel>
          <h1 className="t-display-lg" style={{ marginTop: 16 }}>Delete your VALSYNC account</h1>
        </div>
      </section>
      <section className="legal-body">
        <div className="container legal-grid">
          <article className="legal-article">
            <h2 className="legal-h">In the app</h2>
            <p className="legal-p">Open Settings → Invite friends → Delete VALSYNC account. Enter your password to confirm.</p>
            <h2 className="legal-h">If you cannot access the app</h2>
            <p className="legal-p">Email <a href="mailto:abdullaheltiby@tutamail.com?subject=VALSYNC%20account%20deletion">abdullaheltiby@tutamail.com</a> from your VALSYNC account email and ask us to delete it. We may ask you to verify ownership.</p>
            <h2 className="legal-h">What deletion removes</h2>
            <p className="legal-p">Deletion removes your VALSYNC sign-in, named invite records, and referral progress. If you joined through someone else&apos;s link, your account no longer counts toward their joined total. Anonymous analytics already received are separate from your account. See our <a href="privacy.html">Privacy Policy</a> for other data and deletion requests.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
