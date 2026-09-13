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

const puml = `@startuml state_machine
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 6

skinparam state {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
  BorderThickness 1.5
}

skinparam ArrowColor #000000
skinparam ArrowThickness 1.5

[*] --> NonCommence

state "Non commencé" as NonCommence
NonCommence : entry / Afficher l'énoncé

NonCommence --> EnRedaction : Commencer la saisie

state "En cours de rédaction" as EnRedaction
EnRedaction : do / Auto-sauvegarde locale

EnRedaction --> EnEvaluation : Soumettre la réponse

state "En cours d'évaluation" as EnEvaluation
EnEvaluation : entry / Contrôle de non-réponse
EnEvaluation : do / Inférence LLM Ollama

state Choix <<choice>>

EnEvaluation --> Choix

Choix -left-> NonValide : [Score < 50 ou évasif]
Choix -right-> Valide : [else : Score >= 50]

state "Non validé" as NonValide
NonValide : entry / Attribuer note (0/100 si évasif)
NonValide : entry / Afficher corrigé type officiel

state "Validé" as Valide
Valide : entry / Créditer points d'XP
Valide : entry / Mettre à jour progression

NonValide --> EnRedaction : Réessayer l'exercice
NonValide --> [*] : Quitter

Valide --> [*] : Terminer

@enduml`;

const encoded = plantumlEncode(puml);
const url = 'https://www.plantuml.com/plantuml/png/' + encoded;

const file = fs.createWriteStream('test_state_strict.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_state_strict.png', fs.statSync('test_state_strict.png').size);
    });
  });
});
