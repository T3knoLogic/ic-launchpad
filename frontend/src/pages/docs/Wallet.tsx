import { H1, H2, H3, P, Ul, Code, InlineCode, Table, Th, Td, A } from "../../components/DocBlock";

export default function DocWallet() {
  return (
    <>
      <H1>Wallet</H1>
      <P>The Launchpad Wallet is a Motoko canister that holds cycles and can create canisters or top up existing ones. Only controllers of the wallet canister can call create and top-up.</P>

      <H2>What it does</H2>
      <Ul>
        <li><strong>Hold cycles</strong> — Accept cycles via <InlineCode>wallet_receive</InlineCode> or <InlineCode>deposit()</InlineCode> (attach cycles to the call).</li>
        <li><strong>Create canisters</strong> — <InlineCode>create_canister_with_cycles(amount, controllers?)</InlineCode> creates an empty canister with the given cycles and optional controller list.</li>
        <li><strong>Top up canisters</strong> — <InlineCode>top_up(canister_id, amount)</InlineCode> sends cycles from the wallet to any canister.</li>
      </Ul>

      <H2>Web UI</H2>
      <P>In the app, open <strong>Wallet</strong> to see the wallet’s cycle balance and a link to the official cycles conversion guide. Use <strong>Canisters</strong> to top up a canister by ID and amount.</P>

      <H2>Adding cycles</H2>
      <P>Cycles can be sent to the wallet in two ways:</P>
      <Ul>
        <li>Call <InlineCode>wallet_receive</InlineCode> (e.g. from the dfx cycles wallet or another canister that sends cycles).</li>
        <li>Call <InlineCode>deposit()</InlineCode> with cycles attached from your dfx identity.</li>
      </Ul>
      <P>To get cycles on mainnet, convert ICP first: <InlineCode>dfx cycles convert --amount &lt;ICP&gt; --network ic</InlineCode>, then send those cycles to this wallet.</P>

      <H2>Reference</H2>
      <table className="w-full text-sm text-left border border-ic-border rounded-lg overflow-hidden">
        <thead>
          <tr>
            <Th>Method</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          <tr><Td><InlineCode>get_balance</InlineCode></Td><Td>Returns current cycle balance (query).</Td></tr>
          <tr><Td><InlineCode>wallet_receive</InlineCode></Td><Td>Accepts cycles; returns <InlineCode>{`{ accepted: Nat64 }`}</InlineCode>.</Td></tr>
          <tr><Td><InlineCode>deposit</InlineCode></Td><Td>Accepts cycles attached to the call; returns <InlineCode>{`{ accepted: Nat }`}</InlineCode>.</Td></tr>
          <tr><Td><InlineCode>create_canister_with_cycles(amount, controllers?)</InlineCode></Td><Td>Creates canister with given cycles; controllers default to caller + self.</Td></tr>
          <tr><Td><InlineCode>top_up(canister_id, amount)</InlineCode></Td><Td>Transfers cycles to the given canister.</Td></tr>
          <tr><Td><InlineCode>whoami</InlineCode></Td><Td>Returns this canister’s principal (query).</Td></tr>
        </tbody>
      </table>
    </>
  );
}
