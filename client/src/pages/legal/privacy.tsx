import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Lock } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Privacy Policy</h1>
          </div>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <CardTitle className="text-xl">Privacy Policy</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Last Updated: December 9, 2025
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-250px)] p-6">
              <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">1. Introduction</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    KRATOS ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit the KRATOS mobile application (our "App") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">2. Information We Collect</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-3">
                    We collect several types of information from and about users of our App, including information:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-300 text-sm">
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Personal Information:</span> Name, email address, and other identifiers by which you may be contacted online or offline.
                    </li>
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Health and Fitness Data:</span> Workout logs, body measurements, dietary information, and progress photos that you choose to upload.
                    </li>
                    <li>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Device Information:</span> Information about your mobile device and internet connection, including the device's unique device identifier, IP address, operating system, browser type, and mobile network information.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">3. How We Use Your Information</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-2">
                    We use information that we collect about you or that you provide to us, including any personal information:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-300 text-sm">
                    <li>To provide you with the App and its contents, and any other information, products, or services that you request from us.</li>
                    <li>To provide personalized workout and nutrition recommendations (including through our AI features).</li>
                    <li>To fulfill any other purpose for which you provide it.</li>
                    <li>To notify you about changes to our App or any products or services we offer or provide though it.</li>
                    <li>To allow you to participate in interactive features on our App.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">4. Disclosure of Your Information</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-3">
                    We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    We may also release information when it's release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property or safety.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">5. Data Security</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls. The safety and security of your information also depends on you. Where we have given you (or where you have chosen) a password for access to certain parts of our App, you are responsible for keeping this password confidential.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">6. Children Under the Age of 13</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    Our App is not intended for children under 13 years of age. No one under age 13 may provide any information to or on the App. We do not knowingly collect personal information from children under 13. If you are under 13, do not use or provide any information on this App.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">7. Changes to Our Privacy Policy</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users' personal information, we will notify you through a notice on the App home page. The date the privacy policy was last revised is identified at the top of the page.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">8. Contact Information</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@kratos.app.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
