import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
            <ShieldCheck className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Terms of Service</h1>
          </div>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <CardTitle className="text-xl">Agreement to Terms</CardTitle>
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
                    Welcome to KRATOS ("we," "our," or "us"). By accessing or using our mobile application, website, and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">2. Medical Disclaimer</h3>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-4 mb-4">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                      IMPORTANT: The Service is for informational purposes only and is not intended as medical advice.
                    </p>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    You should consult your physician or other health care professional before starting this or any other fitness program to determine if it is right for your needs. Do not rely on the Service for medical advice or diagnosis. If you experience faintness, dizziness, pain, or shortness of breath at any time while exercising, you should stop immediately and seek medical attention.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">3. User Accounts</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-3">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">4. User Content</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-3">
                    Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">5. Prohibited Conduct</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-2">
                    You agree not to use the Service:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-300 text-sm">
                    <li>In any way that violates any applicable national or international law or regulation.</li>
                    <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                    <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                    <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">6. Intellectual Property</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of KRATOS and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of KRATOS.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">7. Termination</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">8. Limitation of Liability</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    In no event shall KRATOS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">9. Changes</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">10. Contact Us</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                    If you have any questions about these Terms, please contact us at support@kratos.app.
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
