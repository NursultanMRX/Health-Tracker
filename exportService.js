import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate PDF Report
export async function generatePDFReport(patientData, readings, healthMetrics) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Calculate statistics
    const avgGlucose = readings.length > 0
      ? (readings.reduce((sum, r) => sum + r.value_mg_dl, 0) / readings.length).toFixed(1)
      : 'N/A';

    const targetLow = 70;
    const targetHigh = 180;
    const inRange = readings.filter(r => r.value_mg_dl >= targetLow && r.value_mg_dl <= targetHigh).length;
    const tir = readings.length > 0 ? ((inRange / readings.length) * 100).toFixed(1) : '0';

    const latestMetric = healthMetrics.length > 0 ? healthMetrics[0] : null;
    const riskPercentage = latestMetric?.risk_percentage || 'N/A';
    const riskLevel = latestMetric?.risk_level || 'N/A';

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #ffffff;
            color: #333;
          }
          .header {
            border-bottom: 4px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header .subtitle {
            color: #64748b;
            font-size: 14px;
          }
          .patient-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .patient-info h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .stat-card.warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }
          .stat-card.success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .stat-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 32px;
            font-weight: bold;
          }
          .stat-unit {
            font-size: 14px;
            opacity: 0.9;
            margin-left: 4px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h3 {
            color: #1e40af;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
          }
          thead {
            background: #f8fafc;
          }
          th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          tr:hover {
            background: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-low {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-normal {
            background: #d1fae5;
            color: #065f46;
          }
          .badge-high {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Report</h1>
          <div class="subtitle">Patient Health Summary and Glucose Monitoring Data</div>
        </div>

        <div class="patient-info">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Full Name</span>
              <span class="info-value">${patientData.full_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">${patientData.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date of Birth</span>
              <span class="info-value">${patientData.date_of_birth || 'Not specified'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gender</span>
              <span class="info-value">${patientData.sex || 'Not specified'}</span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Average Glucose</div>
            <div class="stat-value">${avgGlucose}<span class="stat-unit">mg/dL</span></div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Time in Range</div>
            <div class="stat-value">${tir}<span class="stat-unit">%</span></div>
          </div>
          <div class="stat-card ${riskPercentage > 70 ? 'warning' : 'success'}">
            <div class="stat-label">Diabetes Risk</div>
            <div class="stat-value">${riskPercentage}<span class="stat-unit">%</span></div>
          </div>
        </div>

        <div class="section">
          <h3>Recent Glucose Readings (Last 30 entries)</h3>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Glucose Value</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${readings.slice(0, 30).map(reading => {
                const date = new Date(reading.timestamp);
                const value = reading.value_mg_dl;
                let badge = 'badge-normal';
                let status = 'Normal';

                if (value < targetLow) {
                  badge = 'badge-low';
                  status = 'Low';
                } else if (value > targetHigh) {
                  badge = 'badge-high';
                  status = 'High';
                }

                return `
                  <tr>
                    <td>${date.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                    <td><strong>${value} mg/dL</strong></td>
                    <td>${reading.measurement_type || 'Random'}</td>
                    <td><span class="badge ${badge}">${status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p style="margin-top: 8px;">Health Tracker - Diabetes Management System</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// Generate CSV Report
export async function generateCSVReport(patientData, readings) {
  const csvPath = path.join(__dirname, `report_${patientData.id}_${Date.now()}.csv`);

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'timestamp', title: 'Date & Time' },
      { id: 'value_mg_dl', title: 'Glucose (mg/dL)' },
      { id: 'measurement_type', title: 'Measurement Type' },
      { id: 'status', title: 'Status' },
      { id: 'note', title: 'Notes' }
    ]
  });

  const targetLow = 70;
  const targetHigh = 180;

  const records = readings.map(reading => {
    const value = reading.value_mg_dl;
    let status = 'Normal';

    if (value < targetLow) {
      status = 'Low';
    } else if (value > targetHigh) {
      status = 'High';
    }

    return {
      timestamp: new Date(reading.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      value_mg_dl: reading.value_mg_dl,
      measurement_type: reading.measurement_type || 'Random',
      status: status,
      note: reading.note || ''
    };
  });

  await csvWriter.writeRecords(records);

  // Read the file and return buffer
  const csvBuffer = fs.readFileSync(csvPath);

  // Clean up the temporary file
  fs.unlinkSync(csvPath);

  return csvBuffer;
}
