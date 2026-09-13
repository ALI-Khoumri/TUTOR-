const zlib = require('zlib');
const https = require('https');
const fs = require('fs');

function encode64(data) {
  let r = "";
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
}

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function plantumlEncode(text) {
  const deflated = zlib.deflateRawSync(Buffer.from(text, 'utf8'), { level: 9 });
  return encode64(deflated);
}

const puml = `@startuml seq_auth
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 4
skinparam maxMessageSize 160

skinparam sequence {
  ArrowColor #000000
  ArrowThickness 1.5
  LifeLineBorderColor #000000
  LifeLineBackgroundColor #FFFFFF
  ParticipantBorderColor #000000
  ParticipantBackgroundColor #FFFFFF
  ParticipantFontColor #000000
  ParticipantFontStyle bold
  ActorBorderColor #000000
  ActorBackgroundColor #FFFFFF
  GroupBorderColor #000000
  GroupHeaderFontColor #000000
  GroupHeaderFontStyle bold
}

actor "Étudiant" as User
participant "c : AuthComponent" as UI
participant "api : ExpressBackend" as API
database "db : MySQL" as DB
participant "jwt : JWTService" as JWT

User -> UI : 1: saisirIdentifiants(email, motDePasse)
activate UI

UI -> API : 2: POST /api/auth/login {email, password}
activate API

API -> DB : 3: findUserByEmail(email)
activate DB
DB --> API : 4: user (id, hashPassword, role)
deactivate DB

API -> API : 5: verifierMotDePasse(password, hashPassword)

alt Mot de passe valide
  API -> JWT : 6: generateToken(userPayload)
  activate JWT
  JWT --> API : 7: token (JWT)
  deactivate JWT
  API --> UI : 8: 200 OK {user, token}
  UI -> UI : 9: sauvegarderSession(token)
  UI --> User : 10: Rediriger vers Tableau de bord
else Identifiants invalides
  API --> UI : 6b: 401 Unauthorized "Email/Mot de passe incorrect"
  UI --> User : 7b: Afficher message d'erreur
end

deactivate API
deactivate UI

@enduml`;

const url = 'https://www.plantuml.com/plantuml/png/' + plantumlEncode(puml);

const file = fs.createWriteStream('test_seq_auth.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_seq_auth.png', fs.statSync('test_seq_auth.png').size);
    });
  });
});
