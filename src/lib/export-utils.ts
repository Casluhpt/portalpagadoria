import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportResultadosPDF = async (data: {
  total: number;
  valorTotal: string;
  filtros: { label: string; value: string }[];
  byMonth: { label: string; count: number }[];
  byUser: { name: string; value: number }[];
  byModalidade: { name: string; count: number }[];
  byEmpresa: { name: string; count: number }[];
}) => {
  const doc = new jsPDF();
  const purple = [76, 29, 149]; // #4c1d95

  // Header
  doc.setFillColor(purple[0], purple[1], purple[2]);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Resumo de Resultados Principais", 15, 25);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 15, 33);

  // Totais
  let currentY = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Indicadores Gerais", 15, currentY);
  
  currentY += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Lançamentos: ${data.total.toLocaleString("pt-BR")}`, 20, currentY);
  currentY += 7;
  doc.text(`Valor Total Estimado: ${data.valorTotal}`, 20, currentY);

  // Filtros Aplicados
  if (data.filtros.length > 0) {
    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Filtros Aplicados", 15, currentY);
    currentY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    data.filtros.forEach(f => {
      doc.text(`${f.label}: ${f.value}`, 20, currentY);
      currentY += 6;
    });
  }

  // Tabelas de Resumo
  currentY += 10;
  
  // Mensal
  autoTable(doc, {
    startY: currentY,
    head: [["Mês/Ano", "Quantidade"]],
    body: data.byMonth.map(m => [m.label, m.count]),
    headStyles: { fillColor: purple },
    margin: { left: 15 },
    tableWidth: 85,
  });

  // Usuários
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Colaborador", "Lançamentos"]],
    body: data.byUser.map(u => [u.name, u.value]),
    headStyles: { fillColor: purple },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // Modalidades
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Modalidade", "Quantidade"]],
    body: data.byModalidade.map(m => [m.name, m.count]),
    headStyles: { fillColor: purple },
    margin: { left: 15 },
    tableWidth: 180,
  });

  // Empresas
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Empresa", "Quantidade"]],
    body: data.byEmpresa.map(e => [e.name, e.count]),
    headStyles: { fillColor: purple },
    margin: { left: 15 },
    tableWidth: 180,
  });

  doc.save("Relatorio_Resultados_Principais.pdf");
};
