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

const puml = `@startuml seq_messages
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 4
skinparam maxMessageSize 180

skinparam sequence {
  ArrowColor #000000
  ArrowThickness 1.5
  LifeLineBorderColor #000000
  LifeLineBackgroundColor #FFFFFF
  ParticipantBorderColor #000000
  ParticipantBackgroundColor #FFFFFF
  ParticipantFontColor #000000
  ParticipantFontStyle bold
  GroupBorderColor #000000
  GroupHeaderFontColor #000000
  GroupHeaderFontStyle bold
}

participant "Emetteur : ObjetA" as A
participant "Recepteur : ObjetB" as B

== 1. Message Synchrone (Bloquant) ==
A -> B : 1: appelSynchrone(parametres)
activate B
B --> A : 2: retourValeur (donnees)
deactivate B

== 2. Message Asynchrone (Non-bloquant) ==
A ->> B : 3: signalAsynchrone(evenement)

== 3. Auto-appel (Message réflexif) ==
A -> A : 4: traitementInterne()

== 4. Cadres d'interaction UML2 ==
alt Condition Principale (Si Vrai)
  A -> B : 5: executerActionA()
else Alternative (Sinon)
  A -> B : 5b: executerActionB()
end

opt Condition Optionnelle [ex: Cache invalide]
  A -> B : 6: rafraichirDonnees()
end

loop Pour chaque élément [1..N]
  A -> B : 7: traiterElement(i)
end

@enduml`;

const url = 'https://www.plantuml.com/plantuml/png/' + plantumlEncode(puml);

const file = fs.createWriteStream('test_seq_messages.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_seq_messages.png', fs.statSync('test_seq_messages.png').size);
    });
  });
});
