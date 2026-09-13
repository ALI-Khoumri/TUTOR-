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

const puml = `@startuml use_case
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 4
left to right direction

skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
}

skinparam usecase {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  BorderThickness 1.5
}

skinparam rectangle {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
  BorderThickness 1.5
}

skinparam arrow {
  Color #000000
  FontColor #000000
  FontSize 11
}

actor "Étudiant" as Student
actor "Tuteur IA" as AITutor

rectangle "Plateforme TutorAI" {
  usecase "S'authentifier" as UC_Auth
  usecase "Consulter les cours & notions" as UC_Courses
  usecase "Résoudre un exercice interactif" as UC_Solve
  usecase "Demander un indice adaptatif" as UC_Hint
  usecase "Générer un exercice sur-mesure" as UC_Gen
  usecase "Évaluer la réponse par l'IA" as UC_Eval
  usecase "Passer un quiz adaptatif" as UC_Quiz
  usecase "Consulter la progression & XP" as UC_Stats

  UC_Solve .> UC_Eval : <<include>>
  UC_Solve .> UC_Hint : <<extend>>
  UC_Gen .> UC_Eval : <<include>>
}

Student -- UC_Auth
Student -- UC_Courses
Student -- UC_Solve
Student -- UC_Gen
Student -- UC_Quiz
Student -- UC_Stats

UC_Eval -- AITutor
UC_Gen -- AITutor

@enduml`;

const url = 'https://www.plantuml.com/plantuml/png/' + plantumlEncode(puml);

const file = fs.createWriteStream('test_use_case7.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_use_case7.png', fs.statSync('test_use_case7.png').size);
    });
  });
});
