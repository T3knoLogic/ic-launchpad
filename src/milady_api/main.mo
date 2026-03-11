/**
 * Milady API canister — Serves /api/status, /api/agent/start|stop, /api/chat on ICP.
 * Compatible with the Milady frontend Agent plugin.
 * Init: (opt text) for optional GROQ_API_KEY.
 */
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Char "mo:base/Char";
import IC "ic:aaaaa-aa";

persistent actor MiladyApi {
  type HeaderField = (Text, Text);

  type HttpRequest = {
    method : Text;
    url : Text;
    headers : [HeaderField];
    body : Blob;
  };

  type HttpResponse = {
    status_code : Nat16;
    headers : [HeaderField];
    body : Blob;
    streaming_strategy : ?{
      #Callback : {
        token : {};
        callback : shared () -> async ?{ token : {}; body : Blob };
      };
    };
    upgrade : ?Bool;
  };

  private func findPos(haystack : Text, needle : Text) : ?Nat {
    let parts = Iter.toArray(Text.split(haystack, #text needle));
    if (parts.size() < 2) { null } else { ?Text.size(parts[0]) };
  };

  private func subText(t : Text, from : Nat, len : Nat) : Text {
    let arr = Text.toArray(t);
    let size = arr.size();
    if (from >= size) { return "" };
    let take = Nat.min(len, size - from);
    Text.fromArray(Array.tabulate(take, func (i) { arr[from + i] }));
  };

  private transient let wsPattern : Text.Pattern = #predicate (func (c) {
    let n = Char.toNat32(c);
    n == 32 or n == 9 or n == 10 or n == 13
  });

  private transient var agent_state : Text = "running";
  private transient var started_at : ?Int = ?Time.now();
  private transient var groq_api_key_opt : ?Text = null;
  private transient let agent_name : Text = "Milady";
  private transient let groq_model : Text = "llama-3.3-70b-versatile";

  private func corsHeaders() : [HeaderField] {
    [
      ("Access-Control-Allow-Origin", "*"),
      ("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"),
      ("Access-Control-Allow-Headers", "Content-Type, Authorization, x-milady-client-id"),
      ("Content-Type", "application/json"),
    ];
  };

  private func jsonResponse(status : Nat16, body : Text) : HttpResponse {
    {
      status_code = status;
      headers = corsHeaders();
      body = Text.encodeUtf8(body);
      streaming_strategy = null;
      upgrade = null;
    };
  };

  private func upgradeResponse() : HttpResponse {
    {
      status_code = 200;
      headers = corsHeaders();
      body = Blob.fromArray([]);
      streaming_strategy = null;
      upgrade = ?true;
    };
  };

  private func extractPath(url : Text) : Text {
    switch (findPos(url, "/api")) {
      case (?pos) { subText(url, pos, Text.size(url) - pos) };
      case null {
        if (Text.startsWith(url, #text "/")) { url } else { "/" };
      };
    };
  };

  private func methodIs(m : Text, want : Text) : Bool {
    Text.toUppercase(m) == Text.toUppercase(want);
  };

  public query func http_request(req : HttpRequest) : async HttpResponse {
    let path = extractPath(req.url);
    let method = Text.trim(req.method, wsPattern);

    if (methodIs(method, "OPTIONS")) {
      return jsonResponse(204, "{}");
    };

    if (methodIs(method, "GET") and path == "/api/status") {
      let uptime = switch (started_at) {
        case (?t) { Int.toText(Time.now() - t) };
        case null { "0" };
      };
      let startedJson = switch (started_at) {
        case (?t) { Int.toText(t) };
        case null { "null" };
      };
      let model = switch (groq_api_key_opt) {
        case (?_) { groq_model };
        case null { "echo" };
      };
      let body = "{\"state\":\"" # agent_state # "\",\"agentName\":\"" # agent_name # "\",\"model\":\"" # model # "\",\"uptime\":" # uptime # ",\"startedAt\":" # startedJson # ",\"port\":null,\"error\":null}";
      return jsonResponse(200, body);
    };

    if (methodIs(method, "GET") and path == "/api/auth/status") {
      return jsonResponse(200, "{\"required\":false,\"pairingEnabled\":false,\"expiresAt\":null}");
    };

    if (methodIs(method, "GET") and path == "/api/onboarding/status") {
      return jsonResponse(200, "{\"complete\":true}");
    };

    if (methodIs(method, "GET") and path == "/api/onboarding/options") {
      let opts = "{\"character\":{\"name\":\"Milady\",\"bio\":[\"An autonomous AI agent.\"],\"adjectives\":[],\"topics\":[]},\"presets\":[]}";
      return jsonResponse(200, opts);
    };

    if (Text.startsWith(path, #text "/api/")) {
      return upgradeResponse();
    };

    jsonResponse(404, "{\"error\":\"Not found\"}");
  };

  public func http_request_update(req : HttpRequest) : async HttpResponse {
    let path = extractPath(req.url);
    let method = Text.trim(req.method, wsPattern);

    if (methodIs(method, "OPTIONS")) {
      return jsonResponse(204, "{}");
    };

    if (methodIs(method, "POST") and path == "/api/agent/start") {
      agent_state := "running";
      started_at := ?Time.now();
      let model = switch (groq_api_key_opt) {
        case (?_) { groq_model };
        case null { "echo" };
      };
      let body = "{\"ok\":true,\"status\":{\"state\":\"running\",\"agentName\":\"" # agent_name # "\",\"model\":\"" # model # "\",\"uptime\":0,\"startedAt\":" # Int.toText(Time.now()) # "}}";
      return jsonResponse(200, body);
    };

    if (methodIs(method, "POST") and path == "/api/agent/stop") {
      agent_state := "stopped";
      started_at := null;
      let body = "{\"ok\":true,\"status\":{\"state\":\"stopped\",\"agentName\":\"" # agent_name # "\"}}";
      return jsonResponse(200, body);
    };

    if (methodIs(method, "POST") and path == "/api/chat") {
      let bodyText = switch (Text.decodeUtf8(req.body)) {
        case null { "{}" };
        case (?t) { t };
      };
      var userText = "hello";
      switch (findPos(bodyText, "\"text\":\"")) {
        case (?pos) {
          let start = pos + 8;
          let rest = subText(bodyText, start, Text.size(bodyText) - start);
          switch (findPos(rest, "\"")) {
            case (?endPos) { userText := subText(rest, 0, endPos) };
            case null { userText := rest };
          };
        };
        case null { };
      };

      switch (groq_api_key_opt) {
        case (?key) {
          switch (await callGroq(userText, key)) {
            case (#ok reply) {
              let out = "{\"text\":" # escapeForJson(reply) # ",\"agentName\":\"" # agent_name # "\"}";
              return jsonResponse(200, out);
            };
            case (#err _) {
              let out = "{\"text\":\"AI temporarily unavailable\",\"agentName\":\"" # agent_name # "\"}";
              return jsonResponse(503, out);
            };
          };
        };
        case null {
          let reply = "[Echo] You said: " # userText # ". Add GROQ_API_KEY for real AI.";
          let out = "{\"text\":" # escapeForJson(reply) # ",\"agentName\":\"" # agent_name # "\"}";
          return jsonResponse(200, out);
        };
      };
    };

    if (methodIs(method, "GET") and path == "/api/status") {
      let uptime = switch (started_at) {
        case (?t) { Int.toText(Time.now() - t) };
        case null { "0" };
      };
      let startedJson = switch (started_at) {
        case (?t) { Int.toText(t) };
        case null { "null" };
      };
      let model = switch (groq_api_key_opt) {
        case (?_) { groq_model };
        case null { "echo" };
      };
      let body = "{\"state\":\"" # agent_state # "\",\"agentName\":\"" # agent_name # "\",\"model\":\"" # model # "\",\"uptime\":" # uptime # ",\"startedAt\":" # startedJson # ",\"port\":null,\"error\":null}";
      return jsonResponse(200, body);
    };

    if (methodIs(method, "GET") and path == "/api/auth/status") {
      return jsonResponse(200, "{\"required\":false,\"pairingEnabled\":false,\"expiresAt\":null}");
    };

    if (methodIs(method, "GET") and path == "/api/onboarding/status") {
      return jsonResponse(200, "{\"complete\":true}");
    };

    if (methodIs(method, "GET") and path == "/api/onboarding/options") {
      let opts = "{\"character\":{\"name\":\"Milady\",\"bio\":[\"An autonomous AI agent.\"],\"adjectives\":[],\"topics\":[]},\"presets\":[]}";
      return jsonResponse(200, opts);
    };

    jsonResponse(404, "{\"error\":\"Not found\"}");
  };

  /// Set Groq API key (opt). Pass null to use echo mode.
  public shared func set_groq_key(key : ?Text) : async () {
    groq_api_key_opt := key;
  };

  private func escapeForJson(s : Text) : Text {
    var out = "\"";
    for (c in Text.toIter(s)) {
      let n = Char.toNat32(c);
      if (n == 34) { out := out # Text.fromChar(Char.fromNat32(0x5C)) # Text.fromChar(Char.fromNat32(34)) }
      else if (n == 0x5C) { out := out # Text.fromChar(Char.fromNat32(0x5C)) # Text.fromChar(Char.fromNat32(0x5C)) }
      else if (n == 10) { out := out # Text.fromChar(Char.fromNat32(0x5C)) # "n" }
      else if (n == 13) { out := out # Text.fromChar(Char.fromNat32(0x5C)) # "r" }
      else if (n == 9) { out := out # Text.fromChar(Char.fromNat32(0x5C)) # "t" }
      else { out := out # Text.fromChar(c) };
    };
    out # "\"";
  };

  private func callGroq(userText : Text, apiKey : Text) : async { #ok : Text; #err : Text } {
    let sysContent = "You are " # agent_name # ", a helpful AI. Keep responses concise.";
    let bodyJson = "{\"model\":\"" # groq_model # "\",\"messages\":[{\"role\":\"system\",\"content\":" # escapeForJson(sysContent) # "},{\"role\":\"user\",\"content\":" # escapeForJson(userText) # "}],\"max_tokens\":1024,\"temperature\":0.7}";
    let request : IC.http_request_args = {
      url = "https://api.groq.com/openai/v1/chat/completions";
      method = #post;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
      ];
      body = ?Text.encodeUtf8(bodyJson);
      max_response_bytes = ?4096;
      transform = null;
      is_replicated = null;
    };

    Cycles.add<system>(400_000_000_000);

    try {
      let response = await IC.http_request(request);
      if (response.status >= 200 and response.status < 300) {
        let body = switch (Text.decodeUtf8(response.body)) {
          case (?t) { t };
          case null { return #err "Invalid response" };
        };
        let contentKey = "\"content\":\"";
        switch (findPos(body, contentKey)) {
          case (?pos) {
            let start = pos + Text.size(contentKey);
            let rest = subText(body, start, Text.size(body) - start);
            var content = "";
            var escaping = false;
            for (c in Text.toIter(rest)) {
              let n = Char.toNat32(c);
              if (escaping) {
                if (n == 110) { content := content # Text.fromChar(Char.fromNat32(10)) }
                else if (n == 116) { content := content # Text.fromChar(Char.fromNat32(9)) }
                else if (n == 114) { content := content # Text.fromChar(Char.fromNat32(13)) }
                else if (n == 34) { content := content # Text.fromChar(Char.fromNat32(34)) }
                else { content := content # Text.fromChar(c) };
                escaping := false;
              } else if (n == 0x5C) {
                escaping := true;
              } else if (n == 34) {
                return #ok(content);
              } else {
                content := content # Text.fromChar(c);
              };
            };
            #ok(content);
          };
          case null { #ok("(No response)") };
        };
      } else {
        #err("Groq error: " # Nat.toText(response.status));
      };
    } catch (_) {
      #err("Outcall failed");
    };
  };
};
