<?php

declare(strict_types=1);

use Dompdf\Dompdf;
use Dompdf\Options;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\Table\TableExtension;
use League\CommonMark\Extension\TaskList\TaskListExtension;
use League\CommonMark\MarkdownConverter;

require dirname(__DIR__).'/vendor/autoload.php';

$sourcePath = __DIR__.'/guia-parametrizacion-aliaddo.md';
$outputPath = __DIR__.'/guia-parametrizacion-aliaddo.pdf';
$markdown = file_get_contents($sourcePath);

if ($markdown === false) {
    throw new RuntimeException("No se pudo leer la guía: {$sourcePath}");
}

$flowchart = <<<'HTML'
<table class="flowchart-table">
  <tbody>
    <tr><td colspan="2" class="flow-step flow-blue">1. Completar venta en el POS</td></tr>
    <tr><td colspan="2" class="flow-arrow">↓</td></tr>
    <tr><td colspan="2" class="flow-step flow-blue">2. Guardar venta e inventario</td></tr>
    <tr><td colspan="2" class="flow-arrow">↓</td></tr>
    <tr><td colspan="2" class="flow-decision">¿Aliaddo está habilitado?</td></tr>
    <tr>
      <td class="flow-branch flow-muted"><strong>NO</strong><br>Finalizar venta sin emitir factura</td>
      <td class="flow-branch flow-green"><strong>SÍ ↓</strong><br>Continuar con la emisión</td>
    </tr>
    <tr><td colspan="2" class="flow-step flow-green">3. Validar configuración, cliente y productos</td></tr>
    <tr><td colspan="2" class="flow-arrow">↓</td></tr>
    <tr><td colspan="2" class="flow-decision">¿Los datos son válidos?</td></tr>
    <tr>
      <td class="flow-branch flow-red"><strong>NO</strong><br>Marcar como fallida,<br>corregir y reintentar</td>
      <td class="flow-branch flow-green"><strong>SÍ ↓</strong><br>Reservar consecutivo</td>
    </tr>
    <tr><td colspan="2" class="flow-step flow-green">4. Reservar consecutivo de forma segura</td></tr>
    <tr><td colspan="2" class="flow-arrow">↓</td></tr>
    <tr><td colspan="2" class="flow-step flow-green">5. Enviar factura a Aliaddo</td></tr>
    <tr><td colspan="2" class="flow-arrow">↓</td></tr>
    <tr><td colspan="2" class="flow-decision">¿Aliaddo acepta la factura?</td></tr>
    <tr>
      <td class="flow-branch flow-red"><strong>NO →</strong> Marcar como fallida;<br>verificar y reintentar</td>
      <td class="flow-branch flow-green"><strong>SÍ ↓</strong><br>Guardar como emitida</td>
    </tr>
    <tr><td colspan="2" class="flow-step flow-success">Factura emitida</td></tr>
  </tbody>
</table>
HTML;

$markdown = preg_replace_callback(
    '/```mermaid\s.*?```/s',
    static fn (): string => $flowchart,
    $markdown,
    1,
    $diagramCount,
);

if ($markdown === null || $diagramCount !== 1) {
    throw new RuntimeException('No se pudo localizar el diagrama de flujo esperado en la guía.');
}

$environment = new Environment([
    'html_input' => 'allow',
    'allow_unsafe_links' => false,
]);
$environment->addExtension(new CommonMarkCoreExtension());
$environment->addExtension(new TableExtension());
$environment->addExtension(new TaskListExtension());
$converter = new MarkdownConverter($environment);
$content = (string) $converter->convert($markdown);

$coverIllustration = <<<'HTML'
<table class="cover-illustration">
  <tbody><tr>
    <td class="cover-card">
      <span class="cover-card-icon">POS</span><br>
      Punto de venta
    </td>
    <td class="cover-arrow">→</td>
    <td class="cover-card cover-card-invoice">
      <span class="cover-card-icon">≡</span><br>
      Factura electrónica
    </td>
    <td class="cover-arrow">→</td>
    <td class="cover-card">
      <span class="cover-card-icon">✓</span><br>
      Aliaddo + DIAN
    </td>
  </tr></tbody>
</table>
HTML;

$html = <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Guía de parametrización de facturación electrónica con Aliaddo</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 17mm 21mm;
    }
    @page:first {
      margin: 0;
    }
    * { box-sizing: border-box; }
    body {
      color: #233247;
      font-family: "DejaVu Sans", sans-serif;
      font-size: 9.2pt;
      line-height: 1.56;
    }
    .cover {
      height: 240mm;
      padding: 27mm 24mm 22mm;
      background: #f5f8fc;
      color: #17345f;
      page-break-after: always;
      position: relative;
    }
    .cover-band {
      height: 9mm;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: #1d8b63;
    }
    .cover-brand {
      color: #1d8b63;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 1.4px;
      text-transform: uppercase;
    }
    .cover-kicker {
      margin-top: 15mm;
      color: #67809f;
      font-size: 10pt;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .cover h1 {
      color: #17345f;
      font-size: 31pt;
      line-height: 1.19;
      margin: 5mm 0 3mm;
      max-width: 165mm;
    }
    .cover-subtitle {
      color: #526782;
      font-size: 13pt;
      max-width: 155mm;
      line-height: 1.55;
    }
    .cover-illustration {
      border-collapse: separate;
      border-spacing: 3mm;
      height: 45mm;
      margin: 6mm auto 0;
      text-align: center;
      width: 100%;
    }
    .cover-card {
      background: #fff;
      border: 1.5px solid #cbd8ef;
      border-radius: 9px;
      color: #355277;
      font-size: 8pt;
      font-weight: bold;
      padding: 5mm 2mm;
      width: 29%;
    }
    .cover-card-invoice {
      background: #e8f4ee;
      border-color: #7db99b;
      color: #14532d;
    }
    .cover-card-icon {
      color: #1d8b63;
      display: inline-block;
      font-size: 22pt;
      line-height: 1.5;
    }
    .cover-arrow {
      color: #728db9;
      font-size: 18pt;
      font-weight: bold;
      width: 6%;
    }
    .cover-callout {
      background: #e8f4ee;
      border-left: 4px solid #1d8b63;
      border-radius: 4px;
      color: #244b3a;
      font-size: 10pt;
      margin-top: 2mm;
      padding: 4mm 5mm;
    }
    .cover-meta {
      border-top: 1px solid #d5deea;
      bottom: 17mm;
      color: #708198;
      font-size: 8pt;
      left: 24mm;
      padding-top: 4mm;
      position: absolute;
      right: 24mm;
    }
    h1, h2, h3, h4 {
      color: #17345f;
      page-break-after: avoid;
    }
    h1 { font-size: 22pt; line-height: 1.25; }
    h2 {
      border-bottom: 2px solid #dce8f4;
      font-size: 15pt;
      margin: 8mm 0 3mm;
      padding-bottom: 2mm;
    }
    h3 { font-size: 11pt; margin: 5mm 0 2mm; }
    p { margin: 2mm 0 3mm; }
    ul, ol { margin: 2mm 0 4mm; padding-left: 7mm; }
    li { margin: 1mm 0; padding-left: 1mm; }
    strong { color: #17345f; }
    code {
      background: #eef3f8;
      border-radius: 3px;
      color: #245c53;
      font-family: "DejaVu Sans Mono", monospace;
      font-size: 8.2pt;
      padding: 0.5mm 1mm;
    }
    pre {
      background: #f3f6fa;
      border: 1px solid #d6dfeb;
      border-radius: 4px;
      color: #233247;
      font-family: "DejaVu Sans Mono", monospace;
      font-size: 6.4pt;
      line-height: 1.3;
      margin: 3mm 0 5mm;
      padding: 3mm;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    pre code {
      background: transparent;
      color: inherit;
      font-size: inherit;
      padding: 0;
    }
    blockquote {
      background: #fff7e6;
      border-left: 4px solid #e1aa3d;
      color: #624919;
      margin: 4mm 0;
      padding: 3mm 5mm;
    }
    table {
      border-collapse: collapse;
      font-size: 8pt;
      margin: 3mm 0 5mm;
      page-break-inside: auto;
      width: 100%;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th {
      background: #eaf0f8;
      color: #17345f;
      font-weight: bold;
      text-align: left;
    }
    th, td {
      border: 1px solid #d6dfeb;
      padding: 2.2mm;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    .flowchart {
      background: #f7f9fc;
      border: 1px solid #e0e7f0;
      border-radius: 8px;
      margin: 2mm auto 4mm;
      padding: 2mm;
      page-break-inside: avoid;
      text-align: center;
      width: 100%;
    }
    .flowchart-table {
      border-collapse: separate;
      border-spacing: 1mm;
      font-size: 8pt;
      margin: 0;
      page-break-inside: avoid;
      text-align: center;
      width: 100%;
    }
    .flowchart-table td {
      border: 0;
      border-radius: 5px;
      padding: 1.5mm 2mm;
      vertical-align: middle;
    }
    .flow-step { font-weight: bold; }
    .flow-blue { background: #eaf2ff; color: #173b75; }
    .flow-green { background: #eefbf4; color: #14532d; }
    .flow-success { background: #dff3e7; color: #14532d; font-weight: bold; }
    .flow-decision { background: #fff5df; color: #684308; font-weight: bold; }
    .flow-branch { font-size: 7.3pt; width: 50%; }
    .flow-muted { background: #f1f5f9; color: #334155; }
    .flow-red { background: #fff0ef; color: #84251e; }
    .flow-arrow { color: #78909c; font-size: 12pt; font-weight: bold; line-height: 1; padding: 0 !important; }
    .task-list-item { list-style-type: none; margin-left: -5mm; }
    .task-list-item input { margin-right: 2mm; }
    a { color: #1d6e65; text-decoration: none; }
    h2 { page-break-before: auto; }
    .running-header {
      color: #74849a;
      font-size: 7pt;
      position: fixed;
      top: -14mm;
      left: 0;
      right: 0;
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="cover-band"></div>
    <div class="cover-brand">ALFIL SAAS · GUÍA DE CONFIGURACIÓN</div>
    <div class="cover-kicker">Facturación electrónica · Aliaddo + DIAN</div>
    <h1>Parametrización de facturación electrónica</h1>
    <div class="cover-subtitle">
      Manual ilustrado para configurar la conexión, la resolución DIAN,
      los datos del cliente y la emisión desde el punto de venta.
    </div>
    {$coverIllustration}
    <div class="cover-callout">
      <strong>Antes de empezar:</strong> solicita a Aliaddo y a la DIAN los
      códigos, credenciales y datos oficiales de la empresa. No uses valores
      de ejemplo en producción.
    </div>
    <div class="cover-meta">Manual paso a paso · Ambiente de pruebas y producción</div>
  </section>
  <div class="running-header">ALFIL SAAS &nbsp; / &nbsp; FACTURACIÓN ELECTRÓNICA ALIADDO</div>
  <main>{$content}</main>
</body>
</html>
HTML;

$options = new Options();
$options->set('defaultFont', 'DejaVu Sans');
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', false);
$options->set('isPhpEnabled', true);
$options->set('tempDir', sys_get_temp_dir());

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$canvas = $dompdf->getCanvas();
$font = $dompdf->getFontMetrics()->getFont('DejaVu Sans', 'normal');
$canvas->page_text(
    48,
    810,
    'Guía de parametrización de Aliaddo',
    $font,
    7,
    [0.45, 0.52, 0.61],
);
$canvas->page_text(
    505,
    810,
    'Página {PAGE_NUM} de {PAGE_COUNT}',
    $font,
    7,
    [0.45, 0.52, 0.61],
);

if (file_put_contents($outputPath, $dompdf->output()) === false) {
    throw new RuntimeException("No se pudo guardar el PDF: {$outputPath}");
}

fwrite(STDOUT, "PDF generado: {$outputPath}\n");
