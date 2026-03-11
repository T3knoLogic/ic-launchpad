export const idlFactory = ({ IDL }) => {
  const LinkedAccount = IDL.Record({
    external_id: IDL.Text,
    provider: IDL.Text,
    username: IDL.Text,
  });
  const Result = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  return IDL.Service({
    link: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result], []),
    list_mine: IDL.Func([], [IDL.Vec(LinkedAccount)], ["query"]),
    unlink: IDL.Func([IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => [];
