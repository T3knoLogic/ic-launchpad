export const idlFactory = ({ IDL }) => {
  const CanisterInfo = IDL.Record({
    'id' : IDL.Principal,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'network' : IDL.Text,
    'created_at' : IDL.Int,
  });
  return IDL.Service({
    'get' : IDL.Func([IDL.Principal], [IDL.Opt(CanisterInfo)], ['query']),
    'list_all' : IDL.Func([], [IDL.Vec(CanisterInfo)], ['query']),
    'list_mine' : IDL.Func([], [IDL.Vec(CanisterInfo)], ['query']),
    'register' : IDL.Func(
        [IDL.Principal, IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
    'unregister' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
    'update_name' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
