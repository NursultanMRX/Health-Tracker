import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [assignedDoctorId, setAssignedDoctorId] = useState<string>('');
  const [doctors, setDoctors] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load doctors when signing up as a patient
  useEffect(() => {
    if (isSignUp && role === 'patient') {
      loadDoctors();
    }
  }, [isSignUp, role]);

  const loadDoctors = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName, role, age, gender, assignedDoctorId || undefined);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Tracker</h1>
          <p className="text-gray-600">Diabetes self-monitoring made simple</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                  <div className="flex gap-3">
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="role"
                        value="patient"
                        checked={role === 'patient'}
                        onChange={() => setRole('patient')}
                        className="sr-only peer"
                      />
                      <div className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                        Patient
                      </div>
                    </label>
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="role"
                        value="doctor"
                        checked={role === 'doctor'}
                        onChange={() => setRole('doctor')}
                        className="sr-only peer"
                      />
                      <div className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                        Doctor
                      </div>
                    </label>
                  </div>
                </div>

                {role === 'patient' && (
                  <>
                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="25"
                        min="1"
                        max="120"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <div className="flex gap-3">
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={gender === 'male'}
                            onChange={() => setGender('male')}
                            className="sr-only peer"
                          />
                          <div className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                            Male
                          </div>
                        </label>
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={gender === 'female'}
                            onChange={() => setGender('female')}
                            className="sr-only peer"
                          />
                          <div className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-400 transition-colors">
                            Female
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                        Select a Doctor (Optional)
                      </label>
                      <select
                        id="doctor"
                        value={assignedDoctorId}
                        onChange={(e) => setAssignedDoctorId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                      >
                        <option value="">Proceed on my own</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.full_name} - {doctor.email}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {assignedDoctorId
                          ? 'Charts will be visible to your selected doctor'
                          : 'Charts will only be visible to you'}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
