const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  HeadingLevel,
  ShadingType,
  UnderlineType
} = require('docx');

// --- COLOR PALETTE ---
const COLOR_EMSI_RED = 'B9141A';
const COLOR_EMSI_GREEN = '147846';
const COLOR_NAVY = '1A365D';
const COLOR_DARK_TEXT = '222222';
const COLOR_MUTED_TEXT = '555555';
const COLOR_LIGHT_BG = 'F8F9FA';
const COLOR_BORDER = 'CCCCCC';

// --- STYLING HELPERS ---

function p(text, options = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({
      text: text,
      font: 'Times New Roman',
      size: 24, // 12pt
      bold: !!options.bold,
      italics: !!options.italics,
      color: options.color || COLOR_DARK_TEXT,
      underline: options.underline ? { type: UnderlineType.SINGLE } : undefined
    }));
  } else if (Array.isArray(text)) {
    for (const r of text) {
      runs.push(new TextRun({
        text: r.text || '',
        font: r.font || 'Times New Roman',
        size: r.size || 24,
        bold: !!r.bold,
        italics: !!r.italics,
        color: r.color || COLOR_DARK_TEXT,
        underline: r.underline ? { type: UnderlineType.SINGLE } : undefined
      }));
    }
  }

  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    indent: options.noIndent ? undefined : { firstLine: 454 }, // 0.8 cm
    spacing: {
      line: 360, // 1.5 lines
      lineRule: 'auto',
      before: options.before !== undefined ? options.before : 0,
      after: options.after !== undefined ? options.after : 120 // 6pt
    },
    children: runs
  });
}

function bulletItem(label, text, isLast = false) {
  const punct = isLast ? '.' : ',';
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 454, hanging: 240 },
    spacing: { line: 360, before: 40, after: 80 },
    children: [
      new TextRun({ text: '— ', font: 'Times New Roman', size: 24, bold: true, color: '000000' }),
      new TextRun({ text: label + ' : ', font: 'Times New Roman', size: 24, bold: true, color: '000000' }),
      new TextRun({ text: text + punct, font: 'Times New Roman', size: 24, color: COLOR_DARK_TEXT })
    ]
  });
}

function sectionTitle(number, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text: `${number}. ${title}`,
        font: 'Times New Roman',
        size: 28, // 14pt
        bold: true,
        color: '000000'
      })
    ]
  });
}

function subsectionTitle(number, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 220, after: 100 },
    children: [
      new TextRun({
        text: `${number}. ${title}`,
        font: 'Times New Roman',
        size: 26, // 13pt
        bold: true,
        color: '000000'
      })
    ]
  });
}

function subsubsectionTitle(number, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: `${number}. ${title}`,
        font: 'Times New Roman',
        size: 24, // 12pt
        bold: true,
        color: '000000'
      })
    ]
  });
}

function frontMatterTitle(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 240 },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: 'Times New Roman',
        size: 32, // 16pt
        bold: true,
        color: COLOR_EMSI_RED
      })
    ]
  });
}

function imageReservation(description, figureNumber, caption) {
  const content = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: '+----------------------------------------------------------------------+',
          font: 'Courier New',
          size: 18,
          color: '444444'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 40 },
      children: [
        new TextRun({
          text: '| [EMPLACEMENT IMAGE : INSÉRER ICI LE DIAGRAMME / LA CAPTURE D\'ÉCRAN] |',
          font: 'Courier New',
          size: 18,
          bold: true,
          color: COLOR_EMSI_RED
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 400, right: 400 },
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: `Description : ${description}`,
          font: 'Courier New',
          size: 18,
          color: '222222'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 80 },
      children: [
        new TextRun({
          text: '+----------------------------------------------------------------------+',
          font: 'Courier New',
          size: 18,
          color: '444444'
        })
      ]
    })
  ];

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: '888888' },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '888888' },
              left: { style: BorderStyle.SINGLE, size: 8, color: '888888' },
              right: { style: BorderStyle.SINGLE, size: 8, color: '888888' }
            },
            shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: content
          })
        ]
      })
    ]
  });

  const legend = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 200 },
    children: [
      new TextRun({ text: `Figure ${figureNumber} : `, font: 'Times New Roman', size: 22, bold: true, color: '000000' }),
      new TextRun({ text: caption, font: 'Times New Roman', size: 22, italics: true, color: '222222' })
    ]
  });

  return [table, legend];
}

function makeChapterCover(chapterNum, titleLines, synthesisText) {
  const cellLeft = new TableCell({
    width: { size: 45, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }
    },
    shading: { fill: COLOR_EMSI_RED, type: ShadingType.CLEAR },
    margins: { top: 240, bottom: 240, left: 240, right: 240 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 100, after: 0 },
        children: [
          new TextRun({ text: 'C', font: 'Times New Roman', size: 100, bold: true, color: 'FFFFFF' }),
          new TextRun({ text: 'hapitre', font: 'Times New Roman', size: 36, bold: true, color: 'FFFFFF' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 200 },
        children: [
          new TextRun({ text: String(chapterNum), font: 'Times New Roman', size: 160, bold: true, color: 'FFFFFF' })
        ]
      })
    ]
  });

  const cellRight = new TableCell({
    width: { size: 55, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }
    },
    margins: { top: 240, bottom: 240, left: 300, right: 240 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 120 },
        children: titleLines.map((line, idx) => new TextRun({
          text: line,
          font: 'Times New Roman',
          size: 40, // 20pt
          bold: true,
          color: '000000',
          break: idx > 0 ? 1 : undefined
        }))
      })
    ]
  });

  const topTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [cellLeft, cellRight] })]
  });

  const objectivesBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_EMSI_RED },
              right: { style: BorderStyle.NONE }
            },
            shading: { fill: 'F9F9FB', type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 240, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: 'Objectifs du chapitre',
                    font: 'Times New Roman',
                    size: 26,
                    bold: true,
                    italics: true,
                    underline: { type: UnderlineType.SINGLE },
                    color: COLOR_EMSI_RED
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 100 },
                children: [
                  new TextRun({
                    text: "L’étudiant évoquera implicitement les différents objectifs de ce chapitre.",
                    font: 'Times New Roman',
                    size: 22,
                    italics: true,
                    color: COLOR_MUTED_TEXT
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: synthesisText,
                    font: 'Times New Roman',
                    size: 24,
                    color: COLOR_DARK_TEXT
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  return [
    new Paragraph({ spacing: { before: 600, after: 200 }, children: [] }),
    topTable,
    new Paragraph({ children: [new PageBreak()] })
  ];
}

function codeListing(codeText, caption) {
  const lines = codeText.trim().split('\n');
  const paragraphs = lines.map(line => new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, before: 20, after: 20 },
    children: [
      new TextRun({
        text: line,
        font: 'Courier New',
        size: 18, // 9pt
        color: '111111'
      })
    ]
  }));

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'DDDDDD' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DDDDDD' },
              left: { style: BorderStyle.SINGLE, size: 18, color: COLOR_EMSI_GREEN },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'DDDDDD' }
            },
            shading: { fill: 'F6F8FA', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: paragraphs
          })
        ]
      })
    ]
  });

  const legend = caption ? new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [
      new TextRun({ text: caption, font: 'Times New Roman', size: 20, italics: true, color: '444444' })
    ]
  }) : null;

  return legend ? [table, legend] : [table];
}

// Table helper for data tables
function makeDataTable(headers, rows, colWidths = []) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_NAVY },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
      },
      shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, before: 0, after: 0 },
          children: [
            new TextRun({
              text: h,
              font: 'Times New Roman',
              size: 22,
              bold: true,
              color: 'FFFFFF'
            })
          ]
        })
      ]
    }))
  });

  const bodyRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cellText, cIdx) => new TableCell({
      width: colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.PERCENTAGE } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
      },
      shading: { fill: rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          spacing: { line: 280, before: 0, after: 0 },
          children: [
            new TextRun({
              text: cellText,
              font: 'Times New Roman',
              size: 20,
              bold: cIdx === 0 && (row[0].startsWith('TEST') || row[0].startsWith('Tableau') || row[0].startsWith('CU')),
              color: cellText === 'CONFORME' ? COLOR_EMSI_GREEN : COLOR_DARK_TEXT
            })
          ]
        })
      ]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });
}

// Two-column descriptive table (e.g., Use Case Specification)
function makeTwoColTable(rows) {
  const tableRows = rows.map((r, idx) => new TableRow({
    children: [
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
        },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 280, before: 0, after: 0 },
            children: [
              new TextRun({
                text: r[0],
                font: 'Times New Roman',
                size: 22,
                bold: true,
                color: COLOR_NAVY
              })
            ]
          })
        ]
      }),
      new TableCell({
        width: { size: 72, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
        },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 300, before: 0, after: 0 },
            children: [
              new TextRun({
                text: r[1],
                font: 'Times New Roman',
                size: 22,
                color: COLOR_DARK_TEXT
              })
            ]
          })
        ]
      })
    ]
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

console.log('Building full document sections...');

// =========================================================================
// DOCUMENT CONTENT BUILDER
// =========================================================================

const docChildren = [];

// -------------------------------------------------------------------------
// 1. TITLE PAGE (PAGE DE GARDE EMSI OFFICIELLE)
// -------------------------------------------------------------------------

// EMSI Header Banner
const headerTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 20 },
              children: [
                new TextRun({ text: 'ÉCOLE MAROCAINE DES SCIENCES DE L’INGÉNIEUR', font: 'Times New Roman', size: 22, bold: true, color: COLOR_EMSI_GREEN }),
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 240, before: 0, after: 20 },
              children: [
                new TextRun({ text: 'MEMBRE DE HONORIS UNITED UNIVERSITIES', font: 'Times New Roman', size: 18, italics: true, color: '555555' })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 240, before: 0, after: 0 },
              children: [
                new TextRun({ text: 'Filière : Ingénierie Informatique et Réseaux (IIR)', font: 'Times New Roman', size: 20, bold: true, color: '000000' })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 240, before: 0, after: 0 },
              children: [
                new TextRun({ text: 'Année Universitaire\n2025 / 2026', font: 'Times New Roman', size: 20, bold: true, color: '333333' })
              ]
            })
          ]
        })
      ]
    })
  ]
});

docChildren.push(headerTable);

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 600, after: 100 },
  children: [
    new TextRun({ text: 'RAPPORT DE PROJET DE FIN D’ANNÉE (PFA)', font: 'Times New Roman', size: 30, bold: true, color: COLOR_EMSI_RED })
  ]
}));

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 400 },
  children: [
    new TextRun({ text: '3ème Année — Cycle Ingénieur en Ingénierie Informatique et Réseaux', font: 'Times New Roman', size: 24, italics: true, color: '444444' })
  ]
}));

// Main Title Banner with colored background
const titleBanner = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: COLOR_EMSI_RED },
            bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_EMSI_RED },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          shading: { fill: 'FDF8F8', type: ShadingType.CLEAR },
          margins: { top: 240, bottom: 240, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 360, before: 60, after: 80 },
              children: [
                new TextRun({
                  text: 'CONCEPTION ET RÉALISATION D’UNE PLATEFORME WEB ADAPTATIVE DE SOUTIEN SCOLAIRE ET DE REMÉDIATION PÉDAGOGIQUE ASSISTÉE PAR INTELLIGENCE ARTIFICIELLE',
                  font: 'Times New Roman',
                  size: 28,
                  bold: true,
                  color: COLOR_NAVY
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({ text: '— Projet « TutorAI » (Élèves en Difficulté de 6 à 15 ans) —', font: 'Times New Roman', size: 26, bold: true, color: COLOR_EMSI_RED })
              ]
            })
          ]
        })
      ]
    })
  ]
});

docChildren.push(titleBanner);

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 300, after: 400 },
  children: [
    new TextRun({ text: 'Période du stage : Du 01/07/2026 au 01/08/2026 (5 semaines estivales intensives)', font: 'Times New Roman', size: 22, bold: true, color: COLOR_EMSI_GREEN })
  ]
}));

// Attribution & Supervision Table
const attributionTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER }
          },
          shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 40 },
              children: [
                new TextRun({ text: 'Réalisé par :', font: 'Times New Roman', size: 22, bold: true, underline: { type: UnderlineType.SINGLE }, color: COLOR_NAVY })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 20 },
              children: [
                new TextRun({ text: 'Ali KHOUMRI', font: 'Times New Roman', size: 24, bold: true, color: '000000' })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 240, before: 0, after: 120 },
              children: [
                new TextRun({ text: 'Élève-Ingénieur en 3ème Année IIR', font: 'Times New Roman', size: 20, italics: true, color: '444444' })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 80, after: 40 },
              children: [
                new TextRun({ text: 'Organisme d’accueil :', font: 'Times New Roman', size: 22, bold: true, underline: { type: UnderlineType.SINGLE }, color: COLOR_NAVY })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 20 },
              children: [
                new TextRun({ text: 'UQASE NEXT SARL', font: 'Times New Roman', size: 22, bold: true, color: '000000' })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 220, before: 0, after: 0 },
              children: [
                new TextRun({ text: '332 Bd Brahim Roudani, Maarif, Casablanca', font: 'Times New Roman', size: 18, color: '555555' })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER }
          },
          shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 40 },
              children: [
                new TextRun({ text: 'Encadrante Professionnelle :', font: 'Times New Roman', size: 22, bold: true, underline: { type: UnderlineType.SINGLE }, color: COLOR_NAVY })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 260, before: 0, after: 20 },
              children: [
                new TextRun({ text: 'Madame Aïcha FADLI', font: 'Times New Roman', size: 24, bold: true, color: COLOR_EMSI_RED })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 240, before: 0, after: 120 },
              children: [
                new TextRun({ text: 'Responsable Digitale (UQASE NEXT SARL)', font: 'Times New Roman', size: 20, italics: true, color: '444444' })
              ]
            })
          ]
        })
      ]
    })
  ]
});

docChildren.push(attributionTable);

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 500, after: 0 },
  children: [
    new TextRun({ text: 'École Marocaine des Sciences de l’Ingénieur — Casablanca', font: 'Times New Roman', size: 20, bold: true, color: '666666' })
  ]
}));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 2. DÉDICACES
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Dédicaces'));

docChildren.push(p([
  { text: 'À mes très chers parents,\n', bold: true, italics: true },
  { text: 'Pour leur amour inconditionnel, leurs prières bienveillantes, leurs sacrifices constants et leur soutien indéfectible tout au long de mes années d’études. Qu’ils trouvent dans ce modeste travail le témoignage sincère de ma profonde affection et de mon infinie gratitude.' }
], { before: 200, after: 200 }));

docChildren.push(p([
  { text: 'À mes professeurs de l’École Marocaine des Sciences de l’Ingénieur (EMSI),\n', bold: true, italics: true },
  { text: 'Pour la rigueur de leur enseignement, la qualité de leur transmission du savoir et leur accompagnement méthodologique continu tout au long de ce cursus d’ingénierie.' }
], { before: 100, after: 200 }));

docChildren.push(p([
  { text: 'À mes collègues et amis,\n', bold: true, italics: true },
  { text: 'Pour leur esprit de solidarité, leurs encouragements mutuels et les précieux moments de partage intellectuel et humain vécus ensemble.' }
], { before: 100, after: 200 }));

docChildren.push(p([
  { text: 'À tous ceux qui ont contribué, de près ou de loin, à l’aboutissement et au succès de ce projet.', italics: true }
], { before: 100, after: 200 }));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 3. REMERCIEMENTS
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Remerciements'));

docChildren.push(p('Au terme de ce projet de fin d’année marquant l’aboutissement de notre troisième année de formation en Ingénierie Informatique et Réseaux à l’École Marocaine des Sciences de l’Ingénieur (EMSI), nous tenons à exprimer notre profonde gratitude à toutes les personnes qui ont contribué au bon déroulement et à la réussite de notre stage effectué du 1er juillet au 1er août 2026.'));

docChildren.push(p([
  { text: 'Nous exprimons tout d’abord nos remerciements les plus chaleureux à la direction générale de la société ' },
  { text: 'UQASE NEXT SARL', bold: true },
  { text: ' pour nous avoir accueillis au sein de ses locaux à Casablanca et pour nous avoir offert un cadre de travail professionnel, stimulant et propice à l’innovation technologique.' }
]));

docChildren.push(p([
  { text: 'Nous adressons notre profonde et sincère reconnaissance à notre encadrante professionnelle, ' },
  { text: 'Madame Aïcha FADLI', bold: true, color: COLOR_EMSI_RED },
  { text: ', Responsable Digitale au sein d’UQASE NEXT SARL. Nous la remercions tout particulièrement pour sa disponibilité constante, sa bienveillance, la clarté de ses orientations stratégiques et ses précieux conseils méthodologiques. Son leadership éclairé et son expertise reconnue dans le pilotage des projets de transformation digitale ont constitué un appui déterminant pour cadrer notre réflexion, surmonter les verrous techniques et mener à bien les réalisations attendues.' }
]));

docChildren.push(p([
  { text: 'Enfin, nous tenons à témoigner notre profond respect et notre considération à l’ensemble du corps professoral et administratif de l’' },
  { text: 'École Marocaine des Sciences de l’Ingénieur (EMSI)', bold: true },
  { text: ' pour l’excellence de la formation académique dispensée et les hautes valeurs d’ingénieur transmises avec dévouement.' }
]));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 4. TABLE DES MATIÈRES
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Table des Matières'));

const tocEntries = [
  ['Dédicaces', 'i'],
  ['Remerciements', 'ii'],
  ['Table des matières', 'iii'],
  ['Liste des figures', 'iv'],
  ['Liste des tableaux', 'v'],
  ['Liste des acronymes', 'vi'],
  ['Introduction générale', '1'],
  ['Chapitre 1 — Présentation du cadre de projet', '3'],
  ['   1.1. Introduction', '4'],
  ['   1.2. Présentation de la société d’accueil', '4'],
  ['      1.2.1. Fiche signalétique et implantation', '4'],
  ['      1.2.2. Structure et département d’accueil', '5'],
  ['   1.3. Étude de l’existant', '6'],
  ['   1.4. Critique de l’existant et solution proposée', '6'],
  ['   1.5. Méthodologie et démarche de développement', '7'],
  ['   1.6. Planning prévisionnel et ordonnancement (01/07 au 01/08)', '8'],
  ['   1.7. Conclusion', '9'],
  ['Chapitre 2 — Spécification des besoins', '10'],
  ['   2.1. Introduction', '11'],
  ['   2.2. Spécification des besoins fonctionnels', '11'],
  ['   2.3. Spécification des besoins non fonctionnels', '13'],
  ['   2.4. Identification et typologie des acteurs', '14'],
  ['   2.5. Modélisation des cas d’utilisation', '14'],
  ['   2.6. Conclusion', '17'],
  ['Chapitre 3 — Conception du système', '18'],
  ['   3.1. Introduction', '19'],
  ['   3.2. Modélisation dynamique du système', '19'],
  ['   3.3. Modélisation statique du système', '22'],
  ['   3.4. Architecture globale du système', '25'],
  ['   3.5. Conclusion', '27'],
  ['Chapitre 4 — Réalisation du système', '28'],
  ['   4.1. Introduction', '29'],
  ['   4.2. Environnement de développement et outillage', '29'],
  ['   4.3. Réalisation et présentation des interfaces graphiques', '30'],
  ['   4.4. Tests de validation et recette fonctionnelle', '36'],
  ['   4.5. Conclusion', '37'],
  ['Conclusion générale', '38'],
  ['Bibliographie et Nétographie', '40'],
  ['Annexes', '42']
];

for (const [title, page] of tocEntries) {
  const isMajor = !title.startsWith('   ');
  docChildren.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 260, before: isMajor ? 60 : 20, after: 20 },
    children: [
      new TextRun({ text: title, font: 'Times New Roman', size: isMajor ? 24 : 22, bold: isMajor, color: isMajor ? '000000' : '333333' }),
      new TextRun({ text: ' ................................................................................................ '.substring(0, Math.max(10, 70 - title.length)), font: 'Times New Roman', size: 20, color: '999999' }),
      new TextRun({ text: page, font: 'Times New Roman', size: 22, bold: isMajor, color: COLOR_NAVY })
    ]
  }));
}

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 5. LISTE DES FIGURES
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Liste des Figures'));

const figureEntries = [
  ['Figure 1.1', 'Organigramme structurel de la société UQASE NEXT et positionnement du Département Digital', '5'],
  ['Figure 1.2', 'Cycle itératif de la méthodologie Agile Scrum appliquée au projet TutorAI', '7'],
  ['Figure 1.3', 'Diagramme de Gantt prévisionnel du projet', '9'],
  ['Figure 2.1', 'Diagramme global des cas d’utilisation UML de la plateforme TutorAI', '15'],
  ['Figure 2.2', 'Diagramme de cas d’utilisation détaillé du module d’entraînement et d’évaluation', '17'],
  ['Figure 3.1', 'Diagramme de séquences UML2 du processus d’authentification sécurisée', '20'],
  ['Figure 3.2', 'Diagramme de séquences UML2 de l’évaluation rigoureuse d’un exercice pratique avec le Tuteur IA', '21'],
  ['Figure 3.3', 'Diagramme de collaboration entre les services du sous-système de tutorat', '21'],
  ['Figure 3.4', 'Diagramme d’états-transitions du cycle de vie d’un exercice pratique', '22'],
  ['Figure 3.5', 'Diagramme d’activités de l’évaluation adaptative et de l’interception des non-réponses', '22'],
  ['Figure 3.6', 'Diagramme de classes métier du domaine TutorAI', '23'],
  ['Figure 3.7', 'Schéma physique et relationnel de la base de données (MLD)', '24'],
  ['Figure 3.8', 'Diagramme de composants de l’architecture logicielle 3-Tiers', '26'],
  ['Figure 3.9', 'Diagramme de déploiement matériel et réseau de la plateforme', '27'],
  ['Figure 4.1', 'Interface de connexion et d’inscription sécurisée', '31'],
  ['Figure 4.2', 'Tableau de bord de l’apprenant avec indicateurs de progression adaptative', '31'],
  ['Figure 4.3', 'Interface du test diagnostique initial de positionnement des compétences', '32'],
  ['Figure 4.4', 'Interface de passation d’un quiz interactif avec rétroaction immédiate', '33'],
  ['Figure 4.5', 'Espace de travail et éditeur de réponse à un exercice pratique', '34'],
  ['Figure 4.6', 'Restitution sans complaisance avec sanction 0/100 et corrigé type détaillé', '34'],
  ['Figure 4.7', 'Modale de génération paramétrée d’un nouveau cas pratique par le Tuteur IA', '35'],
  ['Figure 4.8', 'Interface de téléchargement et aperçu d’une fiche de cours vectorielle PDF', '36']
];

for (const [figNum, figTitle, pNum] of figureEntries) {
  docChildren.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 280, before: 40, after: 40 },
    children: [
      new TextRun({ text: '— ', font: 'Times New Roman', size: 22, bold: true, color: '000000' }),
      new TextRun({ text: figNum + ' : ', font: 'Times New Roman', size: 22, bold: true, color: COLOR_NAVY }),
      new TextRun({ text: figTitle, font: 'Times New Roman', size: 22, color: COLOR_DARK_TEXT }),
      new TextRun({ text: ' .... ', font: 'Times New Roman', size: 20, color: 'AAAAAA' }),
      new TextRun({ text: pNum, font: 'Times New Roman', size: 22, bold: true, color: COLOR_EMSI_RED })
    ]
  }));
}

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 6. LISTE DES TABLEAUX & ACRONYMES
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Liste des Tableaux'));

const tableEntries = [
  ['Tableau 1.1', 'Planning prévisionnel des étapes du projet (01/07 au 01/08/2024)', '8'],
  ['Tableau 2.1', 'Description textuelle du cas d’utilisation « Évaluer un exercice pratique »', '15'],
  ['Tableau 2.2', 'Description textuelle du cas d’utilisation « Générer un nouvel exercice sur mesure »', '16'],
  ['Tableau 2.3', 'Description textuelle du cas d’utilisation « Passer le test diagnostique initial »', '16'],
  ['Tableau 3.1', 'Dictionnaire de données du système TutorAI', '24'],
  ['Tableau 4.1', 'Matrice de recette et validation des cas de tests fonctionnels', '37']
];

for (const [tNum, tTitle, pNum] of tableEntries) {
  docChildren.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 280, before: 40, after: 40 },
    children: [
      new TextRun({ text: '— ', font: 'Times New Roman', size: 22, bold: true, color: '000000' }),
      new TextRun({ text: tNum + ' : ', font: 'Times New Roman', size: 22, bold: true, color: COLOR_NAVY }),
      new TextRun({ text: tTitle, font: 'Times New Roman', size: 22, color: COLOR_DARK_TEXT }),
      new TextRun({ text: ' .... ', font: 'Times New Roman', size: 20, color: 'AAAAAA' }),
      new TextRun({ text: pNum, font: 'Times New Roman', size: 22, bold: true, color: COLOR_EMSI_RED })
    ]
  }));
}

docChildren.push(new Paragraph({ spacing: { before: 300, after: 100 }, children: [] }));

docChildren.push(frontMatterTitle('Liste des Acronymes'));

const acronyms = [
  ['API', 'Application Programming Interface'],
  ['CDK', 'Component Development Kit'],
  ['CORS', 'Cross-Origin Resource Sharing'],
  ['CU', 'Cas d’Utilisation'],
  ['DOM', 'Document Object Model'],
  ['EMSI', 'École Marocaine des Sciences de l’Ingénieur'],
  ['GGUF', 'GPT-Generated Unified Format'],
  ['HTTP', 'HyperText Transfer Protocol'],
  ['HTTPS', 'HyperText Transfer Protocol Secure'],
  ['IIR', 'Ingénierie Informatique et Réseaux'],
  ['JSON', 'JavaScript Object Notation'],
  ['JWT', 'JSON Web Token'],
  ['LLM', 'Large Language Model (Modèle de Langage Étendu)'],
  ['MLD', 'Modèle Logique de Données'],
  ['ORM', 'Object-Relational Mapping'],
  ['PFA', 'Projet de Fin d’Année'],
  ['RAG', 'Retrieval-Augmented Generation'],
  ['REST', 'Representational State Transfer'],
  ['SGBD', 'Système de Gestion de Base de Données'],
  ['SPA', 'Single Page Application'],
  ['SQL', 'Structured Query Language'],
  ['UML', 'Unified Modeling Language'],
  ['UUID', 'Universally Unique Identifier'],
  ['WCAG', 'Web Content Accessibility Guidelines'],
  ['XP', 'Experience Points (Points d’Expérience)']
];

for (const [acro, def] of acronyms) {
  docChildren.push(bulletItem(acro, def, true));
}

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 7. INTRODUCTION GÉNÉRALE
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Introduction Générale'));

docChildren.push(p('L’apprentissage et la consolidation des compétences fondamentales durant les cycles primaire et collégial (enfants et adolescents âgés de 6 à 15 ans) constituent le socle déterminant de toute réussite scolaire ultérieure. C’est précisément à cet âge charnière que s’installent fréquemment des difficultés d’apprentissage : blocages en calcul et mathématiques, lacunes en lecture et maîtrise de la langue, troubles de l’attention ou manque de confiance en soi face aux devoirs. Dans un contexte scolaire où les effectifs de classe restreignent l’individualisation des parcours et où les parents ne disposent pas toujours des disponibilités ou repères pédagogiques nécessaires, les élèves en difficulté se retrouvent souvent isolés face à leurs blocages, ce qui favorise le décrochage précoce.'));

docChildren.push(p([
  { text: 'Dans ce contexte, la conception de plateformes interactives de soutien scolaire et de remédiation pédagogique constitue une opportunité d’ingénierie et d’impact sociétal majeure. Le présent projet de fin d’année, mené au sein de la société de conseil et d’ingénierie logicielle ' },
  { text: 'UQASE NEXT SARL', bold: true },
  { text: ' à Casablanca durant la période du 1er juillet au 1er août 2026, s’inscrit au cœur de cette dynamique d’innovation. Notre mission a consisté à concevoir, modéliser et développer une plateforme web adaptative d’aide aux devoirs et de tutorat intelligent, baptisée ' },
  { text: 'TutorAI', bold: true, color: COLOR_NAVY },
  { text: '. Développée spécifiquement pour les élèves de 6 à 15 ans, cette application combine une interface web réactive et ludifiée sous Angular 16, une couche de services RESTful robuste sous Node.js/Express, et un serveur d’inférence d’IA locale (Ollama exécutant Llama 3.2) garantissant la totale confidentialité des données des élèves mineurs. La plateforme intègre un parcours diagnostique sans stress, un moteur d’exercices et de quiz adaptatifs à paliers de progression, et un tuteur conversationnel doué d’une grande bienveillance pédagogique capable de décomposer les explications pas-à-pas avec des analogies concrètes.' }
]));

docChildren.push(p('Pour rendre compte avec rigueur de l’ensemble de notre démarche d’ingénieur, le présent rapport est structuré en quatre chapitres complémentaires :'));

docChildren.push(bulletItem('Le Chapitre 1', 'présente le cadre institutionnel du projet en décrivant l’organisme d’accueil UQASE NEXT SARL et le Département Digital, analyse l’existant des plateformes d’apprentissage, motive la solution novatrice TutorAI et formalise la méthodologie Agile Scrum ainsi que le planning prévisionnel des travaux (01/07 au 01/08)', false));
docChildren.push(bulletItem('Le Chapitre 2', 'formalise la spécification exhaustive des besoins fonctionnels et non fonctionnels, caractérise les acteurs du système et modélise les cas d’utilisation selon le formalisme UML', false));
docChildren.push(bulletItem('Le Chapitre 3', 'aborde la conception architecturale et détaillée du système à travers la modélisation dynamique (diagrammes de séquences avec fragments UML2, collaboration, états-transitions, activités), la modélisation statique (diagramme de classes, modèle relationnel, dictionnaire de données) et la description de l’architecture 3-Tiers et de déploiement', false));
docChildren.push(bulletItem('Le Chapitre 4', 'retrace la concrétisation logicielle de TutorAI, détaillant l’environnement matériel et logiciel de développement, décrivant les principales interfaces graphiques développées et exposant les résultats de la campagne de tests et de recette', true));

docChildren.push(p('Enfin, une conclusion générale synthétise le bilan de cette expérience professionnelle et ouvre sur des perspectives d’évolution académique et technique.'));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 8. CHAPITRE 1 — PRÉSENTATION DU CADRE DE PROJET
// -------------------------------------------------------------------------

docChildren.push(...makeChapterCover(
  1,
  ['Présentation du cadre', 'de projet'],
  'Ce chapitre vise à introduire l’environnement d’accueil au sein d’UQASE NEXT SARL en mettant en relief le rôle stratégique du Département Digital supervisé par Madame Aïcha FADLI, à conduire une étude analytique et critique des solutions d’apprentissage existantes afin d’asseoir la proposition de valeur de TutorAI, et à expliciter la méthodologie de gestion de projet Agile Scrum régissant notre cycle de développement ainsi que la planification prévisionnelle des livrables (du 01/07 au 01/08/2024).'
));

docChildren.push(sectionTitle('1', 'Introduction'));
docChildren.push(p('Ce premier chapitre a pour vocation de circonscrire l’écosystème contextuel et organisationnel au sein duquel s’est déroulé notre stage de fin d’année. Nous commencerons par présenter la société d’accueil UQASE NEXT SARL, ses domaines d’expertise et la structure de son Département Digital. Dans un deuxième temps, nous dresserons un état de l’art des solutions logicielles existantes dans le secteur du e-learning et du soutien scolaire afin de souligner leurs carences méthodologiques. Enfin, nous décrirons la démarche de gestion de projet adoptée, fondée sur la méthodologie Agile Scrum, et nous formaliserons le calendrier prévisionnel ordonnançant nos étapes de travail sur la période du 01/07 au 01/08/2024.'));

docChildren.push(sectionTitle('2', 'Présentation de la société d’accueil'));
docChildren.push(p('Notre stage a été réalisé au sein de la société UQASE NEXT SARL, entreprise dynamique spécialisée dans l’édition logicielle, le conseil en transformation digitale et l’intégration de technologies avancées au service des entreprises et institutions éducatives.'));

docChildren.push(subsectionTitle('2.1', 'Fiche signalétique et implantation'));
docChildren.push(p('La société est implantée au cœur du quartier d’affaires du Maarif à Casablanca. Les informations administratives et techniques de l’entreprise sont récapitulées ci-dessous :'));

docChildren.push(bulletItem('Dénomination sociale', 'UQASE NEXT SARL', false));
docChildren.push(bulletItem('Forme juridique', 'Société à Responsabilité Limitée (SARL)', false));
docChildren.push(bulletItem('Siège social', '332 Boulevard Brahim Roudani, Étage 5, Appartement 21, Résidence Rayhane, Maarif, Casablanca, Maroc', false));
docChildren.push(bulletItem('Encadrante professionnelle (maître de stage)', 'Madame Aïcha FADLI, Responsable Digitale', false));
docChildren.push(bulletItem('Secteur d’activité', 'Conseil en technologies de l’information, édition logicielle, développement web et intelligence artificielle', false));
docChildren.push(bulletItem('Domaines d’expertise', 'Ingénierie logicielle full-stack, architectures distribuées Cloud, intégration d’agents d’intelligence artificielle, plateformes d’apprentissage e-learning et méthodologies DevOps', false));
docChildren.push(bulletItem('Zone géographique de rayonnement', 'Maroc et international', true));

docChildren.push(subsectionTitle('2.2', 'Structure et département d’accueil'));
docChildren.push(p('La structure organisationnelle d’UQASE NEXT SARL est articulée autour de pôles opérationnels hautement interconnectés : la Direction Générale, le Pôle Développement Logiciel, le Pôle Qualité & DevOps, et le Département Digital.'));

docChildren.push(p([
  { text: 'Nous avons eu l’opportunité d’intégrer directement le ' },
  { text: 'Département Digital', bold: true },
  { text: ', placé sous la responsabilité managériale et technique de ' },
  { text: 'Madame Aïcha FADLI', bold: true, color: COLOR_EMSI_RED },
  { text: ', Responsable Digitale. Ce département constitue le fer de lance de l’entreprise en matière d’innovation numérique, de modernisation servicielle et d’intégration des modèles d’intelligence artificielle générative dans des cas d’usage métiers à forte valeur ajoutée.' }
]));

docChildren.push(p('Sous la supervision directe de Madame Aïcha FADLI, nous avons participé aux réunions de cadrage stratégique, à la définition de l’expérience utilisateur (UX/UI) des plateformes d’apprentissage et à la validation des choix d’architecture technique. Le département digital entretient des synergies étroites avec les ingénieurs d’infrastructure et les développeurs front-end/back-end, ce qui nous a permis de progresser dans un écosystème d’ingénierie rigoureux répondant aux meilleurs standards professionnels.'));

docChildren.push(...imageReservation(
  'Schéma de l’organigramme structurel de la société UQASE NEXT SARL avec mise en évidence de la Direction Générale, du Pôle Développement, du Pôle Qualité/DevOps et du Département Digital dirigé par Madame Aïcha FADLI, Responsable Digitale.',
  '1.1',
  'Organigramme structurel de la société UQASE NEXT et positionnement du Département Digital'
));

docChildren.push(sectionTitle('3', 'Étude de l’existant'));
docChildren.push(p('L’analyse de l’écosystème numérique contemporain dédié au soutien scolaire et à l’aide aux devoirs fait ressortir trois grandes familles de dispositifs :'));
docChildren.push(bulletItem('Les exerciseurs scolaires et fiches en ligne traditionnels', 'Des sites de révision proposant des cours numérisés et des séries d’exercices standardisés. Ces outils privilégient la restitution passive et confrontent l’élève en difficulté à des erreurs répétitives sans lui expliquer la cause cognitive de son blocage', false));
docChildren.push(bulletItem('Les applications ludo-éducatives grand public', 'Des applications mobiles gamifiées qui captent l’attention des plus jeunes par des récompenses visuelles, mais qui simplifient à l’excès les concepts sans offrir de véritable remédiation ciblée face aux lacunes persistantes', false));
docChildren.push(bulletItem('Les assistants conversationnels génériques dans le cloud', 'Des modèles distants en cloud (type ChatGPT ou Gemini), consultables en mode texte libre mais inadaptés aux enfants de 6 à 15 ans : vocabulaire trop abstrait, complaisance trompeuse et absence de garanties sur la protection des données des mineurs', true));

docChildren.push(sectionTitle('4', 'Critique de l’existant et solution proposée'));
docChildren.push(subsectionTitle('4.1', 'Limites de l’existant'));
docChildren.push(p('L’examen critique de ces solutions révèle plusieurs limites structurelles majeures pour les élèves en difficulté :'));
docChildren.push(bulletItem('Statisme et anxiété d’échec', 'Les parcours rigides ne s’adaptent pas au rythme d’assimilation de l’enfant. Face à l’accumulation d’erreurs sanctionnées froidement, l’élève en difficulté se décourage et perd confiance en ses capacités', false));
docChildren.push(bulletItem('Complaisance trompeuse ou sanction brutale', 'Les assistants IA génériques manquent de cadre pédagogique : soit ils fournissent directement la solution complète sans faire réfléchir l’enfant, soit ils valident des raisonnements faux. À l’inverse, les exerciseurs classiques sanctionnent sans expliquer', false));
docChildren.push(bulletItem('Correction différée et sentiment d’abandon', 'L’enfant qui bloque sur un devoir le soir reste sans aide immédiate en l’absence d’un tuteur disponible, ce qui retarde l’assimilation des notions fondamentales', false));
docChildren.push(bulletItem('Confidentialité et vulnérabilité des données des mineurs', 'Le transfert des échanges d’enfants vers des plateformes cloud tierces pose d’importants problèmes éthiques et réglementaires quant au profilage et à la sécurité des données des mineurs', true));

docChildren.push(subsectionTitle('4.2', 'Solution proposée : La plateforme TutorAI'));
docChildren.push(p('Pour répondre à ces enjeux, nous avons conçu et réalisé la plateforme TutorAI, un environnement web interactif de soutien scolaire et de remédiation individualisée pour les élèves de 6 à 15 ans, articulé autour de trois piliers majeurs :'));
docChildren.push(bulletItem('Un guidage adaptatif individualisé', 'Les activités de quiz et d’exercices s’adaptent dynamiquement au niveau réel de l’élève à travers trois paliers progressifs (Découverte/Débutant, Consolidation/Intermédiaire, Maîtrise/Avancé), échelonnés sur les cycles du Primaire et du Collège', false));
docChildren.push(bulletItem('Une remédiation bienveillante sans complaisance', 'Face aux blocages ou aux non-réponses (« jsp », « je sais pas »), le tuteur IA ne sanctionne pas punitivement l’enfant mais identifie le blocage, active un statut bienveillant (« À consolider avec aide ») et fournit des indices décompressés pas-à-pas avec des encouragements chaleureux pour relancer sa réflexion', false));
docChildren.push(bulletItem('Une souveraineté et sécurité totale par inférence IA locale', 'L’intégration locale du modèle Llama 3.2 via Ollama garantit qu’aucune donnée d’enfant ni aucun historique d’apprentissage ne quitte la machine hôte, assurant une conformité exemplaire avec les exigences de protection de l’enfance et un coût d’exploitation maîtrisé', true));

docChildren.push(sectionTitle('5', 'Méthodologie et démarche de développement'));
docChildren.push(p('Le développement d’une application combinant des composants réactifs front-end, une API RESTful et des inférences d’IA nécessite une démarche itérative favorisant la validation progressive des briques logicielles. Nous avons adopté la méthodologie Agile Scrum.'));
docChildren.push(p('Cette approche nous a permis de structurer notre travail en cycles courts dénommés Sprints, rythmés par les réunions de planification, les points d’avancement avec notre encadrante Madame Aïcha FADLI et les démonstrations de recette :'));
docChildren.push(bulletItem('Sprint 0', 'Cadrage, étude de l’existant, spécification des besoins et conception architecturale préliminaire', false));
docChildren.push(bulletItem('Sprint 1', 'Implémentation du socle technique (Express, MySQL, JWT) et développement du module d’authentification et de diagnostic initial', false));
docChildren.push(bulletItem('Sprint 2', 'Conception du moteur d’entraînement par quiz adaptatifs et suivi de la progression par matière', false));
docChildren.push(bulletItem('Sprint 3', 'Réalisation de l’espace d’exercices pratiques, de l’éditeur de réponse et intégration du serveur d’inférence Ollama (Llama 3.2)', false));
docChildren.push(bulletItem('Sprint 4', 'Développement de l’algorithme d’interception stricte des non-réponses, génération dynamique d’exercices, export PDF et tests globaux', true));

docChildren.push(...imageReservation(
  'Schéma du cycle de vie de la méthodologie Agile Scrum illustrant le Product Backlog, le Sprint Planning, les itérations de développement (Sprints), le Daily Scrum, la Revue de Sprint et la Rétrospective.',
  '1.2',
  'Cycle itératif de la méthodologie Agile Scrum appliquée au projet TutorAI'
));

docChildren.push(sectionTitle('6', 'Planning prévisionnel et ordonnancement (01/07 au 01/08)'));
docChildren.push(p('Notre stage au sein de la société UQASE NEXT SARL s’est déroulé sur une durée intensive d’un mois, du 1er juillet au 1er août 2024. Le projet a été planifié selon un découpage hebdomadaire rigoureux réparti sur 5 semaines selon la méthodologie Agile Scrum :'));
docChildren.push(bulletItem('Semaine 1 (01/07 — 07/07)', 'Étude préalable, cadrage du projet et spécification détaillée des besoins fonctionnels', false));
docChildren.push(bulletItem('Semaine 2 (08/07 — 14/07)', 'Conception architecturale UML, modélisation statique et dynamique', false));
docChildren.push(bulletItem('Semaine 3 (15/07 — 21/07)', 'Implémentation du backend Node.js/Express, de la base de données MySQL et des API sécurisées JWT', false));
docChildren.push(bulletItem('Semaine 4 (22/07 — 28/07)', 'Développement des composants Angular 16 et interfaçage avec le moteur d’IA locale Ollama (Llama 3.2)', false));
docChildren.push(bulletItem('Semaine 5 (29/07 — 01/08)', 'Campagne de tests fonctionnels, recette logicielle, validation et rédaction du rapport', true));

docChildren.push(p('Le tableau 1.1 synthétise la matrice calendaire de ces réalisations.', { before: 80, after: 100 }));

// Tableau 1.1
const planningHeaders = ['Étape / Semaine', 'S1 (01–07/07)', 'S2 (08–14/07)', 'S3 (15–21/07)', 'S4 (22–28/07)', 'S5 (29/07–01/08)'];
const planningRows = [
  ['Étude préalable & cadrage', 'X', '', '', '', ''],
  ['Spécification des besoins', 'X', 'X', '', '', ''],
  ['Conception architecturale & UML', '', 'X', '', '', ''],
  ['Réalisation Back-End & Base MySQL', '', 'X', 'X', '', ''],
  ['Réalisation Front-End Angular 16', '', '', 'X', 'X', ''],
  ['Intégration Moteur IA Ollama', '', '', '', 'X', 'X'],
  ['Recette, Tests et Intégration', '', '', '', 'X', 'X'],
  ['Rédaction du rapport et bilan', '', '', '', 'X', 'X']
];

docChildren.push(makeDataTable(planningHeaders, planningRows, [35, 13, 13, 13, 13, 13]));

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 180 },
  children: [
    new TextRun({ text: 'Tableau 1.1 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Planning prévisionnel des étapes du projet (01/07 au 01/08/2024)', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

docChildren.push(...imageReservation(
  'Diagramme de Gantt prévisionnel détaillant le calendrier des tâches, leurs dépendances et les jalons de livraison du projet sur la période du 01/07 au 01/08/2024.',
  '1.3',
  'Diagramme de Gantt prévisionnel du projet'
));

docChildren.push(sectionTitle('7', 'Conclusion'));
docChildren.push(p('Dans ce premier chapitre, nous avons ancré notre projet au cœur d’UQASE NEXT SARL en mettant en lumière le rôle stratégique de Madame Aïcha FADLI à la direction du Département Digital. L’analyse critique de l’existant a confirmé l’intérêt technique et pédagogique de développer la plateforme TutorAI. Grâce à la démarche Agile Scrum et à un ordonnancement rigoureux de nos travaux sur la période du 01/07 au 01/08, le cadre opérationnel a été parfaitement stabilisé. Le chapitre suivant est consacré à la spécification détaillée des besoins du système.'));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 9. CHAPITRE 2 — SPÉCIFICATION DES BESOINS
// -------------------------------------------------------------------------

docChildren.push(...makeChapterCover(
  2,
  ['Spécification', 'des besoins'],
  'Ce chapitre a pour but de traduire les attentes des utilisateurs en exigences logicielles formelles à travers l’expression détaillée des besoins fonctionnels et non fonctionnels, d’identifier les acteurs interagissant avec la plateforme TutorAI, et d’élaborer la modélisation des cas d’utilisation selon les conventions du standard UML.'
));

docChildren.push(sectionTitle('1', 'Introduction'));
docChildren.push(p('La réussite d’un projet informatique dépend de la rigueur apportée à la définition de ses exigences. Ce deuxième chapitre formalise l’analyse des besoins de la plateforme TutorAI. Nous commencerons par décrire exhaustivement les fonctionnalités attendues réparties en modules métier. Nous aborderons ensuite les exigences non fonctionnelles en termes de robustesse, de temps de réponse, de sécurité et d’ergonomie. Enfin, nous identifierons les acteurs du système et nous modéliserons l’ensemble des cas d’utilisation par le biais de diagrammes UML et de fiches descriptives textuelles.'));

docChildren.push(sectionTitle('2', 'Spécification des besoins fonctionnels'));
docChildren.push(p('Les besoins fonctionnels délimitent le champ des actions et traitements que le système doit offrir aux utilisateurs. Nous les avons regroupés en cinq modules clés :'));

docChildren.push(subsectionTitle('2.1', 'Gestion des profils apprenants (6 à 15 ans)'));
docChildren.push(bulletItem('Sous-besoin 1.1', 'Inscription d’un jeune élève (ou de son parent référent) avec recueil du prénom, de l’âge (strictement de 6 à 15 ans), du niveau scolaire (Primaire ou Collège) et des difficultés d’apprentissage spécifiques', false));
docChildren.push(bulletItem('Sous-besoin 1.2', 'Authentification sécurisée avec génération de jetons d’accès chiffrés (JWT) et contrôle de validité des sessions assurant la protection des mineurs', false));
docChildren.push(bulletItem('Sous-besoin 1.3', 'Consultation et mise à jour des données de profil, réinitialisation bienveillante des scores et visualisation des points d’expérience (XP) acquis', true));

docChildren.push(subsectionTitle('2.2', 'Évaluation diagnostique et progression adaptative'));
docChildren.push(bulletItem('Sous-besoin 2.1', 'Mise à disposition d’un questionnaire diagnostique initial ludique et sans pression afin d’estimer le socle de compétences de l’élève', false));
docChildren.push(bulletItem('Sous-besoin 2.2', 'Calcul automatique d’un indice d’assimilation par matière permettant d’affecter l’élève à un palier adaptatif (Palier 1 : Débutant, Palier 2 : Intermédiaire, Palier 3 : Avancé)', false));
docChildren.push(bulletItem('Sous-besoin 2.3', 'Actualisation dynamique du palier pour valoriser les progrès constants et adapter la complexité des énoncés au fil des réussites', true));

docChildren.push(subsectionTitle('2.3', 'Moteur d’entraînement par quiz interactifs'));
docChildren.push(bulletItem('Sous-besoin 3.1', 'Sélection d’une discipline scolaire parmi les programmes du Primaire et du Collège (Mathématiques, Langue française, Langue arabe, Éveil scientifique/SVT, Physique-Chimie, Anglais, Histoire-Géographie)', false));
docChildren.push(bulletItem('Sous-besoin 3.2', 'Génération de sessions de quiz interactifs avec feedback visuel immédiat, indices et navigation claire adaptée aux enfants', false));
docChildren.push(bulletItem('Sous-besoin 3.3', 'Rétroaction immédiate et valorisante à chaque soumission avec explication conceptuelle simple et calcul du score global', true));

docChildren.push(subsectionTitle('2.4', 'Espace d’exercices pratiques et remédiation guidée par IA'));
docChildren.push(bulletItem('Sous-besoin 4.1', 'Affichage d’énoncés pratiques concrets illustrés par des exemples du quotidien, avec questions ordonnées, indices progressifs et rappels de cours', false));
docChildren.push(bulletItem('Sous-besoin 4.2', 'Zone de saisie de réponse avec mécanisme de sauvegarde automatique locale (auto-save) pour préserver le travail de l’élève sans stress de perte', false));
docChildren.push(bulletItem('Sous-besoin 4.3', 'Remédiation continue et bienveillante : détection des blocages et des aveux d’incompréhension (« jsp ») pour déclencher un étayage méthodologique pas-à-pas sans stigmatisation, couplée à une évaluation cognitive par inférence IA fournissant des encouragements, des conseils ciblés et le corrigé type officiel complet', true));

docChildren.push(subsectionTitle('2.5', 'Génération dynamique de contenus et export PDF'));
docChildren.push(bulletItem('Sous-besoin 5.1', 'Modale de génération d’exercices sur mesure permettant à l’élève de choisir une notion difficile pour créer un énoncé inédit adapté à son âge par le Tuteur IA', false));
docChildren.push(bulletItem('Sous-besoin 5.2', 'Exportation vectorielle en temps réel de fiches de cours synthétiques et illustrées au format PDF téléchargeable', true));

docChildren.push(sectionTitle('3', 'Spécification des besoins non fonctionnels'));
docChildren.push(p('Les exigences non fonctionnelles décrivent les caractéristiques de qualité indispensables à l’exploitabilité du système :'));

docChildren.push(subsectionTitle('3.1', 'Sécurité, intégrité et confidentialité des données des mineurs'));
docChildren.push(bulletItem('Cryptographie', 'Hachage à sens unique des mots de passe en base de données par l’algorithme BCrypt avec un sel fort (facteur de coût 10)', false));
docChildren.push(bulletItem('Contrôle d’accès', 'Sécurisation des routes API sensibles par middleware de vérification des jetons JWT', false));
docChildren.push(bulletItem('Intégrité SQL', 'Prévention systématique des injections SQL via l’utilisation exclusive de requêtes préparées paramétrées', false));
docChildren.push(bulletItem('Protection de la vie privée des mineurs', 'Confidentialité totale des données scolaires assurée par le confinement local du modèle de langage Llama 3.2 sous Ollama, sans transmission à des tiers distants', true));

docChildren.push(subsectionTitle('3.2', 'Performance, temps de réponse et scalabilité'));
docChildren.push(bulletItem('Rendu IHM', 'Temps de rendu des interfaces d’entraînement inférieur à 250 millisecondes grâce à l’architecture SPA d’Angular 16', false));
docChildren.push(bulletItem('Inférence LLM', 'Temps d’inférence de l’évaluation IA contenu sous la barre des 3 secondes par l’utilisation de modèles quantifiés GGUF 4-bit optimisés pour processeurs multi-cœurs', false));
docChildren.push(bulletItem('Concurrence', 'Pool de connexions asynchrones au serveur MySQL permettant de traiter les requêtes concurrentes sans blocage d’I/O', true));

docChildren.push(subsectionTitle('3.3', 'Ergonomie, réactivité et accessibilité'));
docChildren.push(bulletItem('Design adaptatif', 'Interface chaleureuse et responsive s’adaptant à l’ensemble des résolutions d’écran (moniteurs haute résolution, ordinateurs portables, tablettes scolaires)', false));
docChildren.push(bulletItem('Accessibilité WCAG', 'Respect des préconisations d’accessibilité numérique WCAG avec des contrastes visuels adaptés, une typographie lisible pour enfants et des libellés ARIA explicites', false));
docChildren.push(bulletItem('Clarté visuelle', 'Clarté de la hiérarchie visuelle guidant intuitivement l’élève vers l’action suivante sans surcharge cognitive', true));

docChildren.push(subsectionTitle('3.4', 'Disponibilité, résilience logicielle et mécanismes de repli'));
docChildren.push(bulletItem('Repli procédural', 'Mécanisme de repli procédural certifié (fallback) garantissant la disponibilité continue du générateur d’exercices même en cas de saturation passagère du démon Ollama', false));
docChildren.push(bulletItem('Tolérance aux pannes', 'Tolérance aux micro-coupures réseau grâce au stockage local des brouillons d’exercices dans le LocalStorage du navigateur', true));

docChildren.push(sectionTitle('4', 'Identification et typologie des acteurs'));
docChildren.push(p('Quatre catégories d’acteurs interagissent avec le système :'));
docChildren.push(bulletItem('Élève (Enfant / Collégien de 6 à 15 ans)', 'Acteur primaire humain qui s’authentifie, passe le test diagnostique, s’entraîne sur les quiz, rédige ses solutions d’exercices pratiques, converse avec son Tuteur IA bienveillant et télécharge les supports PDF', false));
docChildren.push(bulletItem('Parent / Tuteur légal', 'Acteur superviseur accompagnant l’inscription de l’enfant et suivant ses progrès et son assiduité via les synthèses visuelles', false));
docChildren.push(bulletItem('Tuteur IA (Moteur LLM Ollama local)', 'Acteur interne automatisé doué d’empathie pédagogique pour expliquer les notions, guider pas-à-pas et formuler des commentaires motivants', false));
docChildren.push(bulletItem('Administrateur système', 'Acteur secondaire responsable du suivi de la charge machine, de l’état des conteneurs et de l’intégrité de la base de données', true));

docChildren.push(sectionTitle('5', 'Modélisation des cas d’utilisation'));
docChildren.push(subsectionTitle('5.1', 'Diagramme global des cas d’utilisation'));
docChildren.push(p('La figure 2.1 expose l’organisation générale des fonctionnalités de TutorAI et les liens qui unissent les acteurs aux cas d’utilisation.'));

docChildren.push(...imageReservation(
  'Diagramme global des cas d’utilisation UML présentant les acteurs « Étudiant » et « Tuteur IA », ainsi que les cas d’utilisation : S’authentifier, Passer diagnostic, S’entraîner par quiz, Résoudre exercice, Évaluer exercice (<<include>> Analyser complétude, <<invoke>> IA), Générer exercice sur mesure et Télécharger PDF cours.',
  '2.1',
  'Diagramme global des cas d’utilisation UML de la plateforme TutorAI'
));

docChildren.push(subsectionTitle('5.2', 'Description textuelle détaillée des cas d’utilisation majeurs'));
docChildren.push(p('Nous détaillons ci-après les cas d’utilisation névralgiques du système.'));

// CU-01
docChildren.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 100, after: 60 },
  children: [
    new TextRun({ text: 'Tableau 2.1 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Description textuelle du cas d’utilisation « Évaluer un exercice pratique »', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

const cu01Rows = [
  ['Cas d’Utilisation N°', 'CU-01'],
  ['Nom du Cas', 'Évaluation bienveillante et remédiation pas-à-pas'],
  ['Acteur(s)', 'Élève (6 à 15 ans, initiateur), Tuteur IA (système d’inférence)'],
  ['Objectif', 'Analyser la production de l’élève pour chaque question, évaluer les acquis avec équité, formuler des encouragements et afficher le corrigé type officiel étape par étape.'],
  ['Pré-conditions', 'L’élève est authentifié et a sélectionné un exercice dans son espace d’apprentissage.'],
  ['Post-conditions', 'Les points sont comptabilisés, les conseils de remédiation sont affichés et les explications pas-à-pas sont consultables.'],
  ['Scénario nominal', '1. L’élève consulte l’énoncé et saisit sa réponse ou son calcul dans les champs dédiés.\n2. L’élève clique sur « Corriger mes réponses avec le Tuteur IA ».\n3. Le système extrait les réponses et vérifie la présence d’un contenu rédigé.\n4. Le système transmet les éléments au Tuteur IA pour une analyse pédagogique individualisée.\n5. L’IA identifie les étapes réussies, formule des encouragements et calcule la note formative.\n6. Le système affiche la carte de restitution avec les conseils bienveillants et le corrigé type officiel.'],
  ['Scénarios d’exception', '3.a. L’élève a laissé le champ vide ou a exprimé un blocage (« jsp », « je ne sais pas ») :\n— Le système intercepte immédiatement l’aveu d’incompréhension sans complaisance mais avec bienveillance.\n— Le statut « À retravailler avec aide » est notifié sans stigmatisation.\n— Le système affiche des encouragements chaleureux, dévoile les indices méthodologiques et le corrigé complet étape par étape.']
];
docChildren.push(makeTwoColTable(cu01Rows));

// CU-02
docChildren.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 180, after: 60 },
  children: [
    new TextRun({ text: 'Tableau 2.2 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Description textuelle du cas d’utilisation « Générer un nouvel exercice sur mesure »', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

const cu02Rows = [
  ['Cas d’Utilisation N°', 'CU-02'],
  ['Nom du Cas', 'Génération dynamique d’un exercice adapté par l’IA'],
  ['Acteur(s)', 'Élève (6 à 15 ans), Tuteur IA'],
  ['Objectif', 'Créer une mise en situation concrète et ludique avec questions ordonnées, indices et corrigé adapté au cycle scolaire (Primaire ou Collège).'],
  ['Pré-conditions', 'L’élève a cliqué sur le bouton « Générer un exercice avec le Tuteur IA ».'],
  ['Post-conditions', 'Le nouvel exercice adapté est injecté dans la liste active de la matière et sélectionné à l’écran.'],
  ['Scénario nominal', '1. L’élève saisit une notion où il ressent des difficultés ou sélectionne un thème suggéré.\n2. Il choisit le niveau de difficulté souhaité (Débutant, Intermédiaire, Avancé).\n3. L’élève confirme sa demande.\n4. Le Tuteur IA conçoit un énoncé illustré par des exemples familiers, des questions progressives et un corrigé type.\n5. L’exercice est chargé à l’écran, prêt à être exploré.'],
  ['Scénarios d’exception', '4.a. Dépassement du délai de réponse du démon d’inférence :\n— Le système bascule en mode sécurisé sur le générateur heuristique certifié.\n— Un exercice pédagogique adapté est immédiatement mis à disposition sans bloquer l’interface.']
];
docChildren.push(makeTwoColTable(cu02Rows));

// CU-03
docChildren.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { before: 180, after: 60 },
  children: [
    new TextRun({ text: 'Tableau 2.3 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Description textuelle du cas d’utilisation « Passer le test diagnostique initial »', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

const cu03Rows = [
  ['Cas d’Utilisation N°', 'CU-03'],
  ['Nom du Cas', 'Passation du test diagnostique de positionnement'],
  ['Acteur(s)', 'Élève (6 à 15 ans)'],
  ['Objectif', 'Évaluer le socle initial de l’étudiant pour calibrer automatiquement sa trajectoire d’apprentissage.'],
  ['Pré-conditions', 'L’étudiant vient de créer son compte ou choisit de recalibrer son niveau.'],
  ['Post-conditions', 'Un bilan des forces et des axes de progrès est généré et le palier adaptatif de départ est configuré.'],
  ['Scénario nominal', '1. L’étudiant accède au module diagnostique.\n2. Il répond à une série de questions transversales ciblées.\n3. Le système compile les scores par compétence.\n4. L’algorithme calcule le palier initial (Débutant, Intermédiaire ou Avancé).\n5. Le profil est mis à jour et l’étudiant est redirigé vers son tableau de bord personnalisé.']
];
docChildren.push(makeTwoColTable(cu03Rows));

docChildren.push(...imageReservation(
  'Diagramme de cas d’utilisation détaillé du module d’entraînement et d’évaluation, montrant les relations d’inclusion (<<include>>) pour l’analyse de complétude et d’extension (<<extend>>) pour la remédiation et la consultation des indices.',
  '2.2',
  'Diagramme de cas d’utilisation détaillé du module d’entraînement et d’évaluation'
));

docChildren.push(sectionTitle('6', 'Conclusion'));
docChildren.push(p('Ce deuxième chapitre a permis d’établir avec exhaustivité l’ensemble des spécifications fonctionnelles et non fonctionnelles régissant la plateforme TutorAI. La modélisation des acteurs et des cas d’utilisation a mis en exergue l’importance de l’évaluation rigoureuse et du traitement algorithmique des non-réponses. Fort de cette grille d’exigences clarifiée, le chapitre suivant aborde la conception architecturale et conceptuelle du système.'));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 10. CHAPITRE 3 — CONCEPTION DU SYSTÈME
// -------------------------------------------------------------------------

docChildren.push(...makeChapterCover(
  3,
  ['Conception', 'du système'],
  'Ce chapitre vise à concevoir l’architecture technique du système en développant d’une part la modélisation dynamique des interactions via des diagrammes de séquences UML2, de collaboration, d’états et d’activités, d’autre part la modélisation statique à travers le diagramme de classes, le modèle relationnel et le dictionnaire de données, et enfin en spécifiant l’architecture logicielle 3-Tiers et le diagramme de déploiement physique.'
));

docChildren.push(sectionTitle('1', 'Introduction'));
docChildren.push(p('Alors que l’étape de spécification définissait le périmètre de « ce que doit faire » le système, la phase de conception s’attache à formaliser rigoureusement « comment le réaliser ». Ce troisième chapitre détaille les fondements architecturaux et conceptuels de la plateforme TutorAI. Nous présenterons en premier lieu la modélisation dynamique qui décrit la dimension temporelle et comportementale des échanges logiciels. En second lieu, nous exposerons la modélisation statique comprenant le modèle structurel objet, les règles de dérivation relationnelle, le schéma de base de données et le dictionnaire de données. Enfin, nous expliciterons l’architecture technique 3-Tiers ainsi que l’infrastructure de déploiement conteneurisée.'));

docChildren.push(sectionTitle('2', 'Modélisation dynamique du système'));
docChildren.push(p('La modélisation dynamique illustre la collaboration des composants logiciels au fil du temps en réaction aux stimuli des utilisateurs.'));

docChildren.push(subsectionTitle('2.1', 'Diagrammes de séquences système'));
docChildren.push(p('Les diagrammes de séquences mettent en évidence la chronologie des messages échangés entre les lignes de vie (lifelines). Nous exploitons les fragments d’interaction structurés de la norme UML 2 :'));
docChildren.push(bulletItem('Fragment alt (alternative)', 'modélise les bifurcations logiques mutuellement exclusives (condition if-then-else)', false));
docChildren.push(bulletItem('Fragment opt (optionnel)', 'isole un bloc de traitement exécuté uniquement sous réserve d’une condition préalable', false));
docChildren.push(bulletItem('Fragment loop (boucle)', 'réitère une suite d’échanges tant qu’un prédicat demeure vérifié', true));

docChildren.push(subsubsectionTitle('2.1.1', 'Diagramme de séquences de l’authentification'));
docChildren.push(p('La figure 3.1 retrace le processus de connexion d’un étudiant avec contrôle cryptographique du mot de passe et génération d’un jeton JWT.'));

docChildren.push(...imageReservation(
  'Diagramme de séquences UML2 du processus d’authentification comprenant les lignes de vie Étudiant, AuthComponent (UI), AuthController (API) et Base MySQL, avec le fragment alt modélisant les branches [Hash BCrypt valide -> 200 OK + Token JWT] et [Identifiants invalides -> 401 Unauthorized].',
  '3.1',
  'Diagramme de séquences UML2 du processus d’authentification sécurisée'
));

docChildren.push(subsubsectionTitle('2.1.2', 'Diagramme de séquences de l’évaluation rigoureuse d’un exercice'));
docChildren.push(p('La figure 3.2 modélise l’enchaînement des requêtes lors de la correction d’une production d’étudiant, matérialisant la détection algorithmique des mentions évasives (« jsp ») pour court-circuiter le modèle de langage et attribuer immédiatement la note de 0/100.'));

docChildren.push(...imageReservation(
  'Diagramme de séquences UML2 de l’évaluation d’un exercice entre Étudiant, ExercisesComponent, AiLearningRoutes, AiQuizExerciseService et Ollama (Llama 3.2), incluant le fragment alt [isNonAnswer == true -> court-circuit, note 0/100, corrigé type] et [réponse rédigée -> inférence LLM locale, calcul pondéré].',
  '3.2',
  'Diagramme de séquences UML2 de l’évaluation rigoureuse d’un exercice pratique avec le Tuteur IA'
));

docChildren.push(subsectionTitle('2.2', 'Diagrammes de collaboration'));
docChildren.push(p('Le diagramme de collaboration (ou diagramme de communication) met l’accent sur l’organisation structurelle des entités logicielles et l’ordonnancement numéroté des messages qui transitent entre elles. Dans TutorAI, l’orchestrateur pédagogique AiLearningService coordonne les appels vers le gestionnaire d’état de session, le client HTTP et les modules de persistance locale.'));

docChildren.push(...imageReservation(
  'Diagramme de collaboration UML représentant les liens et messages numérotés entre ExercisesComponent, AiLearningService, SessionService, LocalStorageService et le serveur backend Express.',
  '3.3',
  'Diagramme de collaboration entre les services du sous-système de tutorat'
));

docChildren.push(subsectionTitle('2.3', 'Diagramme d’états-transitions'));
docChildren.push(p('Le cycle de vie d’un exercice pratique au cours de la session d’un apprenant obéit à l’automate à états finis représenté sur la figure 3.4. Les états successifs sont : Non commencé, En cours de rédaction, En cours d’évaluation, Validé (Score >= 50) ou Non validé (Score < 50 ou mention « jsp »), avec possibilité de réinitialiser la tentative.'));

docChildren.push(...imageReservation(
  'Diagramme d’états-transitions UML illustrant le cycle de vie d’un exercice pratique : état initial, Non commencé, En cours de rédaction (avec auto-save), En cours d’évaluation, Validé (crédit XP), Non validé (réessai possible) et état final.',
  '3.4',
  'Diagramme d’états-transitions du cycle de vie d’un exercice pratique'
));

docChildren.push(subsectionTitle('2.4', 'Diagramme d’activités'));
docChildren.push(p('La figure 3.5 détaille le flot de contrôle algorithmique activé lors de la soumission d’une réponse. L’embranchement décisionnel permet d’isoler immédiatement les copies non traitées pour leur attribuer la note plancher sans surcharger le moteur d’inférence.'));

docChildren.push(...imageReservation(
  'Diagramme d’activités UML du processus d’évaluation montrant la collecte des champs de réponse, le test de vacuité/jsp, la branche sanction directe (0/100 + corrigé officiel) et la branche prompt strict avec inférence LLM et agrégation de la moyenne.',
  '3.5',
  'Diagramme d’activités de l’évaluation adaptative et de l’interception des non-réponses'
));

docChildren.push(sectionTitle('3', 'Modélisation statique du système'));
docChildren.push(p('La modélisation statique spécifie l’organisation structurelle des données métier et leurs relations d’intégrité référentielle.'));

docChildren.push(subsectionTitle('3.1', 'Diagramme de classes métier'));
docChildren.push(p('Le diagramme de classes de la figure 3.6 modélise les entités fondamentales du système TutorAI : Student, LearningProfile, SubjectProgress, QuizSession, ExerciseItem et EvaluationResult.'));

docChildren.push(...imageReservation(
  'Diagramme de classes UML montrant les classes métier, leurs attributs typés, leurs méthodes publiques et privées, ainsi que leurs multiplicités et relations d’association et de composition (Student 1 -- 1 LearningProfile, Student 1 -- * SubjectProgress, etc.).',
  '3.6',
  'Diagramme de classes métier du domaine TutorAI'
));

docChildren.push(subsectionTitle('3.2', 'Règles formelles de passage au modèle relationnel'));
docChildren.push(p('La dérivation du diagramme de classes vers le Modèle Logique de Données (MLD) obéit aux règles de transformation standardisées :'));
docChildren.push(bulletItem('Transformation des classes', 'Toute classe d’entité devient une table (relation) dans le schéma relationnel, et ses attributs deviennent les colonnes de cette table', false));
docChildren.push(bulletItem('Identification des clés primaires', 'L’identifiant unique de la classe devient la clé primaire soulignée de la relation', false));
docChildren.push(bulletItem('Associations binaires 1-à-Plusieurs (1..*)', 'La clé primaire de la table située du côté de la cardinalité 1 migre en tant que clé étrangère précédée d’un dièse (#clé) dans la table du côté de la cardinalité N', false));
docChildren.push(bulletItem('Normalisation 3FN', 'L’ensemble des relations est conçu pour respecter les critères de la Troisième Forme Normale (3FN), garantissant l’absence de redondances transitives et l’atomicité de chaque attribut', true));

docChildren.push(subsectionTitle('3.3', 'Modèle Logique de Données (MLD) en 3FN'));
docChildren.push(p('Le schéma relationnel obtenu après normalisation s’énonce comme suit :'));
docChildren.push(bulletItem('STUDENTS', '(id [PK], email, password_hash, first_name, education_level, created_at)', false));
docChildren.push(bulletItem('LEARNING_PROFILES', '(id [PK], #student_id [FK], current_subject, total_xp, learning_preferences, updated_at)', false));
docChildren.push(bulletItem('SUBJECT_PROGRESS', '(id [PK], #student_id [FK], subject, quizzes_completed, exercises_completed, average_score, adaptive_difficulty, level_index, updated_at)', false));
docChildren.push(bulletItem('DIAGNOSTIC_RESULTS', '(id [PK], #student_id [FK], score, strengths, weaknesses, created_at)', false));
docChildren.push(bulletItem('SAVED_EXERCISES', '(id [PK], #student_id [FK], subject, exercise_data, completed, score, created_at)', true));

docChildren.push(...imageReservation(
  'Schéma physique et relationnel (MLD) de la base de données MySQL matérialisant les clés primaires soulignées, les clés étrangères et les liaisons d’intégrité référentielle entre tables.',
  '3.7',
  'Schéma physique et relationnel de la base de données (MLD)'
));

docChildren.push(subsectionTitle('3.4', 'Dictionnaire de données'));
docChildren.push(p('Le tableau 3.1 recense de manière exhaustive les colonnes de la base de données, leurs types de données, tailles, contraintes de nullité, valeurs par défaut et affectations de clés.'));

// Tableau 3.1 Data Dictionary
const dictHeaders = ['Nom colonne', 'Type', 'Taille', 'Oblig.', 'Défaut', 'Valeurs autorisées', 'Clé P.', 'Clé É.', 'Table'];
const dictRows = [
  ['id', 'VARCHAR', '36', 'Oui', 'UUID()', 'Format UUID v4', 'Oui', 'Non', 'students'],
  ['email', 'VARCHAR', '255', 'Oui', 'NULL', 'Chaîne format email', 'Non', 'Non', 'students'],
  ['password_hash', 'VARCHAR', '255', 'Oui', 'NULL', 'Hash BCrypt (60 car.)', 'Non', 'Non', 'students'],
  ['first_name', 'VARCHAR', '100', 'Non', 'NULL', 'Lettres alphabétiques', 'Non', 'Non', 'students'],
  ['education_level', 'VARCHAR', '100', 'Non', 'Lycée', 'Lycée, Supérieur...', 'Non', 'Non', 'students'],
  ['created_at', 'DATETIME', '—', 'Oui', 'NOW()', 'Timestamp d’insertion', 'Non', 'Non', 'students'],
  ['id', 'VARCHAR', '36', 'Oui', 'UUID()', 'Format UUID v4', 'Oui', 'Non', 'learning_profiles'],
  ['student_id', 'VARCHAR', '36', 'Oui', 'NULL', 'Référence students.id', 'Non', 'Oui', 'learning_profiles'],
  ['current_subject', 'VARCHAR', '100', 'Oui', 'General', 'Matière active', 'Non', 'Non', 'learning_profiles'],
  ['total_xp', 'INT', '—', 'Oui', '0', 'Entier >= 0', 'Non', 'Non', 'learning_profiles'],
  ['updated_at', 'DATETIME', '—', 'Oui', 'NOW()', 'Timestamp mise à jour', 'Non', 'Non', 'learning_profiles'],
  ['id', 'VARCHAR', '36', 'Oui', 'UUID()', 'Format UUID v4', 'Oui', 'Non', 'subject_progress'],
  ['student_id', 'VARCHAR', '36', 'Oui', 'NULL', 'Référence students.id', 'Non', 'Oui', 'subject_progress'],
  ['subject', 'VARCHAR', '100', 'Oui', 'NULL', 'Intitulé discipline', 'Non', 'Non', 'subject_progress'],
  ['quizzes_completed', 'INT', '—', 'Oui', '0', 'Entier >= 0', 'Non', 'Non', 'subject_progress'],
  ['exercises_completed', 'INT', '—', 'Oui', '0', 'Entier >= 0', 'Non', 'Non', 'subject_progress'],
  ['average_score', 'DECIMAL', '5,2', 'Oui', '0.00', '[0.00 ; 100.00]', 'Non', 'Non', 'subject_progress'],
  ['adaptive_difficulty', 'VARCHAR', '50', 'Oui', 'Débutant', 'Débutant, Interm., Avancé', 'Non', 'Non', 'subject_progress'],
  ['level_index', 'INT', '—', 'Oui', '1', '1, 2 ou 3', 'Non', 'Non', 'subject_progress']
];

docChildren.push(makeDataTable(dictHeaders, dictRows, [16, 10, 8, 8, 10, 24, 8, 8, 8]));

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 180 },
  children: [
    new TextRun({ text: 'Tableau 3.1 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Dictionnaire de données du système TutorAI', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

docChildren.push(sectionTitle('4', 'Architecture globale du système'));
docChildren.push(subsectionTitle('4.1', 'Architecture logicielle 3-Tiers'));
docChildren.push(p('L’architecture de TutorAI est construite selon le modèle en trois couches indépendantes (3-Tiers) :'));
docChildren.push(bulletItem('Couche Présentation (Tier 1 - Front-End)', 'Application monopage développée sous Angular 16. Elle gère le rendu dynamique du DOM, la capture des événements utilisateurs, la réactivité via les flux RxJS et la gestion des sessions locales', false));
docChildren.push(bulletItem('Couche Métier et Services (Tier 2 - Back-End)', 'Serveur d’application Node.js s’appuyant sur le framework Express 5. Il héberge les contrôleurs REST, les validateurs de requêtes, le service d’interception stricte des non-réponses et l’orchestration des appels vers le moteur IA', false));
docChildren.push(bulletItem('Couche Données et Inférence (Tier 3 - SGBD & LLM)', 'Composée du serveur relationnel MySQL 8.0 pour la persistance transactionnelle des états et du démon Ollama hébergeant Llama 3.2 pour l’inférence générative locale', true));

docChildren.push(...imageReservation(
  'Diagramme de composants UML illustrant l’architecture 3-Tiers : Couche Présentation (Composants Standalone Angular 16), Couche Métier (API REST Express 5, Services d’évaluation) et Couche Données (Base MySQL 8.0 et Moteur d’Inférence IA Ollama Llama 3.2).',
  '3.8',
  'Diagramme de composants de l’architecture logicielle 3-Tiers'
));

docChildren.push(subsectionTitle('4.2', 'Architecture matérielle et diagramme de déploiement'));
docChildren.push(p('La figure 3.9 expose le diagramme de déploiement physique précisant les nœuds matériels, les conteneurs logiciels et les canaux de communication inter-réseaux.'));

docChildren.push(...imageReservation(
  'Diagramme de déploiement matériel et réseau montrant le nœud Navigateur Client communiquant en HTTPS avec le Serveur Applicatif Node.js, relié par socket TCP/IP 3306 au SGBD MySQL et par socket HTTP 11434 au conteneur du Moteur d’Inférence IA Ollama.',
  '3.9',
  'Diagramme de déploiement matériel et réseau de la plateforme'
));

docChildren.push(sectionTitle('5', 'Conclusion'));
docChildren.push(p('Au terme de ce troisième chapitre, la conception architecturale, dynamique et statique de la plateforme TutorAI a été entièrement consolidée. Les diagrammes de séquences UML2 ont notamment permis de formaliser les mécanismes de détection stricte des non-réponses. Grâce à un schéma relationnel normalisé en 3FN et à une architecture 3-Tiers découplée, le système est prêt pour sa concrétisation technique, présentée dans le chapitre suivant.'));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 11. CHAPITRE 4 — RÉALISATION DU SYSTÈME
// -------------------------------------------------------------------------

docChildren.push(...makeChapterCover(
  4,
  ['Réalisation', 'du système'],
  'Ce chapitre vise à présenter l’environnement matériel et logiciel ayant servi au développement de TutorAI, à détailler la mise en œuvre et le rendu visuel des principales interfaces graphiques de la plateforme accompagnées d’un commentaire analytique circonstancié, et à exposer les résultats probants de la campagne de tests et de recette fonctionnelle.'
));

docChildren.push(sectionTitle('1', 'Introduction'));
docChildren.push(p('La phase de réalisation constitue l’aboutissement pratique des étapes antérieures d’analyse et de conception. Ce quatrième chapitre documente l’implémentation effective de la plateforme TutorAI. Dans un premier temps, nous décrivons les configurations matérielles et logicielles mobilisées pour orchestrer l’environnement d’exécution et d’inférence. Dans un deuxième temps, nous passons en revue les interfaces graphiques phares développées sous Angular 16, en explicitant le parcours utilisateur complet de l’apprenant. Enfin, nous dressons le bilan des tests de recette fonctionnelle validant la conformité du système aux exigences de départ.'));

docChildren.push(sectionTitle('2', 'Environnement de développement et outillage'));
docChildren.push(subsectionTitle('2.1', 'Environnement matériel'));
docChildren.push(p('L’entraînement et l’inférence des modèles de langage en local imposent des contraintes matérielles substantielles. Notre banc de développement disposait des spécifications suivantes :'));
docChildren.push(bulletItem('Processeur (CPU)', 'AMD Ryzen 7 / Intel Core i7 8 cœurs / 16 threads cadencé à 3.8 GHz', false));
docChildren.push(bulletItem('Mémoire vive (RAM)', '32 Go DDR4 à 3200 MHz, indispensable pour charger en mémoire le modèle Llama 3.2 quantifié tout en maintenant l’exécution conjointe des serveurs Node.js et Angular CLI', false));
docChildren.push(bulletItem('Stockage secondaire', 'Disque SSD NVMe M.2 de 1 To offrant des débits séquentiels de lecture supérieurs à 3500 Mo/s, réduisant à moins de 2 secondes le chargement des poids du modèle', false));
docChildren.push(bulletItem('Accélération graphique', 'Carte graphique dédiée assurant l’accélération matricielle lors des passes d’inférence sous Ollama', true));

docChildren.push(subsectionTitle('2.2', 'Environnement logiciel et technologies retenues'));
docChildren.push(p('La stack technologique a été sélectionnée pour sa fiabilité industrielle, sa modernité et ses performances :'));
docChildren.push(bulletItem('Front-End', 'Framework Angular 16 fondé sur TypeScript 5.1. Nous avons tiré parti des Standalone Components pour alléger la structure de modules, d’Angular Material pour les icônes vectorielles et de feuilles de style SCSS modulaires garantissant un design moderne sans dépendances excessives', false));
docChildren.push(bulletItem('Back-End', 'Runtime Node.js 20 LTS couplé au framework Express 5. Le routage asynchrone permet une gestion fluide des requêtes entrantes, tandis que la bibliothèque mysql2 avec pool de connexions optimise les échanges avec la base de données', false));
docChildren.push(bulletItem('Moteur d’IA Locale', 'Démon Ollama exécutant le modèle Llama 3.2 (format quantifié 4-bit GGUF). Cette configuration offre une inférence ultra-rapide tout en préservant l’intégrité et la confidentialité des productions des apprenants', false));
docChildren.push(bulletItem('Persistance et Conteneurisation', 'Système de gestion de base de données relationnelle MySQL 8.0 orchestré sous conteneur Docker via Docker Compose', false));
docChildren.push(bulletItem('Génération documentaire', 'Bibliothèque PDFKit pour la synthèse et l’exportation vectorielle en streaming de fiches de révision académiques', false));
docChildren.push(bulletItem('Outillage d’ingénierie', 'IDE Visual Studio Code, gestionnaire de versions Git, et client Postman pour le profilage et le test unitaire des API REST', true));

docChildren.push(sectionTitle('3', 'Réalisation et présentation des interfaces graphiques'));
docChildren.push(p('Chaque interface est présentée ci-dessous puis assortie d’un commentaire analytique approfondi.'));

// 4.3.1
docChildren.push(subsectionTitle('3.1', 'Module d’accès et authentification'));
docChildren.push(p('La figure 4.1 montre l’interface d’authentification et de création de compte de la plateforme.'));
docChildren.push(...imageReservation(
  'Capture d’écran de l’interface d’authentification et d’inscription présentant le formulaire moderne avec validation en temps réel des champs email, mot de passe, niveau d’études et bouton de soumission sécurisé.',
  '4.1',
  'Interface de connexion et d’inscription sécurisée'
));
docChildren.push(p('Commentaire analytique : Cette interface épurée met en œuvre une validation réactive des entrées en amont de toute transmission réseau. Dès la soumission, un jeton chiffré JWT est généré et conservé dans la session de l’étudiant, autorisant l’accès transparent aux modules pédagogiques réservés.', { italics: true }));

// 4.3.2
docChildren.push(subsectionTitle('3.2', 'Tableau de bord apprenant et suivi des compétences'));
docChildren.push(p('La figure 4.2 présente l’écran d’accueil personnalisé de l’apprenant après connexion.'));
docChildren.push(...imageReservation(
  'Capture d’écran du tableau de bord de l’apprenant affichant le bandeau d’accueil, le compteur de points d’expérience (XP), le palier adaptatif actif (Palier 2 : Intermédiaire), le sélecteur de disciplines et le bouton héroïque de génération IA.',
  '4.2',
  'Tableau de bord de l’apprenant avec indicateurs de progression adaptative'
));
docChildren.push(p('Commentaire analytique : Le tableau de bord offre une synthèse ergonomique des acquis de l’étudiant. Il met en exergue sa progression globale par discipline, son palier adaptatif calculé dynamiquement ainsi que son solde de points d’expérience (XP). Un sélecteur horizontal permet de basculer instantanément d’une discipline à une autre, tandis qu’un bouton héroïque permet d’ouvrir à tout moment la modale de génération d’exercices personnalisés.', { italics: true }));

// 4.3.3
docChildren.push(subsectionTitle('3.3', 'Espace de test diagnostique initial'));
docChildren.push(p('La figure 4.3 illustre la vue de passation du questionnaire diagnostique de positionnement.'));
docChildren.push(...imageReservation(
  'Capture d’écran du test diagnostique initial composé de questions d’évaluation ciblées avec jauges d’estimation des forces et faiblesses cognitives de l’étudiant.',
  '4.3',
  'Interface du test diagnostique initial de positionnement des compétences'
));
docChildren.push(p('Commentaire analytique : Ce composant permet de sonder les connaissances préalables de l’étudiant à travers des questions conceptuelles ciblées. Les résultats obtenus alimentent l’algorithme adaptatif afin d’attribuer d’emblée à l’étudiant le palier d’apprentissage correspondant exactement à ses besoins réels.', { italics: true }));

// 4.3.4
docChildren.push(subsectionTitle('3.4', 'Module d’entraînement par quiz interactif'));
docChildren.push(p('La figure 4.4 expose l’interface d’un quiz interactif calibré selon le niveau de l’étudiant.'));
docChildren.push(...imageReservation(
  'Capture d’écran d’une session de quiz adaptatif montrant la question chronométrée, les options de réponses à choix unique, et le bandeau d’explication conceptuelle affiché dès la sélection d’une proposition.',
  '4.4',
  'Interface de passation d’un quiz interactif avec rétroaction immédiate'
));
docChildren.push(p('Commentaire analytique : Le module de quiz offre une interactivité temps réel. Dès la validation d’une option, l’étudiant bénéficie d’une explication conceptuelle immédiate indiquant le fondement théorique de la réponse attendue, favorisant un ancrage mémoriel rapide.', { italics: true }));

// 4.3.5
docChildren.push(subsectionTitle('3.5', 'Espace de résolution et de saisie d’un exercice pratique'));
docChildren.push(p('La figure 4.5 présente l’environnement de résolution d’un cas pratique structuré.'));
docChildren.push(...imageReservation(
  'Capture d’écran de l’espace de résolution d’exercice comprenant le texte de mise en situation, les questions ordonnées, les indices dépliables, la zone d’édition avec indicateur d’auto-sauvegarde et les boutons d’action d’évaluation.',
  '4.5',
  'Espace de travail et éditeur de réponse à un exercice pratique'
));
docChildren.push(p('Commentaire analytique : Cet espace compartimente clairement la situation-problème, les questions ordonnées et le champ de réponse de l’étudiant. Un module d’arrière-plan surveille en temps réel la frappe pour sauvegarder automatiquement les brouillons dans le stockage local du navigateur.', { italics: true }));

// 4.3.6
docChildren.push(subsectionTitle('3.6', 'Bilan méthodologique et restitution du corrigé officiel'));
docChildren.push(p('La figure 4.6 illustre la carte de restitution consécutive à une soumission sanctionnée par l’algorithme d’intransigeance face à une mention évasive (« jsp »).'));
docChildren.push(...imageReservation(
  'Capture d’écran de la carte de restitution de correction affichant la note rigoureuse de 0/100 (Badge rouge « Non validé »), l’explication méthodologique du refus de complaisance et le corrigé type officiel complet étape par étape.',
  '4.6',
  'Restitution sans complaisance avec sanction 0/100 et corrigé type détaillé'
));
docChildren.push(p('Commentaire analytique : Cette interface illustre le principe d’impartialité absolue incarné par TutorAI. Face à une saisie de type « jsp », l’application sanctionne la non-réponse par la note réelle de 0/100, tout en fournissant immédiatement le corrigé type officiel détaillé afin que l’étudiant puisse comprendre la méthode attendue et retenter l’exercice.', { italics: true }));

// 4.3.7
docChildren.push(subsectionTitle('3.7', 'Modale de génération de cas pratiques par le Tuteur IA'));
docChildren.push(p('La figure 4.7 présente la fenêtre modale permettant de commander un exercice sur-mesure au modèle de langage local.'));
docChildren.push(...imageReservation(
  'Capture d’écran de la modale de génération paramétrée comprenant le champ de saisie du mot-clé thématique, le sélecteur de palier de difficulté (Débutant, Intermédiaire, Avancé) et le bouton d’action de synthèse par le Tuteur IA.',
  '4.7',
  'Modale de génération paramétrée d’un nouveau cas pratique par le Tuteur IA'
));
docChildren.push(p('Commentaire analytique : Grâce à ce formulaire modal, l’étudiant personnalise sa séance de révision en orientant le modèle Llama 3.2 vers des notions précises. Le générateur crée en quelques secondes un énoncé cohérent, des questions graduées et une solution complète.', { italics: true }));

// 4.3.8
docChildren.push(subsectionTitle('3.8', 'Module de téléchargement et d’exportation PDF'));
docChildren.push(p('La figure 4.8 montre l’écran de consultation et de téléchargement de fiches de cours PDF.'));
docChildren.push(...imageReservation(
  'Capture d’écran du module d’exportation PDF affichant la liste des synthèses de cours disponibles et le déclenchement du téléchargement vectoriel généré dynamiquement par le service PDFKit.',
  '4.8',
  'Interface de téléchargement et aperçu d’une fiche de cours vectorielle PDF'
));
docChildren.push(p('Commentaire analytique : Ce composant permet à l’apprenant d’exporter hors-ligne des documents de révision soignés générés en streaming par le serveur Express via la bibliothèque PDFKit.', { italics: true }));

docChildren.push(sectionTitle('4', 'Tests de validation et recette fonctionnelle'));
docChildren.push(p('Afin de garantir la conformité logicielle du système avant son déploiement, une batterie exhaustive de tests de recette a été exécutée. Le tableau 4.1 synthétise les cas de tests représentatifs.'));

// Tableau 4.1
const testHeaders = ['Identifiant', 'Cas de test vérifié', 'Données d’entrée', 'Comportement attendu', 'Résultat constaté', 'Statut'];
const testRows = [
  ['TEST-01', 'Authentification valide', 'Email et mot de passe corrects', 'Émission JWT et redirection /dashboard', 'Token délivré, redirection immédiate', 'CONFORME'],
  ['TEST-02', 'Authentification erronée', 'Mot de passe erroné', 'Refus HTTP 401 et message d’alerte', 'Alerte affichée, session bloquée', 'CONFORME'],
  ['TEST-03', 'Remédiation blocage', 'Saisie de « jsp » question 1', 'Interception bienveillante, indices et corrigé', 'Badge d\'aide activé, corrigé décomposé', 'CONFORME'],
  ['TEST-04', 'Évaluation réponse rédigée', 'Calcul de fractions et justifications', 'Inférence LLM, encouragements et conseils', 'Score de 85/100 et feedback encourageant', 'CONFORME'],
  ['TEST-05', 'Génération exercice IA', 'Thème « Géométrie & Périmètre » Collège', 'Création énoncé concret + indices + corrigé', 'Exercice inédit généré en 2.4s', 'CONFORME'],
  ['TEST-06', 'Export cours PDF', 'Clic téléchargement Mathématiques', 'Streaming fiche synthétique vectorielle', 'Fiche PDF claire téléchargée et lisible', 'CONFORME'],
  ['TEST-07', 'Bascule adaptative', 'Validation 3 exercices score >= 80', 'Promotion automatique Palier 2', 'Palier 2 activé, XP crédités', 'CONFORME']
];

docChildren.push(makeDataTable(testHeaders, testRows, [12, 22, 20, 24, 14, 8]));

docChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 180 },
  children: [
    new TextRun({ text: 'Tableau 4.1 : ', font: 'Times New Roman', size: 22, bold: true }),
    new TextRun({ text: 'Matrice de recette et validation des cas de tests fonctionnels', font: 'Times New Roman', size: 22, italics: true })
  ]
}));

docChildren.push(sectionTitle('5', 'Conclusion'));
docChildren.push(p('Ce quatrième chapitre a démontré la concrétisation technique rigoureuse de la plateforme TutorAI. L’environnement matériel et logiciel a permis de déployer un modèle de langage performant en local tout en garantissant des temps de réponse rapides et la sécurité des données des élèves mineurs. Les interfaces graphiques développées conjuguent modernité ergonomique et bienveillance pédagogique, comme l’attestent les résultats exemplaires de la recette fonctionnelle.'));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 12. CONCLUSION GÉNÉRALE (STRICTLY 1 UNIFIED PAGE, NO BULLET POINTS)
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Conclusion Générale'));

docChildren.push(p([
  { text: 'Le stage de perfectionnement que nous avons effectué du 1er juillet au 1er août 2026 au sein de la société ' },
  { text: 'UQASE NEXT SARL', bold: true },
  { text: ' à Casablanca a constitué une étape charnière et hautement formatrice dans notre parcours d’élève-ingénieur en Ingénierie Informatique et Réseaux à l’École Marocaine des Sciences de l’Ingénieur (EMSI). Cette immersion professionnelle intensive de cinq semaines nous a offert l’opportunité concrète de mettre en pratique l’ensemble des connaissances conceptuelles, méthodologiques et architecturales acquises tout au long de notre cursus, tout en répondant à un défi sociétal majeur : l’accompagnement personnalisé des enfants et adolescents (âgés de 6 à 15 ans, cycles primaire et collège) confrontés à des difficultés scolaires persistantes. Face aux risques d’échec précoce et d’isolement devant les devoirs, nous avons mené à terme avec succès la conception, la modélisation et le développement complet de la solution ' },
  { text: 'TutorAI', bold: true, color: COLOR_NAVY },
  { text: '. Ce système se démarque par son architecture 3-Tiers robuste et souveraine, associant une interface monopage réactive développée sous Angular 16, un serveur de services sous Node.js/Express et un moteur d’inférence d’intelligence artificielle locale basé sur Ollama et le modèle Llama 3.2 quantifié, garantissant la confidentialité absolue des données des élèves mineurs. L’intégration d’un parcours diagnostique bienveillant, d’un tuteur conversationnel chaleureux et patient, ainsi que d’un mécanisme de remédiation décomposant pas-à-pas les solutions pour débloquer l’élève sans le stigmatiser, confère à la plateforme une véritable dimension d’innovation pédagogique. Sur le plan managérial et humain, la pratique rigoureuse de la démarche Agile Scrum sous la direction bienveillante et l’accompagnement stratégique de notre encadrante professionnelle, ' },
  { text: 'Madame Aïcha FADLI', bold: true, color: COLOR_EMSI_RED },
  { text: ', Responsable Digitale, nous a permis de rythmer nos livrables en cycles itératifs équilibrés et de surmonter avec efficacité les défis techniques de l’inférence locale sur des ressources confinées. Portant un regard critique et constructif sur notre réalisation, nous identifions des perspectives d’évolution prometteuses, notamment l’intégration de l’interaction vocale avec Whisper pour les enfants éprouvant des difficultés en lecture, l’enrichissement documentaire par RAG connecté aux manuels scolaires officiels, et le renforcement des synthèses visuelles pour les parents. En définitive, ce projet de fin d’année confirme avec force notre vocation d’ingénieur logiciel, capable de concevoir et déployer des architectures applicatives innovantes, éthiques et pérennes au service de l’éducation et de la réussite de chaque enfant.' }
], { line: 360, before: 120, after: 120 }));

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 13. BIBLIOGRAPHIE ET NÉTOGRAPHIE
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Bibliographie et Nétographie'));

docChildren.push(sectionTitle('1', 'Bibliographie'));

const biblio = [
  'ROQUES, Pascal. UML 2 par la pratique : Études de cas et exercices corrigés. 5ème édition. Paris : Éditions Eyrolles, 2006. 380 pages. ISBN : 978-2212120141.',
  'AUDIBERT, Laurent. UML 2 : De l’apprentissage à la pratique. Paris : Éditions Ellipses, 2009. 288 pages. ISBN : 978-2729852696.',
  'GAMMA, Erich, HELM, Richard, JOHNSON, Ralph, et VLISSIDES, John. Design Patterns : Catalogue de modèles de conception réutilisables. Paris : Vuibert, 1999. 496 pages. ISBN : 978-2711786442.',
  'CHACON, Scott, et STRAUB, Ben. Pro Git. 2ème édition. New York : Apress, 2014. 456 pages. ISBN : 978-1484200773.'
];

biblio.forEach((item, idx) => {
  docChildren.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 454, hanging: 240 },
    spacing: { line: 320, before: 60, after: 80 },
    children: [
      new TextRun({ text: `[${idx + 1}] `, font: 'Times New Roman', size: 24, bold: true, color: COLOR_NAVY }),
      new TextRun({ text: item, font: 'Times New Roman', size: 24, color: COLOR_DARK_TEXT })
    ]
  }));
});

docChildren.push(sectionTitle('2', 'Nétographie'));

const netog = [
  ['Angular Documentation officielle', 'Angular Standalone Components and Reactive Forms Guide. Disponible sur : https://angular.io/docs (consulté en mai 2024).'],
  ['Node.js Documentation officielle', 'Node.js v20.x Runtime API and Event Loop Architecture. Disponible sur : https://nodejs.org/en/docs/ (consulté en avril 2024).'],
  ['Ollama Project', 'Local Large Language Models Deployment and API Reference. Disponible sur : https://ollama.ai/ (consulté en mars 2024).'],
  ['Express.js Guide', 'Express Routing, Middleware and Error Handling Specification. Disponible sur : https://expressjs.com/ (consulté en mars 2024).'],
  ['UML Diagrams Reference', 'Unified Modeling Language 2.5 Specification Guidelines. Disponible sur : https://www.uml-diagrams.org/ (consulté en février 2024).']
];

netog.forEach(([title, urlInfo], idx) => {
  docChildren.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 454, hanging: 240 },
    spacing: { line: 320, before: 60, after: 80 },
    children: [
      new TextRun({ text: `[${idx + 1}] `, font: 'Times New Roman', size: 24, bold: true, color: COLOR_EMSI_GREEN }),
      new TextRun({ text: title + ' : ', font: 'Times New Roman', size: 24, bold: true, color: '000000' }),
      new TextRun({ text: urlInfo, font: 'Times New Roman', size: 24, color: COLOR_DARK_TEXT })
    ]
  }));
});

docChildren.push(new Paragraph({ children: [new PageBreak()] }));

// -------------------------------------------------------------------------
// 14. ANNEXES
// -------------------------------------------------------------------------

docChildren.push(frontMatterTitle('Annexes'));

docChildren.push(sectionTitle('A', 'Extraits d’algorithmes et de code source représentatifs'));
docChildren.push(p('Fonction algorithmique d’interception des non-réponses et mentions évasives (ai-quiz-exercise.service.js) :', { bold: true, before: 100, after: 80 }));

const codeAlgorithm = `/**
 * Détecte si la réponse saisie par l'étudiant constitue une non-réponse
 * ou un aveu d'incompréhension devant être sanctionné par 0/100.
 * @param {string} text - Contenu brut saisi par l'apprenant
 * @returns {boolean} - Vrai si non-réponse avérée, faux sinon
 */
function isNonAnswer(text) {
  if (!text) return true;
  const raw = String(text).trim();
  if (raw.length === 0) return true;

  // Normalisation des accents et de la ponctuation
  const clean = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[.,\\/#!$%\\^&\\*;:{}=\\-_~\`()?'"«»\\\\]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();

  if (!clean || clean.length === 0) return true;

  const nonAnswerExact = new Set([
    'jsp', 'jsais pas', 'j sais pas', 'je sais pas', 'je ne sais pas', 'sais pas',
    'chepa', 'che pas', 'chpa', 'idk', 'i dont know', 'dont know',
    'rien', 'rien du tout', 'aucun', 'aucune', 'aucune idee', 'pas compris',
    'aide moi', 'help', 'sos', 'bloque', 'bof', 'non', 'null', 'vide', 'test'
  ]);

  if (nonAnswerExact.has(clean)) return true;
  if (/^(.)\\1*$/.test(clean) && clean.length < 15) return true;
  if (/^(jsp|idk|rien|aide)\\b/i.test(clean) && clean.length <= 15) return true;
  if (/^je\\s*(ne\\s*)?sais\\s*pas/i.test(clean) && clean.length <= 25) return true;

  return false;
}`;

docChildren.push(...codeListing(codeAlgorithm, 'Extrait de code A.1 : Algorithme strict d’interception des non-réponses (ai-quiz-exercise.service.js)'));

docChildren.push(sectionTitle('B', 'Configuration Docker Compose pour le déploiement conteneurisé'));
docChildren.push(p('Fichier docker-compose.yml orchestrant la base de données relationnelle MySQL et le moteur d’inférence Ollama :', { bold: true, before: 140, after: 80 }));

const codeDocker = `version: '3.8'

services:
  database:
    image: mysql:8.0
    container_name: tutorai-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_secure_password
      MYSQL_DATABASE: tutorai
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  ollama-engine:
    image: ollama/ollama:latest
    container_name: tutorai-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

volumes:
  mysql_data:
  ollama_models:`;

docChildren.push(...codeListing(codeDocker, 'Extrait de code B.1 : Configuration Docker Compose de l’infrastructure logicielle'));

// =========================================================================
// PACKING DOCUMENT
// =========================================================================

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Times New Roman',
          size: 24, // 12pt
          color: COLOR_DARK_TEXT
        }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1418, // 2.5 cm
            bottom: 1418, // 2.5 cm
            left: 1418, // 2.5 cm
            right: 1418 // 2.5 cm
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 0, after: 120 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER } },
              children: [
                new TextRun({
                  text: 'EMSI — Rapport de Stage PFA | TutorAI — UQASE NEXT SARL',
                  font: 'Times New Roman',
                  size: 18,
                  italics: true,
                  color: '666666'
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 120, after: 0 },
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER } },
              children: [
                new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20, color: '666666' }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20, bold: true, color: COLOR_NAVY }),
                new TextRun({ text: ' / ', font: 'Times New Roman', size: 20, color: '666666' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 20, color: '666666' })
              ]
            })
          ]
        })
      },
      children: docChildren
    }
  ]
});

const outputPath = path.resolve(__dirname, 'RAPPORT_DE_STAGE_EMSI.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  const stats = fs.statSync(outputPath);
  console.log(`Document generated successfully at: ${outputPath}`);
  console.log(`File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
}).catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});
