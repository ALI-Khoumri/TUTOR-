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

const puml = `@startuml collab
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 4
hide circle
hide empty members

skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
  BorderThickness 1.5
}

skinparam ArrowColor #000000
skinparam ArrowThickness 1.5

class "c : ExercisesComponent" as UI
class "s : AiLearningService" as ORCH
class "auth : SessionService" as SESS
class "cache : LocalStorageService" as CACHE
class "api : ExpressBackend" as API

UI -right- ORCH : "1: soumettreReponse() >\\n1.5: notifierResultat() <"
ORCH -up- SESS : "1.1: verifierSessionToken() >"
ORCH -down- CACHE : "1.2: chargerCache() >\\n1.4: sauvegarderTentative() >"
ORCH -right- API : "1.3: evaluerReponseIA() >"

@enduml`;

const url = 'https://www.plantuml.com/plantuml/png/' + plantumlEncode(puml);

const file = fs.createWriteStream('test_collab2.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_collab2.png', fs.statSync('test_collab2.png').size);
    });
  });
});
