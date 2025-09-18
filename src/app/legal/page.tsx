
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LegalPage({ hidePadding = false }: { hidePadding?: boolean }) {
  const [activeTab, setActiveTab] = useState('terms');

  return (
    <div className={cn(!hidePadding && 'container max-w-4xl py-12')}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="cookies">Cookie Policy</TabsTrigger>
          </TabsList>
        </div>
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue placeholder="Select a policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="terms">Terms of Service</SelectItem>
              <SelectItem value="privacy">Privacy Policy</SelectItem>
              <SelectItem value="cookies">Cookie Policy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>CoinSphere – Terms of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose dark:prose-invert max-w-none">
                <p>
                  Welcome to CoinSphere. By accessing or using our platform, you agree to comply with these Terms of
                  Service. Please read them carefully.
                </p>
                <h3>1. Eligibility</h3>
                <ul>
                  <li>You must be at least 18 years old (or the age of majority in your jurisdiction) to use CoinSphere.</li>
                  <li>By creating an account, you confirm that the information you provide is accurate and complete.</li>
                </ul>
                <h3>2. Accounts</h3>
                <ul>
                  <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                  <li>You agree to notify us immediately if you suspect unauthorized access to your account.</li>
                </ul>
                <h3>3. Platform Use</h3>
                <ul>
                  <li>
                    CoinSphere provides market data, tools, and insights for educational and informational purposes only.
                  </li>
                  <li>
                    We do not provide investment, financial, or legal advice. Trading cryptocurrencies involves risks, and
                    you are solely responsible for your decisions.
                  </li>
                </ul>
                <h3>4. Prohibited Activities</h3>
                <p>You may not use the platform to:</p>
                <ul>
                  <li>Engage in unlawful, fraudulent, or abusive activities.</li>
                  <li>Attempt to gain unauthorized access to our systems.</li>
                  <li>Interfere with platform security or disrupt services.</li>
                </ul>
                <h3>5. Intellectual Property</h3>
                <ul>
                  <li>
                    All content, branding, and tools on CoinSphere are owned by us or licensed to us. You may not
                    reproduce, distribute, or create derivative works without our consent.
                  </li>
                </ul>
                <h3>6. Disclaimer of Warranties</h3>
                <ul>
                  <li>CoinSphere is provided “as is” without warranties of any kind.</li>
                  <li>We do not guarantee uninterrupted service, real-time data accuracy, or error-free operation.</li>
                </ul>
                <h3>7. Limitation of Liability</h3>
                <ul>
                  <li>
                    To the maximum extent permitted by law, CoinSphere shall not be liable for any direct, indirect, or
                    incidental damages resulting from your use of the platform.
                  </li>
                </ul>
                <h3>8. Termination</h3>
                <ul>
                  <li>We may suspend or terminate your account if you violate these Terms.</li>
                </ul>
                <h3>9. Changes to Terms</h3>
                <ul>
                  <li>
                    We may update these Terms at any time. Continued use of the platform after updates means you accept
                    the new Terms.
                  </li>
                </ul>
              </article>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>CoinSphere – Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose dark:prose-invert max-w-none">
                <p>
                  At CoinSphere, we respect your privacy and are committed to protecting your personal data.
                </p>
                <h3>1. Information We Collect</h3>
                <ul>
                  <li>
                    <strong>Account Information:</strong> Full name, email address, password (encrypted).
                  </li>
                  <li>
                    <strong>Usage Data:</strong> IP address, browser type, device information, and activity logs.
                  </li>
                  <li>
                    <strong>Cookies:</strong> To improve user experience and analyze site performance.
                  </li>
                </ul>
                <h3>2. How We Use Your Data</h3>
                <ul>
                  <li>To provide and improve our services.</li>
                  <li>To personalize your dashboard and preferences.</li>
                  <li>To send account-related communications (such as login alerts, updates).</li>
                  <li>To ensure security and prevent fraud.</li>
                </ul>
                <h3>3. Data Sharing</h3>
                <p>We do not sell your personal data. We may share it only with:</p>
                <ul>
                  <li>Service providers (hosting, analytics, authentication).</li>
                  <li>Authorities if required by law.</li>
                </ul>
                <h3>4. Data Retention</h3>
                <ul>
                  <li>We retain your data as long as necessary for providing services or as required by law.</li>
                </ul>
                <h3>5. Security</h3>
                <ul>
                  <li>We implement encryption, access controls, and monitoring to safeguard your information.</li>
                </ul>
                <h3>6. Your Rights</h3>
                <ul>
                  <li>
                    Depending on your jurisdiction (e.g., GDPR, CCPA), you may have the right to access, update, delete,
                    or restrict processing of your data.
                  </li>
                </ul>
                <h3>7. International Transfers</h3>
                <ul>
                  <li>
                    Your data may be transferred outside your country. We take measures to ensure it is protected under
                    applicable laws.
                  </li>
                </ul>
                <h3>8. Changes to This Policy</h3>
                <ul>
                  <li>We may update this Privacy Policy and will notify you by posting the updated version.</li>
                </ul>
                <h3>9. Contact</h3>
                <ul>
                  <li>
                    For privacy concerns, please contact support by creating a ticket on our <Link href="/support">support page</Link>.
                  </li>
                </ul>
              </article>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cookies">
          <Card>
            <CardHeader>
              <CardTitle>CoinSphere – Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose dark:prose-invert max-w-none">
                <p>CoinSphere uses cookies and similar technologies to enhance your experience.</p>
                <h3>1. What Are Cookies?</h3>
                <p>
                  Cookies are small text files stored on your device to improve website performance and functionality.
                </p>
                <h3>2. How We Use Cookies</h3>
                <ul>
                  <li>
                    <strong>Essential Cookies:</strong> Required for login, account security, and site functionality.
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand usage and improve our services.
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> Save your theme, language, and dashboard settings.
                  </li>
                </ul>
                <h3>3. Third-Party Cookies</h3>
                <p>
                  Some cookies may come from third-party services such as analytics or authentication providers.
                </p>
                <h3>4. Managing Cookies</h3>
                <p>
                  You can manage or disable cookies in your browser settings. Note that some features may not function
                  properly if you disable essential cookies.
                </p>
                <h3>5. Updates to This Policy</h3>
                <p>We may update our Cookie Policy. Updates will be posted here.</p>
              </article>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
