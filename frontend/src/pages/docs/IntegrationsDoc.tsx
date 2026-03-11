import { H1, H2, P, Ul, InlineCode, Code, A } from "../../components/DocBlock";

export default function DocIntegrations() {
  return (
    <>
      <H1>Integrations (connected accounts)</H1>
      <P>
        Link external accounts (Google, X, Instagram, TikTok, YouTube, Discord, GitHub, Twitch, LinkedIn) to your Launchpad identity. Use them later for deploy notifications, cross-posting, or API access from your canisters.
      </P>

      <H2>Setup</H2>
      <P>After <InlineCode>dfx deploy</InlineCode>, add to <InlineCode>frontend/.env</InlineCode>:</P>
      <Code>{"VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID=<canister id>"}</Code>
      <P>The <InlineCode>run-local.sh</InlineCode> script writes this automatically for local.</P>

      <H2>Connect with Google</H2>
      <Ul>
        <li>Create a OAuth 2.0 Client ID at <A href="https://console.cloud.google.com/apis/credentials">Google Cloud Console</A> (Web application, add your origin and redirect URIs).</li>
        <li>Set <InlineCode>VITE_GOOGLE_CLIENT_ID=your-client-id</InlineCode> in <InlineCode>frontend/.env</InlineCode>.</li>
        <li>The app loads Google Identity Services from <InlineCode>index.html</InlineCode>; on the Integrations page, click Connect next to Google.</li>
      </Ul>

      <H2>Other providers</H2>
      <P>X, Instagram, TikTok, YouTube, Discord, GitHub, Twitch, and LinkedIn require an OAuth app in each provider’s developer portal and a small backend (or serverless function) to exchange the auth code for tokens and pass the user id/name to the Launchpad integrations canister. See <InlineCode>RECOMMENDATIONS.md</InlineCode> in the repo for details.</P>
    </>
  );
}
