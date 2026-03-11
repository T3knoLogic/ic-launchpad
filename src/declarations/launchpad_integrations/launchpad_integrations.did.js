export const idlFactory = ({ IDL }) => {
  const LinkedAccount = IDL.Record({
    'username' : IDL.Text,
    'provider' : IDL.Text,
    'external_id' : IDL.Text,
  });
  return IDL.Service({
    'link' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
    'list_mine' : IDL.Func([], [IDL.Vec(LinkedAccount)], ['query']),
    'unlink' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
