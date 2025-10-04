import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('./diabetes.db');

// Get all patient users
const patients = db.prepare("SELECT id, full_name FROM profiles WHERE role = 'patient'").all();

console.log(`Found ${patients.length} patients. Generating health data...`);

const exerciseLevels = ['Low', 'Moderate', 'High'];
const dietTypes = ['Vegetarian', 'Vegan', 'Balanced', 'Junk Food', 'Keto'];
const stressLevels = ['Low', 'Moderate', 'High'];
const genders = ['Male', 'Female'];
const mentalHealthConditions = ['None', 'Anxiety', 'Depression', 'None', 'None']; // More "None" for realistic distribution

// Helper function to generate random number in range
const randomInRange = (min, max, decimals = 0) => {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value);
};

// Helper function to get random array element
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

patients.forEach((patient, index) => {
  console.log(`\nGenerating data for: ${patient.full_name}`);

  // Generate 3-5 health metric entries for each patient
  const numEntries = randomInRange(3, 5);

  for (let i = 0; i < numEntries; i++) {
    const daysAgo = randomInRange(0, 60); // Spread over last 60 days
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const healthData = {
      id: uuidv4(),
      patient_id: patient.id,
      timestamp: timestamp,
      age: randomInRange(25, 75),
      gender: randomChoice(genders),
      exercise_level: randomChoice(exerciseLevels),
      diet_type: randomChoice(dietTypes),
      sleep_hours: randomInRange(5, 9, 1),
      stress_level: randomChoice(stressLevels),
      mental_health_condition: randomChoice(mentalHealthConditions),
      work_hours_per_week: randomInRange(20, 60),
      screen_time_per_day_hours: randomInRange(2, 8, 1),
      social_interaction_score: randomInRange(3, 10, 1),
      happiness_score: randomInRange(4, 10, 1),
      bmi: randomInRange(18, 35, 1),
      hypertension: Math.random() > 0.7 ? 1 : 0,
      heart_disease: Math.random() > 0.85 ? 1 : 0,
      hba1c_level: randomInRange(4.5, 7.5, 1),
      blood_glucose_level: randomInRange(70, 180),
    };

    db.prepare(`
      INSERT INTO health_metrics (
        id, patient_id, timestamp, age, gender, exercise_level, diet_type,
        sleep_hours, stress_level, mental_health_condition, work_hours_per_week,
        screen_time_per_day_hours, social_interaction_score, happiness_score,
        bmi, hypertension, heart_disease, hba1c_level, blood_glucose_level
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      healthData.id,
      healthData.patient_id,
      healthData.timestamp,
      healthData.age,
      healthData.gender,
      healthData.exercise_level,
      healthData.diet_type,
      healthData.sleep_hours,
      healthData.stress_level,
      healthData.mental_health_condition,
      healthData.work_hours_per_week,
      healthData.screen_time_per_day_hours,
      healthData.social_interaction_score,
      healthData.happiness_score,
      healthData.bmi,
      healthData.hypertension,
      healthData.heart_disease,
      healthData.hba1c_level,
      healthData.blood_glucose_level
    );

    console.log(`  ✓ Entry ${i + 1}: age=${healthData.age}, gender=${healthData.gender}, glucose=${healthData.blood_glucose_level}`);
  }
});

// Show summary
const totalMetrics = db.prepare("SELECT COUNT(*) as count FROM health_metrics").get();
console.log(`\n✅ Successfully generated ${totalMetrics.count} health metric entries for ${patients.length} patients!`);

// Show sample data
console.log('\n📊 Sample health metrics:');
const samples = db.prepare("SELECT * FROM health_metrics LIMIT 3").all();
samples.forEach(sample => {
  console.log(`
  ID: ${sample.id}
  Age: ${sample.age}, Gender: ${sample.gender}
  Exercise: ${sample.exercise_level}, Diet: ${sample.diet_type}
  Sleep: ${sample.sleep_hours}h, Stress: ${sample.stress_level}
  BMI: ${sample.bmi}, HbA1c: ${sample.hba1c_level}%, Glucose: ${sample.blood_glucose_level} mg/dL
  Happiness: ${sample.happiness_score}/10, Social: ${sample.social_interaction_score}/10
  `);
});

db.close();
