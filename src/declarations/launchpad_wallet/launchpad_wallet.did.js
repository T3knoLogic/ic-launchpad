export const idlFactory = ({ IDL }) => {
  const CreateResult = IDL.Variant({ 'ok' : IDL.Principal, 'err' : IDL.Text });
  const TopUpResult = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  return IDL.Service({
    'create_canister_with_cycles' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Vec(IDL.Principal))],
        [CreateResult],
        [],
      ),
    'deposit' : IDL.Func([], [IDL.Record({ 'accepted' : IDL.Nat })], []),
    'get_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'top_up' : IDL.Func([IDL.Principal, IDL.Nat], [TopUpResult], []),
    'wallet_receive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
