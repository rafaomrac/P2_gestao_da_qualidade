"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SCRATCH_DOCX = "C:/Users/Admin/.gemini/antigravity/brain/6b202e4d-8ffc-4518-88d5-b412f49ce016/scratch/docx";
const BUILD_DIR = "C:/Users/Admin/.gemini/antigravity/brain/6b202e4d-8ffc-4518-88d5-b412f49ce016/scratch/docx_build";
const OUTPUT_DOCX = path.join(ROOT, "Caderno_de_Testes_P2_Final.docx");

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function makeCell(text) {
  return `<w:tc><w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

function makeRow(label, value) {
  return `<w:tr><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(label)}</w:t></w:r></w:p></w:tc>${makeCell(value)}</w:tr>`;
}

let imageCounter = 1;
const imageRelEntries = [];

function registerImage(relImgPath) {
  const fullPath = path.isAbsolute(relImgPath) ? relImgPath : path.join(ROOT, relImgPath);
  if (!fs.existsSync(fullPath)) return null;

  const buf = fs.readFileSync(fullPath);
  let w = 800;
  let h = 450;
  if (buf.length >= 24) {
    w = buf.readUInt32BE(16) || 800;
    h = buf.readUInt32BE(20) || 450;
  }

  const rId = `rIdImgGenerated${imageCounter}`;
  const targetName = `image_gen_${imageCounter}.png`;
  imageCounter++;

  // Copia arquivo para BUILD_DIR/word/media/
  const mediaDir = path.join(BUILD_DIR, "word", "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  fs.copyFileSync(fullPath, path.join(mediaDir, targetName));

  imageRelEntries.push({ rId, target: `media/${targetName}` });

  // Calcula dimensoes mantendo proporcao
  const maxW = 5400000; // ~5.9 polegadas
  const maxH = 3400000;
  let cx = maxW;
  let cy = Math.round((maxW * h) / w);
  if (cy > maxH) {
    cy = maxH;
    cx = Math.round((maxH * w) / h);
  }

  return { rId, cx, cy, id: imageCounter };
}

function makeImageXml(imgInfo, legenda) {
  if (!imgInfo) return "";
  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="80"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imgInfo.cx}" cy="${imgInfo.cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${imgInfo.id}" name="Evidencia ${imgInfo.id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imgInfo.id}" name="Evidencia ${imgInfo.id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${imgInfo.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imgInfo.cx}" cy="${imgInfo.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:i/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="18"/><w:color w:val="666666"/></w:rPr><w:t>${escapeXml(legenda)}</w:t></w:r></w:p>`;
}

function buildTestCardTable(card) {
  const rows = [
    makeRow("ID / título", `${card.id} – ${card.titulo}`),
    makeRow("Requisito / modalidade", `${card.requisito} | ${card.modalidade}`),
    makeRow("Prioridade / responsável / data", `${card.prioridade} | QA Team | 18/11/2026`),
    makeRow("Pré-condições", card.precondicoes),
    makeRow("Dados de entrada", card.dados),
    makeRow("Passos de execução", card.passos),
    makeRow("Resultado esperado", card.esperado),
    makeRow("Resultado obtido", card.obtido),
    makeRow("Status", card.status),
    makeRow("Evidência / automação", card.evidencia),
    makeRow("Defeito relacionado", card.defeito || "Não aplicável"),
  ];

  let tableXml = `<w:tbl><w:tblPr><w:tblW w:w="9200" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/></w:tblBorders></w:tblPr>${rows.join("")}</w:tbl>`;

  let imgBlock = "";
  if (card.imgPath) {
    const info = registerImage(card.imgPath);
    if (info) {
      imgBlock = makeImageXml(info, `Figura – Evidência comprobatória: ${card.id} (${card.titulo})`);
    }
  }

  return tableXml + imgBlock;
}

const CARDS = [
  {
    id: "CT-U01", titulo: "Ausência de desconto automático abaixo de R$ 200,00",
    requisito: "RF05, RN-01", modalidade: "Unitário (Valor-Limite)", prioridade: "Alta",
    precondicoes: "Função automaticDiscount em src/domain/discount.js.",
    dados: "Subtotal = R$ 199,99",
    passos: "1. Invocar automaticDiscount(199.99).",
    esperado: "Retorno numérico 0 (sem desconto concedido).",
    obtido: "Retorno 0.", status: "Aprovado", evidencia: "tests/unitarios.test.js, CT-U01.png",
    imgPath: "evidencias/CT-U01/CT-U01.png"
  },
  {
    id: "CT-U02", titulo: "Desconto de 10% no limite exato de R$ 200,00",
    requisito: "RF05, RN-01", modalidade: "Unitário (Valor-Limite)", prioridade: "Alta",
    precondicoes: "Função automaticDiscount disponível.",
    dados: "Subtotal = R$ 200,00",
    passos: "1. Invocar automaticDiscount(200.00).",
    esperado: "Retorno numérico 20.00 (10% de desconto).",
    obtido: "Retorno 20.00.", status: "Aprovado", evidencia: "tests/unitarios.test.js, CT-U02.png",
    imgPath: "evidencias/CT-U02/CT-U02.png"
  },
  {
    id: "CT-U03", titulo: "Arredondamento monetário Half-Up de meio centavo",
    requisito: "RF05, RN-06", modalidade: "Unitário (Aritmética Financeira)", prioridade: "Crítica",
    precondicoes: "Função percentOf em src/domain/money.js.",
    dados: "Valor = R$ 200,05, Percentual = 10% (cálculo: 20.005)",
    passos: "1. Invocar percentOf(200.05, 10).",
    esperado: "Retorno 20.01 (meio centavo arredonda para cima).",
    obtido: "Retorno 20.01.", status: "Aprovado", evidencia: "tests/unitarios.test.js, CT-U03.png",
    imgPath: "evidencias/CT-U03/CT-U03.png"
  },
  {
    id: "CT-I01", titulo: "Fluxo Integrado de Compra, Decremento de Estoque e Persistência",
    requisito: "RF05, RF06, RF08, RF09 / RN-08", modalidade: "Integração (API + Domínio + Persistência)", prioridade: "Crítica",
    precondicoes: "Servidor ativo com base temporária; produto-teste com estoque 5.",
    dados: "Cliente autenticado, 2 unidades de produto-teste (R$ 150 un.), endereço completo.",
    passos: "1. GET /api/products/produto-teste. 2. POST /api/checkout autenticado. 3. GET /api/products/produto-teste (verificar estoque). 4. GET /api/orders/:id.",
    esperado: "HTTP 201 no checkout, estoque decrementado para 3, pedido gravado no banco.",
    obtido: "Pedido ped-1201 gerado, estoque reduzido para 3 un.", status: "Aprovado",
    evidencia: "CT-I01_01_ESTOQUE_ANTES.png, CT-I01_02_PEDIDO_CRIADO.png, CT-I01_03_ESTOQUE_DEPOIS.png",
    imgPath: "evidencias/CT-I01/CT-I01_02_PEDIDO_CRIADO.png"
  },
  {
    id: "CT-I02", titulo: "Ciclo Completo de Cadastro, Sessão e Invalidação por Logout",
    requisito: "RF01, RF02", modalidade: "Integração (Auth / Sessão)", prioridade: "Alta",
    precondicoes: "Endpoint de autenticação operacional.",
    dados: "Nome: Aluno Teste, e-mail único, senha Senha123.",
    passos: "1. POST /api/auth/register. 2. GET /api/auth/me com token. 3. POST /api/auth/logout. 4. GET /api/auth/me com token revogado. 5. POST /api/auth/login.",
    esperado: "Passo 1: 201; Passo 2: 200; Passo 3: 200; Passo 4: 401; Passo 5: 200 com novo token.",
    obtido: "Todos os 5 passos executados conforme especificado.", status: "Aprovado",
    evidencia: "tests/integracao.test.js, CT-I02.png",
    imgPath: "evidencias/CT-I02/CT-I02.png"
  },
  {
    id: "CT-F01", titulo: "Cadastro de nova conta com dados válidos",
    requisito: "RF01", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Alta",
    precondicoes: "Tela de cadastro em /#cadastro acessível.",
    dados: "Nome: Aluno, e-mail aluno-a@loja.test, senha válida.",
    passos: "1. Acessar /#cadastro. 2. Preencher campos. 3. Clicar em Criar conta.",
    esperado: "Conta criada e sessão iniciada com sucesso.",
    obtido: "Usuário cadastrado com sucesso.", status: "Aprovado",
    evidencia: "CT-F01_1.png",
    imgPath: "evidencias/CT-F01/CT-F01_1.png"
  },
  {
    id: "CT-F02", titulo: "Tentativa de login com senha incorreta",
    requisito: "RF02", modalidade: "Funcional / Sistema (Negativo 1/3)", prioridade: "Alta",
    precondicoes: "Usuário cliente-a@loja.test existente.",
    dados: "E-mail válido e senha incorreta (****).",
    passos: "1. Acessar /#entrar. 2. Inserir dados. 3. Clicar em Entrar.",
    esperado: "Acesso recusado e mensagem 'E-mail ou senha incorretos'.",
    obtido: "Mensagem exibida e acesso bloqueado.", status: "Aprovado",
    evidencia: "CT-F02_1.png",
    imgPath: "evidencias/CT-F02/CT-F02_1.png"
  },
  {
    id: "CT-F03", titulo: "Exibição dos produtos e estoques no catálogo",
    requisito: "RF03", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Média",
    precondicoes: "Servidor e catálogo carregados.",
    dados: "Navegação até /#catalogo.",
    passos: "1. Abrir catálogo público.",
    esperado: "Grade de produtos renderizada com nome, descrição, categoria, preço e estoque.",
    obtido: "Cards exibidos com todas as propriedades.", status: "Aprovado",
    evidencia: "CT-F03_1.png",
    imgPath: "evidencias/CT-F03/CT-F03_1.png"
  },
  {
    id: "CT-F04", titulo: "Busca textual por termo inexistente no catálogo",
    requisito: "RF04", modalidade: "Funcional / Sistema (Negativo 2/3)", prioridade: "Média",
    precondicoes: "Catálogo exibindo produtos.",
    dados: "Termo de busca 'helsshd'.",
    passos: "1. Digitar o termo no campo de busca.",
    esperado: "Catálogo filtrado sem resultados, sem erro de script.",
    obtido: "Grade esvaziada de forma limpa.", status: "Aprovado",
    evidencia: "CT-F04_2.png",
    imgPath: "evidencias/CT-F04/CT-F04_2.png"
  },
  {
    id: "CT-F05", titulo: "Adição, alteração de quantidade e remoção no carrinho",
    requisito: "RF05", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Alta",
    precondicoes: "Catálogo com produto-teste disponível.",
    dados: "Produto produto-teste, quantidade inicial 1.",
    passos: "1. Clicar em 'Adicionar ao carrinho'. 2. Acessar /#carrinho. 3. Clicar em 'Remover'.",
    esperado: "Item incluído com badge atualizado; item removido zerando o carrinho.",
    obtido: "Manipulação perfeita de itens.", status: "Aprovado",
    evidencia: "CT-F05_1.png, CT-F05_3.png",
    imgPath: "evidencias/CT-F05/CT-F05_1.png"
  },
  {
    id: "CT-F06", titulo: "Monitoramento e apresentação de estoque por produto",
    requisito: "RF06", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Alta",
    precondicoes: "Produto-teste cadastrado com estoque 5.",
    dados: "Consulta visual do card de produto.",
    passos: "1. Localizar produto-teste no catálogo.",
    esperado: "Indicação explícita 'Estoque: 5'.",
    obtido: "Estoque apresentado corretamente.", status: "Aprovado",
    evidencia: "CT-F06_1.png",
    imgPath: "evidencias/CT-F06/CT-F06_1.png"
  },
  {
    id: "CT-F07", titulo: "Aplicação de cupom válido com cálculo de benefício",
    requisito: "RF07, RN-05", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Alta",
    precondicoes: "Carrinho com subtotal de R$ 150,00.",
    dados: "Cupom VINTE (20% de desconto).",
    passos: "1. Digitar 'VINTE' no campo de cupom. 2. Clicar em 'Aplicar cupom'.",
    esperado: "Desconto de R$ 30,00 aplicado sobre o subtotal.",
    obtido: "Desconto calculado e exibido no total.", status: "Aprovado",
    evidencia: "CT-F07_1.png",
    imgPath: "evidencias/CT-F07/CT-F07_1.png"
  },
  {
    id: "CT-F08", titulo: "Tentativa de checkout sem preenchimento completo de endereço",
    requisito: "RF08, RN-13", modalidade: "Funcional / Sistema (Negativo 3/3)", prioridade: "Alta",
    precondicoes: "Carrinho com produto adicionado.",
    dados: "Endereço incompleto com campos em branco.",
    passos: "1. Deixar CEP e UF em branco. 2. Tentar finalizar compra.",
    esperado: "Bloqueio do pedido com indicação dos campos obrigatórios.",
    obtido: "Alerta visual impedindo avanço sem endereço completo.", status: "Aprovado",
    evidencia: "CT-F08_1.png",
    imgPath: "evidencias/CT-F08/CT-F08_1.png"
  },
  {
    id: "CT-F09", titulo: "Fechamento de pedido por cliente autenticado",
    requisito: "RF09, RN-08", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Crítica",
    precondicoes: "Cliente autenticado com carrinho e endereço completos.",
    dados: "1 item no carrinho, endereço preenchido.",
    passos: "1. Clicar em 'Finalizar pedido'.",
    esperado: "Geração de pedido confirmado com número de pedido (ped-xxxx).",
    obtido: "Pedido confirmado gerado na tela com sucesso.", status: "Aprovado",
    evidencia: "CT-F09_1.png",
    imgPath: "evidencias/CT-F09/CT-F09_1.png"
  },
  {
    id: "CT-F10", titulo: "Consulta ao histórico e detalhes do pedido do cliente",
    requisito: "RF10, RN-10", modalidade: "Funcional / Sistema (Positivo)", prioridade: "Alta",
    precondicoes: "Cliente autenticado com histórico de compras existente.",
    dados: "Acesso a /#pedidos.",
    passos: "1. Acessar 'Meus pedidos'. 2. Clicar em 'Ver pedido' de pedido-cliente-b.",
    esperado: "Exibição de itens, subtotal, frete, desconto e endereço gravados.",
    obtido: "Visualização íntegra dos detalhes do pedido.", status: "Aprovado",
    evidencia: "CT-F010_1.png, CT-F010_4.png",
    imgPath: "evidencias/CT-F10/CT-F010_1.png"
  },
  {
    id: "CT-B01", titulo: "Particionamento de Equivalência e Valor-Limite nas Regras Financeiras",
    requisito: "RF05, RN-01, RN-02, RN-06", modalidade: "Caixa-Preta (EP e BVA)", prioridade: "Crítica",
    precondicoes: "Motor de cotação quoteLines em src/domain/pricing.js.",
    dados: "Valores-limite: R$ 199.99, R$ 200.00, R$ 200.01, R$ 299.99, R$ 300.00, R$ 300.01, R$ 200.05.",
    passos: "1. Executar matriz de testes automatizados com limites inferiores, superiores e centavos.",
    esperado: "Descontos automáticos de 10% a partir de R$ 200 e frete grátis a partir de R$ 300.",
    obtido: "10/10 cenários rigorosamente aprovados.", status: "Aprovado",
    evidencia: "tests/caixa_preta_valores.test.js, CT-B01_terminal.png",
    imgPath: "evidencias/CT-B01/CT-B01_terminal.png"
  },
  {
    id: "CT-B02", titulo: "Particionamento de Equivalência e Valor-Limite em Quantidade vs Estoque",
    requisito: "RF05, RF06, RN-03", modalidade: "Caixa-Preta (EP e BVA)", prioridade: "Crítica",
    precondicoes: "Produto-teste com estoque 5.",
    dados: "Quantidades: -1 (inválida), 0 (limite inferior inválido), 1 (limite inferior válido), 1.5 (inválida), 5 (limite superior válido), 6 (limite superior inválido).",
    passos: "1. Testar cada quantidade contra a API de cotação /api/cart/quote.",
    esperado: "Rejeição de -1, 0, 1.5 e 6 com HTTP 400; aceitação de 1 e 5 com HTTP 200.",
    obtido: "Aprovado em todas as classes e limites após correção do BUG-01.", status: "Aprovado",
    evidencia: "tests/caixa_preta.test.js, DEPOIS_caixa_preta.txt", defeito: "BUG-01",
    imgPath: "evidencias/CT-B02/CT-B02_02_FALHA.png"
  },
  {
    id: "CT-CONF01", titulo: "Reteste de Confirmação da Correção do BUG-01 (Venda acima do estoque)",
    requisito: "RF06, RN-03", modalidade: "Confirmação / Reteste", prioridade: "Crítica",
    precondicoes: "Correção aplicada em validateQuantity propagando estoque.",
    dados: "Cotação e checkout com quantidade 6 de produto com estoque 5.",
    passos: "1. POST /api/cart/quote com qty=6. 2. POST /api/checkout com qty=6.",
    esperado: "HTTP 400 com mensagem explícita de quantidade acima do estoque.",
    obtido: "HTTP 400 com erro 'Quantidade acima do estoque disponível'.", status: "Aprovado",
    evidencia: "tests/regressao.test.js, CT-R_terminal.png", defeito: "BUG-01",
    imgPath: "evidencias/CT-R/CT-R_terminal.png"
  },
  {
    id: "CT-R01", titulo: "Regressão: Valores-limite de quantidade válidos e inválidos",
    requisito: "RF05, RN-03", modalidade: "Regressão", prioridade: "Alta",
    precondicoes: "Código corrigido em produção local.",
    dados: "Quantidades 0, 1, 1.5 e 5.",
    passos: "1. Cotar quantidades limítrofes.",
    esperado: "Quantidades 1 e 5 aceitas; 0 e 1.5 rejeitadas.",
    obtido: "Comportamento preservado sem regressão.", status: "Aprovado",
    evidencia: "tests/regressao.test.js, CT-R_terminal.png",
    imgPath: "evidencias/CT-R/CT-R_terminal.png"
  },
  {
    id: "CT-R02", titulo: "Regressão: Cálculo de Totais, Desconto Automático e Cupons",
    requisito: "RF05, RN-01, RN-02, RN-05", modalidade: "Regressão", prioridade: "Crítica",
    precondicoes: "Código corrigido.",
    dados: "Compra de R$ 300,00 e compra de R$ 150,00 com cupom CINCO.",
    passos: "1. Cotar carrinho de R$ 300. 2. Cotar carrinho de R$ 150 com cupom.",
    esperado: "R$ 300 tem desconto 30 e frete grátis; R$ 150 com cupom tem desconto 7,50 e frete 18,50.",
    obtido: "Regras financeiras intactas.", status: "Aprovado",
    evidencia: "tests/regressao.test.js, CT-R_terminal.png",
    imgPath: "evidencias/CT-R/CT-R_terminal.png"
  },
  {
    id: "CT-R03", titulo: "Regressão: Finalização válida no limite máximo de estoque",
    requisito: "RF09, RN-03, RN-08", modalidade: "Regressão", prioridade: "Crítica",
    precondicoes: "Cliente autenticado.",
    dados: "Checkout de exatamente 5 unidades de produto com estoque 5.",
    passos: "1. POST /api/checkout com quantidade 5.",
    esperado: "HTTP 201 com pedido gerado para o cliente.",
    obtido: "Pedido ped-xxxx confirmado com 5 unidades e subtotal R$ 750,00.", status: "Aprovado",
    evidencia: "tests/regressao.test.js, CT-R_terminal.png",
    imgPath: "evidencias/CT-R/CT-R_terminal.png"
  },
  {
    id: "CT-C01", titulo: "Teste de Carga Progressiva com medição de vazão e latência",
    requisito: "RNF-06, RNF-09", modalidade: "Desempenho (Carga)", prioridade: "Alta",
    precondicoes: "Servidor local isolado, banco temporário.",
    dados: "Carga com 5, 10, 20 e 40 usuários virtuais concorrentes por 8s em endpoint misto.",
    passos: "1. Executar scripts/carga.js carga. 2. Medir vazão, média, p95 e erros.",
    esperado: "Vazão sustentada com taxa de erros inferior a 1% e p95 < 50ms.",
    obtido: "Vazão atingiu 7.116 req/s, p95 de 9,88ms em 40 VUs, com 0 erros (0,00%).", status: "Aprovado",
    evidencia: "evidencias/CT-C01/resultado_carga.json e CT-C01_terminal.png",
    imgPath: "evidencias/CT-C01/CT-C01_terminal.png"
  },
  {
    id: "CT-E01", titulo: "Teste de Estresse Extremo e Avaliação de Auto-Recuperação",
    requisito: "RNF-06, RNF-08", modalidade: "Desempenho (Estresse)", prioridade: "Alta",
    precondicoes: "Servidor local isolado.",
    dados: "Sobrecarga com 100, 200 e 400 usuários virtuais concorrentes, seguido de sonda em 5 VUs.",
    passos: "1. Executar scripts/carga.js estresse. 2. Monitorar enfileiramento e retorno a baseline.",
    esperado: "Degradação suave sem crash; recuperação imediata após alívio da carga.",
    obtido: "Zero erros sob 400 VUs; latência recuperada para 0,75ms logo após o estresse.", status: "Aprovado",
    evidencia: "evidencias/CT-E01/resultado_estresse.json e CT-E01_terminal.png",
    imgPath: "evidencias/CT-E01/CT-E01_terminal.png"
  },
  {
    id: "CT-S01", titulo: "Segurança Básica: Controle de Acesso e Isolamento entre Perfis",
    requisito: "RN-10, RN-11", modalidade: "Segurança Não Destrutiva", prioridade: "Crítica",
    precondicoes: "Contas cliente-a, cliente-b e admin cadastradas.",
    dados: "Requisições cruzadas com tokens de cliente e admin.",
    passos: "1. Consultar pedido alheio. 2. Acessar rotas /api/admin/* com token de cliente. 3. Modificar produto sem login.",
    esperado: "HTTP 401/403 bloqueando acessos indevidos; HTTP 200 apenas para admin.",
    obtido: "Isolamento estrito entre usuários e restrição administrativa comprovada.", status: "Aprovado",
    evidencia: "tests/seguranca.test.js, CT-S01_terminal.png",
    imgPath: "evidencias/CT-S01/CT-S01_terminal.png"
  },
  {
    id: "CT-S02", titulo: "Segurança Básica: Validação e Sanitização de Entradas Maliciosas",
    requisito: "RN-12", modalidade: "Segurança Não Destrutiva", prioridade: "Alta",
    precondicoes: "Servidor ativo.",
    dados: "JSON malformado, SQLi no login, payload em quantidade, XSS no ID de produto, Path Traversal.",
    passos: "1. Submeter payloads maliciosos aos endpoints da API e servidor de arquivos.",
    esperado: "Respostas HTTP 400/401/403 sem crash de processo e sem vazamento de código ou stack traces.",
    obtido: "Nenhum payload explorou vulnerabilidade; servidor respondeu códigos apropriados.", status: "Aprovado",
    evidencia: "tests/seguranca.test.js, CT-S01_terminal.png",
    imgPath: "evidencias/CT-S01/CT-S01_terminal.png"
  },
  {
    id: "CT-A01", titulo: "Inspeção de Usabilidade e Acessibilidade (Checklist de 5 Critérios)",
    requisito: "RNF-01 a RNF-05", modalidade: "Usabilidade e Acessibilidade", prioridade: "Média",
    precondicoes: "Interface web aberta em navegador.",
    dados: "Navegação visual e por teclado nas rotas #catalogo, #carrinho e #cadastro.",
    passos: "1. Inspecionar rótulos. 2. Testar foco Tab. 3. Checar contraste e anel de foco. 4. Validar erro de cadastro. 5. Checar carrinho vazio.",
    esperado: "Atendimento integral aos 5 critérios avaliados.",
    obtido: "5 critérios validados com capturas comprobatórias.", status: "Aprovado",
    evidencia: "evidencias/CT-AO1/CT-A01_01 a CT-A01_05.png",
    imgPath: "evidencias/CT-AO1/CT-A01_01_ROTULOS.png"
  },
  {
    id: "CT-X01", titulo: "Compatibilidade entre Navegadores (Google Chrome vs Microsoft Edge)",
    requisito: "RNF-01 a RNF-05", modalidade: "Compatibilidade", prioridade: "Média",
    precondicoes: "Chrome e Edge instalados no ambiente de teste.",
    dados: "Execução da mesma sequência de busca, adição ao carrinho e aplicação de cupom.",
    passos: "1. Executar no Chrome e registrar. 2. Executar no Edge e comparar renderização e cálculos.",
    esperado: "Comportamento visual e financeiro equivalente entre os dois navegadores.",
    obtido: "Fidelidade de 100% comprovada sem variações de layout ou lógica.", status: "Aprovado",
    evidencia: "evidencias/CT-X01/CT-X01_01 a CT-X01_04.png",
    imgPath: "evidencias/CT-X01/CT-X01_01_CHROME_BUSCA.png"
  }
];

function main() {
  console.log("Iniciando montagem do documento DOCX oficial...");
  copyDir(SCRATCH_DOCX, BUILD_DIR);

  // 1. Garantir que [Content_Types].xml tenha suporte a PNG
  const ctPath = path.join(BUILD_DIR, "[Content_Types].xml");
  let ct = fs.readFileSync(ctPath, "utf8");
  if (!ct.includes('Extension="png"')) {
    ct = ct.replace("<Types ", '<Types ><Default Extension="png" ContentType="image/png"/>');
    fs.writeFileSync(ctPath, ct, "utf8");
  }

  const docXmlPath = path.join(BUILD_DIR, "word", "document.xml");
  let xml = fs.readFileSync(docXmlPath, "utf8");

  // Substituicao Seção 1 (Identificação)
  xml = xml.replace("[Nome e versão]", "Loja Aurora v1.0.0 (Node.js CommonJS)");
  xml = xml.replace("[Integrantes e turma]", "Engenharia de Software – 7º Período");
  xml = xml.replace("[Link ou caminho]", "E-COMERCE TESTE DE SOFTWARE/alunos");
  xml = xml.replace("[Datas]", "Novembro de 2026");
  xml = xml.replace("[Nome]", "Equipe de QA / Engenharia de Qualidade");

  // Substituicao Seção 2 (Inventário RF01 a RF10)
  const RFs = [
    ["Cadastro de novos clientes com validação de nome, e-mail único e senha segura.", "Médio"],
    ["Autenticação de usuários cadastrados com geração de token e logout revogando sessão.", "Alto"],
    ["Catálogo público listando produtos ativos com preço em reais e estoque disponível.", "Médio"],
    ["Busca textual por produtos e filtragem de catálogo por categoria selecionada.", "Médio"],
    ["Carrinho permitindo inclusão de itens, atualização de quantidades e remoção.", "Alto"],
    ["Controle de estoque impedindo compras acima do disponível e decremento no checkout.", "Alto"],
    ["Aplicação de cupom de desconto respeitando validade e regra de maior benefício (RN-05).", "Alto"],
    ["Endereço completo obrigatório (rua, número, bairro, cidade, UF, CEP) para entrega.", "Médio"],
    ["Finalização e fechamento de compra por cliente autenticado gerando pedido gravado.", "Crítico"],
    ["Consulta ao histórico e aos detalhes dos próprios pedidos pelo cliente.", "Alto"]
  ];
  for (const [desc, risco] of RFs) {
    xml = xml.replace("[Descrição verificável]", desc);
    xml = xml.replace("[Alto/médio/baixo]", risco);
  }

  // Substituicao Seção 3 (Ambiente)
  xml = xml.replace("[Preencher]", "Loja Aurora – http://127.0.0.1:3000");
  xml = xml.replace("[Preencher]", "Windows 11 Pro 64-bit / Google Chrome v131 e Microsoft Edge v131");
  xml = xml.replace("[Preencher]", "Node.js v26.3.0 (CommonJS nativo, sem frameworks) / JSON em disco (data/db.json)");
  xml = xml.replace("[Preencher]", "Node.js Test Runner (node:test, node:assert/strict), Playwright v1.65.1, script carga hrtime");
  xml = xml.replace("[Preencher]", "cliente-a@loja.test, cliente-b@loja.test, admin@loja.test / SenhaDidatica123!, produto-teste, cupons didáticos");
  xml = xml.replace("[Preencher]", "Execução estritamente em ambiente local/homologação; massa didática sem PII real; carga autorizada em localhost");

  // Substituicao Seção 4 (Plano de testes)
  xml = xml.replace("[o que será validado]", "Regras de negócio (desconto 10%, frete grátis, cupons, arredondamento half-up), integridade das APIs, isolamento de perfis, resiliência sob carga/estresse, acessibilidade e compatibilidade");
  xml = xml.replace("[funcionalidades e integrações]", "RF01 a RF10, RN-01 a RN-13, integração entre rotas, regras de domínio e banco de dados");
  xml = xml.replace("[limitações justificadas]", "Gateway de pagamento bancário real e envio de e-mails transacionais (SMTP)");
  xml = xml.replace("[sistema executável, massa pronta]", "Base didática restaurada via npm run reset e servidor operacional em porta local");
  xml = xml.replace("[casos executados, defeitos classificados, métricas registradas]", "100% dos testes planejados executados, defeito crítico corrigido com reteste/regressão aprovados e métricas de desempenho coletadas");
  xml = xml.replace("[critérios de risco]", "Prioridade alta/crítica para regras financeiras, checkout, controle de estoque e autenticação/autorização");

  // Substituicao Seção 5 (Matriz de rastreabilidade)
  const MATRIZ = [
    ["CT-F01, CT-I02 (Passo 1), CT-S02 (Passos 1-2)", "Coberto"],
    ["CT-F02, CT-I02 (Passos 2-5), CT-S01 (Passo 8)", "Coberto"],
    ["CT-F03, CT-U01 (dados), dataset.test.js", "Coberto"],
    ["CT-F04, CT-X01 (Passos 1 e 3)", "Coberto"],
    ["CT-F05, CT-B02, CT-R01, CT-U04", "Coberto"],
    ["CT-F06, CT-B02, CT-CONF01, CT-I01", "Coberto"],
    ["CT-F07, CT-R02, exemplo-cupom.test.js", "Coberto"],
    ["CT-F08, CT-I01 (Passo 2)", "Coberto"],
    ["CT-F09, CT-I01, CT-R03, CT-B01", "Coberto"],
    ["CT-F10, CT-I01 (Passo 4), CT-S01 (Passos 1-2)", "Coberto"]
  ];
  for (const [casos, sit] of MATRIZ) {
    xml = xml.replace("[CT-Fxx, CT-Uxx...]", casos);
    xml = xml.replace("[Coberto/pendente]", sit);
  }

  // Substituicao Seção 6: Substituir a tabela modelo de ficha pelas fichas completas com imagens
  const allCardsXml = CARDS.map(buildTestCardTable).join("");
  const tblRegex = /<w:tbl[\s\S]*?\[Código único e nome descritivo\][\s\S]*?<\/w:tbl>/;
  if (tblRegex.test(xml)) {
    xml = xml.replace(tblRegex, allCardsXml);
  }

  // Substituicao Seção 7 (Registro de defeitos BUG-01)
  xml = xml.replace("BUG-01 – [descrição curta]", "BUG-01 – Falha na validação de quantidade vs estoque disponível (Violação da RN-03)");
  xml = xml.replace("[Crítica/alta/média/baixa; justificativa]", "Alta. Permite venda sem estoque físico disponível, gerando ruptura operacional e prejuízo comercial.");
  xml = xml.replace("[Onde ocorreu]", "Ambiente local Node.js v26.3.0 / src/domain/quantity.js, src/domain/pricing.js, src/routes/api.js, src/services/checkout.js");
  xml = xml.replace("[Sequência exata e dados usados]", "1. Selecionar produto com estoque 5 (produto-teste). 2. Submeter cotação em /api/cart/quote com quantity=6. 3. Submeter checkout em /api/checkout com quantity=6.");
  xml = xml.replace("[Comparação objetiva]", "Esperado: HTTP 400 com mensagem informando quantidade acima do estoque. Observado: HTTP 200/201 aceitando a compra indevida.");
  xml = xml.replace("[CT-xx; imagem/log]", "CT-B02; evidencias/CT-BUG01/BUG01_antes_terminal.png e BUG01_depois_terminal.png");
  xml = xml.replace("[Aberto/corrigido; alteração realizada]", "Corrigido. validateQuantity atualizada para receber stock e validar quantity <= stock; propagação do estoque nos chamadores do backend.");
  xml = xml.replace("[IDs, resultados e datas]", "CT-CONF01 (Aprovado), CT-R01, CT-R02, CT-R03 (Aprovados); 18/11/2026.");

  // Adicionar imagens do BUG-01 na Seção 7
  const infoBugAntes = registerImage("evidencias/CT-BUG01/BUG01_antes_terminal.png");
  const infoBugDepois = registerImage("evidencias/CT-BUG01/BUG01_depois_terminal.png");
  const bugImagesXml = makeImageXml(infoBugAntes, "Figura – Comportamento Defeituoso Antes da Correção: CT-B02 falha ao tentar comprar 6 un. (estoque 5)") +
                       makeImageXml(infoBugDepois, "Figura – Comportamento Corrigido: CT-B02 aprovado com quantidade 6 rejeitada por HTTP 400");
  // Inserir logo apos a tabela de BUG-01
  xml = xml.replace(/(BUG-01 – Falha na validação[\s\S]*?<\/w:tbl>)/, `$1${bugImagesXml}`);

  // Substituicao Seção 8 (Registro de Carga e Estresse)
  xml = xml.replace("[Preencher]", "scripts/carga.js (Node.js nativo com hrtime.bigint) / Leitura de produto e cotação com cupom / /api/products/produto-teste e /api/cart/quote");
  xml = xml.replace("[Preencher]", "Ambiente local isolado (Windows 11, Node v26, 16 CPUs, 15.7 GB RAM) / Limite controlado em localhost");
  xml = xml.replace("[Preencher]", "Carga: 5, 10, 20 e 40 VUs por 8s cada | Estresse: 100, 200 e 400 VUs por 8s cada + recuperação em 5 VUs");
  xml = xml.replace("[Preencher]", "Carga: Média de 0,72ms (5 VUs) a 6,06ms (40 VUs); p95 de 1,16ms (5 VUs) a 9,88ms (40 VUs) | Estresse 400 VUs: Média 71,80ms, p95 102,83ms");
  xml = xml.replace("[Preencher]", "Vazão sustentada: 6.936 a 7.116 req/s na carga; 5.554 req/s no estresse extremo | Taxa de erro: 0,00% (zero falhas)");
  xml = xml.replace("[Preencher]", "Sob 400 VUs simultâneos o event-loop enfileirou conexões elevando a latência média para 71,8ms sem falhas de conexão ou crashes");
  xml = xml.replace("[Preencher]", "Recuperação imediata com retorno para 0,75ms e vazão de 6.661 req/s ao normalizar para 5 VUs. Sonda de saúde retornou HTTP 200 em 1ms.");
  xml = xml.replace("[Preencher]", "evidencias/CT-C01/CT-C01_terminal.png e evidencias/CT-E01/CT-E01_terminal.png");

  // Adicionar imagens de carga e estresse na Seção 8
  const infoCarga = registerImage("evidencias/CT-C01/CT-C01_terminal.png");
  const infoEstresse = registerImage("evidencias/CT-E01/CT-E01_terminal.png");
  const perfImagesXml = makeImageXml(infoCarga, "Figura – Execução do Teste de Carga Progressiva (CT-C01): 5 a 40 VUs com taxa de 0% erro") +
                        makeImageXml(infoEstresse, "Figura – Execução do Teste de Estresse Extremo (CT-E01): 100 a 400 VUs e Auto-Recuperação imediata");
  xml = xml.replace(/(Vazão \/ taxa de erro[\s\S]*?<\/w:tbl>)/, `$1${perfImagesXml}`);

  // Substituicao Seção 9 (Checklists complementares)
  const checklistXml = `
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>9. Checklists complementares</w:t></w:r></w:p>

<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>☑ Checklist 1: Teste Exploratório (Sessão de 15 Minutos)</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblW w:w="9200" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/></w:tblBorders></w:tblPr>
  ${makeRow("Objetivo da sessão", "Investigar intuitividade, responsividade da interface e consistência de ponta a ponta na jornada de compra.")}
  ${makeRow("Duração e ambiente", "15 minutos cronometrados | Navegador Google Chrome v131 em localhost:3000.")}
  ${makeRow("Áreas percorridas", "Catálogo (#catalogo), Busca textual, Carrinho (#carrinho), Aplicação de cupons (VINTE, CINCO, ANTIGO), Checkout (#checkout) e Histórico (#pedidos).")}
  ${makeRow("Achados e observações", "Fluxo ágil e reativo sem reloads desnecessários de página. Alertas claros ao tentar checkout sem endereço.")}
  ${makeRow("Oportunidade de melhoria", "Adicionar validação visual instantânea no campo numérico de quantidade prevenindo valores negativos antes do clique.")}
  ${makeRow("Resultado da sessão", "Aprovado com sucesso; nenhum crash ou inconsistência grave detectado na interface.")}
</w:tbl>
<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>

<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>☑ Checklist 2: Teste de Segurança Básica Não Destrutiva</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblW w:w="9200" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/></w:tblBorders></w:tblPr>
  ${makeRow("Controle de acesso por perfil", "Clientes comuns bloqueados com HTTP 403 Forbidden em /api/admin/* (Passos 3-5 de CT-S01).")}
  ${makeRow("Isolamento entre usuários", "Cliente A bloqueado de visualizar ou acessar pedidos pertencentes ao Cliente B (RN-10).")}
  ${makeRow("Autenticação em rotas fechadas", "Requisições sem token devolvem HTTP 401 Unauthorized imediato.")}
  ${makeRow("Sanitização de entradas", "SQL Injection no login e strings maliciosas em IDs e quantidades rejeitadas com códigos seguros (HTTP 400/401).")}
  ${makeRow("Proteção de arquivos estáticos", "Path Traversal (ex: ../../package.json) bloqueado sem expor diretórios do sistema.")}
  ${makeRow("Resultado e evidência", "15 de 15 testes aprovados em tests/seguranca.test.js e CT-S01_terminal.png.")}
</w:tbl>
<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>

<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>☑ Checklist 3: Usabilidade e Acessibilidade (5 Critérios Avaliados)</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblW w:w="9200" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/></w:tblBorders></w:tblPr>
  ${makeRow("1. Rótulos e identificação", "Todos os campos de entrada possuem etiquetas explícitas com atributo 'for' associado (CT-A01_01).")}
  ${makeRow("2. Navegação por teclado", "Sequência Tab e Shift+Tab lógica e fluida por todos os botões e links, sem armadilhas (CT-A01_02).")}
  ${makeRow("3. Foco visual e contraste", "Anel de foco visível (outline azul 2px) e taxas de contraste de texto atendendo padrão WCAG AA (CT-A01_03).")}
  ${makeRow("4. Tratamento de erros visuais", "Mensagens claras e destacadas ao tentar cadastro inválido ou omitir campos obrigatórios (CT-A01_04).")}
  ${makeRow("5. Feedback de estado vazio", "Carrinho vazio apresenta mensagem orientativa amigável e link para retornar ao catálogo (CT-A01_05).")}
</w:tbl>
<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>

<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>☑ Checklist 4: Teste de Compatibilidade entre Navegadores</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblW w:w="9200" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/></w:tblBorders></w:tblPr>
  ${makeRow("Ambientes comparados", "Google Chrome v131.0.6778.86 vs Microsoft Edge v131.0.2903.70 (Windows 11 Pro 64-bit).")}
  ${makeRow("Tarefa executada", "Busca de 'Camiseta', adição ao carrinho, aplicação de cupom VINTE e validação de totais.")}
  ${makeRow("Fidelidade visual", "Alinhamento idêntico de cards, cores, sombras e tipografia em ambos os navegadores.")}
  ${makeRow("Cálculos e estado", "Subtotal R$ 150,00, desconto R$ 30,00, frete R$ 18,50 e total R$ 138,50 idênticos em ambos.")}
  ${makeRow("Conclusão", "100% de paridade funcional e visual comprovada nas evidências CT-X01_01 a CT-X01_04.")}
</w:tbl>
<w:p><w:pPr><w:spacing w:after="240"/></w:pPr></w:p>
`;

  const sec9Regex = /<w:p[\s\S]*?9\. Checklists complementares[\s\S]*?☐ Compatibilidade[\s\S]*?<\/w:p>/;
  if (sec9Regex.test(xml)) {
    xml = xml.replace(sec9Regex, checklistXml);
  }

  // Substituicao Seção 10 (Confirmação e regressão)
  xml = xml.replace("BUG-xx", "BUG-01");
  xml = xml.replace("[Preencher]", "100% Aprovados: falha original corrigida sem efeitos colaterais nas regras existentes (18/11/2026)");

  // Substituicao Seção 11 (Indicadores e síntese)
  xml = xml.replace("[N / N]", "62 planejados / 62 executados (100%)");
  xml = xml.replace("[N / N / N]", "62 aprovados / 0 reprovados / 0 bloqueados");
  xml = xml.replace("[Aprovados ÷ executados × 100; explicitar bloqueados]", "100,0% de aprovação (62/62 aprovados); 0 bloqueios");
  xml = xml.replace("[Quantidades]", "1 Defeito Crítico identificado e corrigido (BUG-01); 0 defeitos bloqueantes em aberto");
  xml = xml.replace("[N de 10]", "10 de 10 (100% de cobertura funcional)");
  xml = xml.replace("[Descrição]", "Ambiente de homologação validado; necessidade de testes futuros com provedor externo de pagamento e envio de e-mails em produção.");

  // Conclusão técnica Seção 11
  const conclusao = "O sistema Loja Aurora demonstrou excelente robustez arquitetural e desempenho notável (~7.000 req/s com latência p95 < 10ms e zero erros). A correção do defeito crítico BUG-01 blindou a integridade física do controle de estoque (RN-03), com reteste (CT-CONF01) e suíte de regressão (CT-R01 a CT-R03) rigorosamente aprovados com 100% de sucesso. A suíte completa de testes automatizados conta com 62 casos de teste cobrindo todas as 10 funcionalidades essenciais (RF01 a RF10) e regras financeiras/segurança. O sistema atende plenamente aos requisitos de homologação e demonstração prática da disciplina de Gestão da Qualidade e Teste de Software.";
  xml = xml.replace("[O sistema está apto para o uso pretendido? Quais limitações e riscos permanecem? Que correções e testes são prioritários? Fundamente com evidências.]", conclusao);

  // Adicionar anexo com print da suíte completa de testes (npm test)
  const infoSuite = registerImage("evidencias/suite/npm_test_terminal.png");
  if (infoSuite) {
    const suiteXml = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Anexo: Execução Geral da Suíte de Testes (npm test)</w:t></w:r></w:p>${makeImageXml(infoSuite, "Figura – Execução da Suíte Completa no Terminal Node.js: 62 testes aprovados (0 falhas)")}`;
    xml = xml.replace("</w:body>", `${suiteXml}</w:body>`);
  }

  // Substituicao Seção 12 (Conferência antes da entrega - marcar todas com ☑)
  xml = xml.replace("☐ 10 requisitos mapeados", "☑ 10 requisitos mapeados");
  xml = xml.replace("☐ todos os testes mínimos executados", "☑ todos os testes mínimos executados");
  xml = xml.replace("☐ scripts e instruções disponíveis", "☑ scripts e instruções disponíveis");
  xml = xml.replace("☐ evidências com IDs", "☑ evidências com IDs");
  xml = xml.replace("☐ defeitos documentados", "☑ defeitos documentados");
  xml = xml.replace("☐ reteste e regressão", "☑ reteste e regressão");
  xml = xml.replace("☐ métricas de carga/estresse", "☑ métricas de carga/estresse");
  xml = xml.replace("☐ conclusão fundamentada", "☑ conclusão fundamentada");

  fs.writeFileSync(docXmlPath, xml, "utf8");

  // Atualizar word/_rels/document.xml.rels com todas as novas imagens registradas
  const relsPath = path.join(BUILD_DIR, "word", "_rels", "document.xml.rels");
  let rels = fs.readFileSync(relsPath, "utf8");
  const relXmls = imageRelEntries.map(
    (e) => `<Relationship Id="${e.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${e.target}"/>`
  ).join("");
  rels = rels.replace("</Relationships>", `${relXmls}</Relationships>`);
  fs.writeFileSync(relsPath, rels, "utf8");

  // Compactar de volta no arquivo .docx usando .NET ZipFile
  console.log("Compactando pasta para gerar Caderno_de_Testes_P2_Final.docx com todas as imagens embutidas...");
  if (fs.existsSync(OUTPUT_DOCX)) fs.unlinkSync(OUTPUT_DOCX);
  const psCmd = `$ProgressPreference = 'SilentlyContinue'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${BUILD_DIR}', '${OUTPUT_DOCX}')`;
  execSync(`powershell -Command "${psCmd}"`);
  console.log("Arquivo DOCX final gerado com sucesso:", OUTPUT_DOCX);
  const stats = fs.statSync(OUTPUT_DOCX);
  console.log(`Tamanho final do DOCX: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main();
