import jsPDF from 'jspdf';

const handleDownload = () => {
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(18);
  doc.text(playbook.businessName, 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text(playbook.overview, 20, y, { maxWidth: 170 });
  y += 20;
  
  playbook.weeks.forEach(week => {
    doc.setFontSize(14);
    doc.text('Week ' + week.week + ': ' + week.title, 20, y);
    y += 7;
    
    week.dailyTasks.forEach(task => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text('Day ' + task.day + ': ' + task.title, 20, y);
      y += 5;
      doc.setFontSize(9);
      doc.text(task.description, 25, y, { maxWidth: 165 });
      y += 10;
    });
    y += 5;
  });
  
  doc.save(playbook.businessName + '-Playbook.pdf');
};
