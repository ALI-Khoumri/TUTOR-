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
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 6
skinparam nodesep 60
skinparam ranksep 60

skinparam class {
  BackgroundColor #FFFFFF
  HeaderBackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  BorderThickness 1.5
}

class Subject {
  + code: String
  + intitule: String
  + description: String
}

class Exercise {
  + id: String
  + titre: String
  + difficulte: String
  + enonce: String
}

class ExerciseAttempt {
  + reponseEleve: String
  + noteObtenue: Float
  + feedbackIA: String
  + estValide: Boolean
}

class Student {
  + id: String
  + nom: String
  + email: String
  + niveauScolaire: String
  + totalXP: Integer
}

class DiagnosticProfile {
  + styleApprentissage: String
  + pointsForts: String
  + lacunes: String
}

class Quiz {
  + id: String
  + titre: String
  + difficulte: String
  + totalQuestions: Integer
}

class QuizQuestion {
  + enonce: String
  + options: List<String>
  + reponseCorrecte: Integer
}

class QuizResult {
  + score: Float
  + datePassage: Date
  + xpGagnes: Integer
}

' Relations claires et parfaitement espacées (aucun croisement)
Subject "1" -down-> "0..*" Exercise : contient >
Subject "1" -down-> "0..*" Quiz : propose >

Exercise "1" -down-> "0..*" ExerciseAttempt : évalue >

Student "1" -left-> "0..*" ExerciseAttempt : soumet >
Student "1" -right-> "0..*" QuizResult : passe >
Student "1" *-down-> "1" DiagnosticProfile : possède >

Quiz "1" *-down-> "1..*" QuizQuestion : composé de >
Quiz "1" -down-> "0..*" QuizResult : donne lieu à >

@enduml`;

const encoded = plantumlEncode(puml);
const url = 'https://www.plantuml.com/plantuml/png/' + encoded;
console.log('URL:', url);

const file = fs.createWriteStream('test_rendered.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_rendered.png', fs.statSync('test_rendered.png').size);
    });
  });
});
