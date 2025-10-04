const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const db = new Database('diabetes.db');

// Fake patient data
const fakePatients = [
  { name: 'John Smith', email: 'john.smith@example.com', age: 45, sex: 'male', dob: '1979-03-15' },
  { name: 'Emily Johnson', email: 'emily.j@example.com', age: 32, sex: 'female', dob: '1992-07-22' },
  { name: 'Michael Brown', email: 'mbrown@example.com', age: 58, sex: 'male', dob: '1966-11-08' },
  { name: 'Sarah Davis', email: 'sarah.davis@example.com', age: 41, sex: 'female', dob: '1983-04-17' },
  { name: 'David Wilson', email: 'dwilson@example.com', age: 35, sex: 'male', dob: '1989-09-30' },
  { name: 'Jessica Martinez', email: 'jmartinez@example.com', age: 29, sex: 'female', dob: '1995-12-05' },
  { name: 'James Anderson', email: 'james.a@example.com', age: 52, sex: 'male', dob: '1972-02-28' },
  { name: 'Linda Taylor', email: 'ltaylor@example.com', age: 47, sex: 'female', dob: '1977-08-14' },
  { name: 'Robert Thomas', email: 'rthomas@example.com', age: 39, sex: 'male', dob: '1985-06-20' },
  { name: 'Patricia Moore', email: 'pmoore@example.com', age: 44, sex: 'female', dob: '1980-10-11' },
  { name: 'Christopher Jackson', email: 'cjackson@example.com', age: 37, sex: 'male', dob: '1987-01-25' },
  { name: 'Mary White', email: 'mwhite@example.com', age: 55, sex: 'female', dob: '1969-05-09' },
  { name: 'Daniel Harris', email: 'dharris@example.com', age: 42, sex: 'male', dob: '1982-12-03' },
  { name: 'Barbara Martin', email: 'bmartin@example.com', age: 50, sex: 'female', dob: '1974-07-19' },
  { name: 'Matthew Thompson', email: 'mthompson@example.com', age: 33, sex: 'male', dob: '1991-11-27' },
  { name: 'Jennifer Garcia', email: 'jgarcia@example.com', age: 38, sex: 'female', dob: '1986-03-16' },
  { name: 'Anthony Rodriguez', email: 'arodriguez@example.com', age: 46, sex: 'male', dob: '1978-09-22' },
  { name: 'Susan Lee', email: 'slee@example.com', age: 31, sex: 'female', dob: '1993-04-08' },
  { name: 'Mark Walker', email: 'mwalker@example.com', age: 54, sex: 'male', dob: '1970-08-30' },
  { name: 'Lisa Hall', email: 'lhall@example.com', age: 36, sex: 'female', dob: '1988-02-14' },
  { name: 'Paul Allen', email: 'pallen@example.com', age: 49, sex: 'male', dob: '1975-06-21' },
  { name: 'Nancy Young', email: 'nyoung@example.com', age: 43, sex: 'female', dob: '1981-10-05' },
  { name: 'Steven King', email: 'sking@example.com', age: 40, sex: 'male', dob: '1984-12-18' },
  { name: 'Betty Wright', email: 'bwright@example.com', age: 56, sex: 'female', dob: '1968-03-29' },
  { name: 'Kevin Lopez', email: 'klopez@example.com', age: 34, sex: 'male', dob: '1990-07-12' },
  { name: 'Margaret Hill', email: 'mhill@example.com', age: 48, sex: 'female', dob: '1976-11-23' },
  { name: 'Brian Scott', email: 'bscott@example.com', age: 51, sex: 'male', dob: '1973-05-07' },
  { name: 'Sandra Green', email: 'sgreen@example.com', age: 30, sex: 'female', dob: '1994-09-15' },
  { name: 'George Adams', email: 'gadams@example.com', age: 57, sex: 'male', dob: '1967-01-20' },
  { name: 'Ashley Baker', email: 'abaker@example.com', age: 28, sex: 'female', dob: '1996-08-04' },
];

// Create a doctor account (if not exists)
const existingDoctor = db.prepare('SELECT id FROM profiles WHERE email = ?').get('doctor@hospital.com');
let doctorId;

if (!existingDoctor) {
  doctorId = uuidv4();
  const doctorPassword = bcrypt.hashSync('doctor123', 10);

  db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(doctorId, 'doctor@hospital.com', doctorPassword, 'Dr. Amanda Chen', 'doctor');

  console.log('✓ Created doctor account: doctor@hospital.com / doctor123');
} else {
  console.log('✓ Doctor account already exists: doctor@hospital.com');
}

// Create patient accounts (skip if exists)
const patientIds = [];
fakePatients.forEach((patient, index) => {
  const existingPatient = db.prepare('SELECT id FROM profiles WHERE email = ?').get(patient.email);

  if (!existingPatient) {
    const patientId = uuidv4();
    const password = bcrypt.hashSync('patient123', 10);

    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, date_of_birth, sex, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 365)} days'))
    `).run(patientId, patient.email, password, patient.name, 'patient', patient.dob, patient.sex);

    patientIds.push({ id: patientId, ...patient });
  } else {
    patientIds.push({ id: existingPatient.id, ...patient });
  }
});

const newPatientsCount = fakePatients.length - db.prepare('SELECT COUNT(*) as count FROM profiles WHERE role = ?').get('patient').count + patientIds.length;
console.log(`✓ Created ${newPatientsCount} patient accounts (password: patient123)`);

// Generate health metrics with random risk assessments
const exerciseLevels = ['Low', 'Moderate', 'High'];
const dietTypes = ['Balanced', 'Vegetarian', 'Vegan', 'Keto', 'Junk Food'];
const stressLevels = ['Low', 'Moderate', 'High'];
const mentalHealthConditions = ['None', 'Anxiety', 'Depression', 'Both'];
const riskLevels = ['Low Risk', 'Moderate Risk', 'High Risk'];

let totalEntries = 0;

patientIds.forEach(patient => {
  const numEntries = 3 + Math.floor(Math.random() * 3); // 3-5 entries per patient

  for (let i = 0; i < numEntries; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const healthData = {
      id: uuidv4(),
      patient_id: patient.id,
      timestamp,
      age: patient.age,
      gender: patient.sex === 'male' ? 'Male' : patient.sex === 'female' ? 'Female' : 'Other',
      exercise_level: exerciseLevels[Math.floor(Math.random() * exerciseLevels.length)],
      diet_type: dietTypes[Math.floor(Math.random() * dietTypes.length)],
      sleep_hours: (5 + Math.random() * 4).toFixed(1),
      stress_level: stressLevels[Math.floor(Math.random() * stressLevels.length)],
      mental_health_condition: mentalHealthConditions[Math.floor(Math.random() * mentalHealthConditions.length)],
      work_hours_per_week: (30 + Math.random() * 30).toFixed(1),
      screen_time_per_day_hours: (2 + Math.random() * 8).toFixed(1),
      social_interaction_score: (3 + Math.random() * 7).toFixed(1),
      happiness_score: (3 + Math.random() * 7).toFixed(1),
      bmi: (18 + Math.random() * 17).toFixed(1),
      hypertension: Math.random() > 0.7 ? 1 : 0,
      heart_disease: Math.random() > 0.85 ? 1 : 0,
      hba1c_level: (4.5 + Math.random() * 3).toFixed(1),
      blood_glucose_level: Math.floor(70 + Math.random() * 130),
    };

    // Generate random risk assessment
    const riskProb = Math.random();
    const riskPercentage = (riskProb * 100).toFixed(1) + '%';
    const riskLevel = riskProb < 0.3 ? 'Low Risk' : riskProb < 0.7 ? 'Moderate Risk' : 'High Risk';
    const recommendations = [
      'Maintain a balanced diet and regular exercise routine.',
      'Consider increasing physical activity levels.',
      'Monitor blood glucose levels more frequently.',
      'Consult with your healthcare provider about lifestyle changes.',
      'Focus on stress reduction and adequate sleep.',
    ];
    const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

    db.prepare(`
      INSERT INTO health_metrics (
        id, patient_id, timestamp, age, gender, exercise_level, diet_type,
        sleep_hours, stress_level, mental_health_condition, work_hours_per_week,
        screen_time_per_day_hours, social_interaction_score, happiness_score,
        bmi, hypertension, heart_disease, hba1c_level, blood_glucose_level,
        risk_probability, risk_percentage, risk_level, recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      healthData.id, healthData.patient_id, healthData.timestamp,
      healthData.age, healthData.gender, healthData.exercise_level, healthData.diet_type,
      healthData.sleep_hours, healthData.stress_level, healthData.mental_health_condition,
      healthData.work_hours_per_week, healthData.screen_time_per_day_hours,
      healthData.social_interaction_score, healthData.happiness_score,
      healthData.bmi, healthData.hypertension, healthData.heart_disease,
      healthData.hba1c_level, healthData.blood_glucose_level,
      riskProb, riskPercentage, riskLevel, recommendation
    );

    totalEntries++;
  }
});

console.log(`✓ Created ${totalEntries} health metrics entries with risk assessments`);

// Generate some glucose readings for patients
let glucoseReadings = 0;
patientIds.forEach(patient => {
  const numReadings = 10 + Math.floor(Math.random() * 20); // 10-30 readings per patient

  for (let i = 0; i < numReadings; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO glucose_readings (id, patient_id, value_mg_dl, timestamp, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(
      uuidv4(),
      patient.id,
      Math.floor(70 + Math.random() * 150),
      timestamp
    );

    glucoseReadings++;
  }
});

console.log(`✓ Created ${glucoseReadings} glucose readings`);

// Generate some clinical alerts for high-risk patients
const highRiskPatients = patientIds.filter(() => Math.random() > 0.7);
let alertsCreated = 0;

highRiskPatients.forEach(patient => {
  const alertTypes = ['High Glucose', 'Low Glucose', 'Irregular Pattern'];
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

  db.prepare(`
    INSERT INTO clinical_alerts (id, patient_id, alert_type, severity, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
  `).run(
    uuidv4(),
    patient.id,
    alertType,
    Math.random() > 0.5 ? 'high' : 'medium',
    `${alertType} detected - requires attention`,
    'active',
    Math.floor(Math.random() * 48)
  );

  alertsCreated++;
});

console.log(`✓ Created ${alertsCreated} clinical alerts`);

db.close();

console.log('\n=== Summary ===');
console.log(`Total patients: ${fakePatients.length}`);
console.log(`Total health metrics: ${totalEntries}`);
console.log(`Total glucose readings: ${glucoseReadings}`);
console.log(`Total clinical alerts: ${alertsCreated}`);
console.log('\nLogin credentials:');
console.log('Doctor: doctor@hospital.com / doctor123');
console.log('Patients: [any-email] / patient123');
