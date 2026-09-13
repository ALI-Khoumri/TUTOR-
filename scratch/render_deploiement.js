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

const puml = `@startuml deploiement
skinparam dpi 300
skinparam monochrome true
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 6

skinparam node {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
  BorderThickness 1.5
}

skinparam artifact {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  BorderThickness 1.2
}

skinparam database {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  BorderThickness 1.5
}

skinparam ArrowColor #000000
skinparam ArrowThickness 1.5

node "Poste Client\\n(Navigateur Web)" as CLIENT {
  artifact "Application Frontend\\n(Angular 16 SPA)\\nHTML5 / CSS3 / TypeScript" as SPA
}

node "Station de Travail / Serveur Local\\n(Intel Core i7-9700K | 16 Go DDR4 | SSD 1 To)" as SERVER {
  
  node "Runtime Node.js 20 LTS" as NODE {
    artifact "Serveur API REST\\n(Express 5 - Port 3000)" as API
    artifact "Services Métier\\n(JWT, Quiz, Exercices, Bridge IA)" as SERVICES
    API ..> SERVICES
  }

  node "Système de Gestion de Données" as SGBD {
    database "Base de données relationnelle\\nMySQL 8.0 (Port 3306)" as DB
  }

  node "Moteur d'Inférence IA\\n(Accélération GPU NVIDIA RTX 3050 - CUDA)" as AI_NODE {
    artifact "Serveur Ollama Runtime\\n(API Locale - Port 11434)" as OLLAMA
    artifact "Modèle LLM Llama 3.2 3B\\n(Quantifié GGUF 4-bit)" as MODEL
    OLLAMA ..> MODEL : exécute
  }
}

' Connexions réseau
SPA -right-> API : HTTP / REST (JSON)\\nPort 3000

SERVICES -down-> DB : Requêtes SQL / TCP\\nPort 3306

SERVICES -down-> OLLAMA : Requêtes HTTP JSON\\nlocalhost:11434

note bottom of AI_NODE
  Inférence 100% locale :
  Aucune donnée pédagogique
  transmise vers des serveurs externes.
end note

@enduml`;

const encoded = plantumlEncode(puml);
const url = 'https://www.plantuml.com/plantuml/png/' + encoded;

const file = fs.createWriteStream('test_deploiement.png');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Saved test_deploiement.png', fs.statSync('test_deploiement.png').size);
    });
  });
});
