'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { GraduationCap, Briefcase, Users, BookOpen, ChevronRight } from 'lucide-react'; // Assuming Briefcase was intended or replace if needed

// Keep USER_ROLES object as is
const USER_ROLES = {
  learner: {
    title: 'Learner',
    icon: GraduationCap,
    types: [
      { value: 'high_school_student', label: 'High School Student' },
      { value: 'university_student', label: 'University Student' },
      { value: 'professional_dev', label: 'Professional Development' },
      { value: 'language_learner', label: 'Language Learner' },
    ],
  },
  educator: {
    title: 'Educator',
    icon: Users, // Corrected icon
    types: [
      { value: 'high_school_teacher', label: 'High School Teacher' },
      { value: 'university_professor', label: 'University Professor' },
      { value: 'parent', label: 'Parent' },
      { value: 'corporate_trainer', label: 'Corporate Trainer' },
      { value: 'tutor_instructor', label: 'Tutor/Instructor' },
    ],
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userRole: '',
    roleType: '',
    interests: [], // No type needed
    gradeLevel: '',
    subjects: [], // No type needed
  });

  const handleRoleSelect = (role) => { // Removed type
    setFormData({ ...formData, userRole: role, roleType: '' });
    setStep(2);
  };

  const handleRoleTypeSelect = (type) => { // Removed type
    setFormData({ ...formData, roleType: type });
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.onboarding({
        user_role: formData.userRole,
        role_type: formData.roleType,
        interests: formData.interests,
        grade_level: formData.gradeLevel || null, // Send null if empty
        subjects: formData.subjects,
      });
      toast.success('Profile setup complete!');
      router.push('/dashboard');
    } catch (error) { // Removed 'any' type
      console.error("Onboarding error:", error);
      const message = error.response?.data?.detail || error.message || 'Onboarding failed. Please try again.';
      toast.error(String(message)); // Ensure message is a string
    } finally {
      setLoading(false);
    }
  };

  // The rest of the return (...) JSX remains exactly the same as you provided
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to QuizCraft AI! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's personalize your learning experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > s ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          {/* Step 1: Select Role */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                I am a...
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(USER_ROLES).map(([key, role]) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleRoleSelect(key)}
                      className="p-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                    >
                      <Icon className="w-16 h-16 mx-auto mb-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {role.title}
                      </h3>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Role Type */}
          {step === 2 && formData.userRole && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-purple-600 hover:text-purple-700 mb-6 flex items-center"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What best describes you?
              </h2>
              <div className="space-y-3">
                {USER_ROLES[formData.userRole].types.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleRoleTypeSelect(type.value)}
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-between group"
                  >
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Interests & Subjects */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-purple-600 hover:text-purple-700 mb-6 flex items-center"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Tell us about your interests
              </h2>
              <div className="space-y-6">
                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What topics interest you? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Science', 'Math', 'History', 'Literature', 'Technology', 'Languages', 'Arts', 'Business'].map(
                      (interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              interests: prev.interests.includes(interest)
                                ? prev.interests.filter((i) => i !== interest)
                                : [...prev.interests, interest],
                            }));
                          }}
                          className={`px-4 py-2 rounded-full border-2 transition-all ${
                            formData.interests.includes(interest)
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-300 dark:border-gray-600 hover:border-purple-500'
                          }`}
                        >
                          {interest}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Grade Level (for learners) */}
                {formData.userRole === 'learner' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Grade Level (Optional)
                    </label>
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select grade level</option>
                      <option value="elementary">Elementary</option>
                      <option value="middle">Middle School</option>
                      <option value="high">High School</option>
                      <option value="college">College</option>
                      <option value="graduate">Graduate</option>
                    </select>
                  </div>
                )}
                
                {/* Add Subjects Selection Similarly if needed */}

                {/* Complete Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.userRole || !formData.roleType} // Disable if role/type not selected
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? 'Setting up your profile...' : 'Complete Setup'}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  You can always update these preferences later in settings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}