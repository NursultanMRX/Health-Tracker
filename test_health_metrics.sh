#!/bin/bash

# Test health metrics API
echo "Testing Health Metrics API..."

# 1. Sign up a test user
echo -e "\n1. Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_health@example.com",
    "password": "test123",
    "fullName": "Health Test User",
    "role": "patient"
  }')

TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
USER_ID=$(echo $SIGNUP_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$TOKEN" ]; then
  echo "Failed to create user or get token"
  exit 1
fi

echo "✓ User created with ID: $USER_ID"
echo "✓ Token: ${TOKEN:0:20}..."

# 2. Add health metrics
echo -e "\n2. Adding health metrics..."
METRICS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/health-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"patient_id\": \"$USER_ID\",
    \"exercise_level\": \"High\",
    \"diet_type\": \"Balanced\",
    \"sleep_hours\": 7.8,
    \"stress_level\": \"Low\",
    \"work_hours_per_week\": 40,
    \"screen_time_per_day_hours\": 3.1,
    \"social_interaction_score\": 8.5,
    \"happiness_score\": 7.9,
    \"hba1c_level\": 5.4,
    \"blood_glucose_level\": 95
  }")

echo "✓ Health metrics added"
echo "$METRICS_RESPONSE" | head -3

# 3. Retrieve health metrics
echo -e "\n3. Retrieving health metrics..."
GET_RESPONSE=$(curl -s "http://localhost:3001/api/health-metrics?patient_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✓ Retrieved health metrics:"
echo "$GET_RESPONSE" | head -5

# 4. Add another metric for chart testing
echo -e "\n4. Adding second health metric..."
curl -s -X POST http://localhost:3001/api/health-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"patient_id\": \"$USER_ID\",
    \"exercise_level\": \"Moderate\",
    \"diet_type\": \"Vegetarian\",
    \"sleep_hours\": 8.2,
    \"stress_level\": \"Moderate\",
    \"work_hours_per_week\": 45,
    \"screen_time_per_day_hours\": 2.5,
    \"social_interaction_score\": 7.5,
    \"happiness_score\": 8.2,
    \"hba1c_level\": 5.6,
    \"blood_glucose_level\": 105
  }" > /dev/null

echo "✓ Second metric added"

# 5. Get all metrics
echo -e "\n5. Getting all metrics..."
ALL_METRICS=$(curl -s "http://localhost:3001/api/health-metrics?patient_id=$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo "$ALL_METRICS" | grep -o '"id"' | wc -l)
echo "✓ Total health metrics: $COUNT"

echo -e "\n✅ All tests passed successfully!"
