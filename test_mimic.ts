import PDFDocument from 'pdfkit';
import fs from 'fs';
const doc = new PDFDocument({ size: 'A4', margin: 0 });
doc.pipe(fs.createWriteStream('/tmp/test_mimic.pdf'));
const PAGE_W = doc.page.width;
const M = 50;

doc.rect(0, 0, PAGE_W, 110).fill('#fafafa');
doc.rect(0, 0, PAGE_W, 6).fill('#c47a2c');

doc.circle(M + 22, 55, 22).lineWidth(1.5).strokeColor('#c47a2c').stroke();
doc.font('Helvetica-Bold').fontSize(18).fillColor('#c47a2c').text('MS', M+10, 47, { width: 24, align: 'center' });

doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a1a1a').text('Minhaj Shishir Studio', M + 60, 35);
doc.font('Helvetica-Oblique').fontSize(9).fillColor('#6b6b6b').text('PHOTOGRAPHY · CINEMATOGRAPHY', M + 60, 60, { characterSpacing: 2 });
doc.font('Helvetica').fontSize(8).fillColor('#6b6b6b').text('Memory & Stories · hello@minhajshishir.studio', M + 60, 78);

doc.font('Helvetica-Bold').fontSize(28).fillColor('#c47a2c').text('INVOICE', PAGE_W - M - 200, 30, { width: 200, align: 'right' });

doc.end();
console.log('done');
