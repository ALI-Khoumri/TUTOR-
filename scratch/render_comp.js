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

const puml = `@startuml
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 6

package "1. Couche Presentation (Frontend - Angular 16)" {
  [AuthComponent] as C_AUTH
  [DashboardComponent] as C_DASH
  [QuizComponent] as C_QUIZ
  [ExerciseComponent] as C_EXO
}

package "2. Couche Metier & Services (Backend - Express.js / Node.js)" {
  [API Gateway & Router] as API
  [Service Authentification (JWT)] as S_AUTH
  [Service Quiz & Exercices] as S_QUIZ
  [Passerelle IA (Bridge)] as S_AI
}

package "3. Couche Donnees & IA (Persistance & Ollama)" {
  database "MySQL 8.0" as DB
  [Serveur Ollama Runtime] as OLLAMA
  [Modele Llama 3.2 3B] as MODEL
}

C_AUTH -right[hidden]- C_DASH
C_DASH -right[hidden]- C_QUIZ
C_QUIZ -right[hidden]- C_EXO

API -right[hidden]- S_AUTH
S_AUTH -right[hidden]- S_QUIZ
S_QUIZ -right[hidden]- S_AI

DB -right[hidden]- OLLAMA
OLLAMA -right[hidden]- MODEL

C_AUTH --> API : HTTP REST (JSON)
C_DASH --> API
C_QUIZ --> API
C_EXO --> API

API --> S_AUTH
API --> S_QUIZ
API --> S_AI

S_AUTH --> DB : SQL / TCP
S_QUIZ --> DB : SQL / TCP
S_AI --> OLLAMA : HTTP JSON
OLLAMA ..> MODEL : charge

@enduml`;

const encoded = plantumlEncode(puml);
const url = 'https://www.plantuml.com/plantuml/png/' + encoded;

const file = fs.createWriteStream('test_comp.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_comp.png', fs.statSync('test_comp.png').size);
    });
  });
});
