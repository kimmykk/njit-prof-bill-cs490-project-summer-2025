import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { useProfile, EducationEntry } from '@/context/profileContext';

interface EducationFormData {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  inProgress?: boolean;
}

interface EducationEntryFormProps {
  education?: EducationFormData | null;
  onClose: () => void;
}

const EducationEntryForm: React.FC<EducationEntryFormProps> = ({ education, onClose }) => {
  const { addEducationEntry, updateEducationEntry } = useProfile();

  const { register, handleSubmit, setError, clearErrors, setValue, formState: { errors }, watch } = useForm<EducationFormData>({
    defaultValues: {
      school: education?.school || '',
      degree: education?.degree || '',
      startDate: education?.startDate || '',
      endDate: education?.endDate || '',
      gpa: education?.gpa || '',
      inProgress: education?.inProgress ?? false,
    }
  });

  const onSubmit = (data: EducationFormData) => {
    const start = new Date(data.startDate);
    const end = data.inProgress || !data.endDate ? null : new Date(data.endDate);

    if (end && start > end) {
      setError("endDate", {
        type: "manual",
        message: "End date must be after start date",
      });
      return;
    }
    clearErrors("endDate");

    const eduData = {
      ...data,
      inProgress: data.inProgress ?? false,
    };

    if (education) {
      updateEducationEntry(education.id, eduData);
    } else {
      addEducationEntry(eduData);
    }

    onClose();
  };

  const [wasEndDate, setWasEndDate] = useState<string | undefined>(education?.endDate);

  const watchInProgress = watch("inProgress");

  useEffect(() => {
    const end = watch("endDate");

    if (watchInProgress && end) {
      setWasEndDate(end);
      setValue("endDate", "");
    }

    if (!watchInProgress && !watch("endDate") && wasEndDate) {
      setValue("endDate", wasEndDate);
    }
  }, [watchInProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-800 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          {education ? 'Edit Education Entry' : 'Add New Education'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-red-500 hover:text-white hover:bg-red-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            School/Institution Name *
          </label>
          <input
            {...register('school', { required: 'School name is required' })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., University of Technology"
          />
          {errors.school && (
            <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white-700 mb-2">
            Degree/Certificate/Program *
          </label>
          <input
            {...register('degree', { required: 'Degree is required' })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Bachelor of Science in Computer Science"
          />
          {errors.degree && (
            <p className="mt-1 text-sm text-red-600">{errors.degree.message}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <div className='flex flex-col relative w-full'>
            <label className="block text-sm font-medium text-white mb-2">
              Start Date *
            </label>
            <input
              {...register('startDate', { required: 'Start date is required' })}
              type="month"
              className="bg-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="pointer-events-none absolute right-3 top-10">
              {/* Calendar Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="2 0 24 24" width="17" height="17">
                <path d="M7 10h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                <path fillRule="evenodd" d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 
                2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1h-2v2H8V1H6v2H5zm0 
                2h14v2H5V5zm0 4h14v10H5V9z" />
              </svg>
            </div>
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className='flex flex-col relative w-full'>
            <label className="block text-sm font-medium text-white mb-2">
              End Date
            </label>
            <input
              {...register('endDate')}
              type="month"
              disabled={watch("inProgress")}
              className={`bg-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${watch("inProgress") ? "opacity-50 cursor-not-allowed" : ""
                }`}
              placeholder="Leave empty if still enrolled"
            />
            <div className="pointer-events-none absolute right-3 top-10">
              {/* Calendar Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="17" height="17">
                <path d="M7 10h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                <path fillRule="evenodd" d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 
                2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1h-2v2H8V1H6v2H5zm0 
                2h14v2H5V5zm0 4h14v10H5V9z" />
              </svg>
            </div>
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}

            {/* In Progress Checkbox */}
            <label className="flex items-center mt-3 gap-2 text-sm text-white">
              <input
                type="checkbox"
                {...register("inProgress")}
                className="form-checkbox text-blue-600"
              />
              In Progress
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">
              GPA (Optional)
            </label>
            <input
              {...register('gpa')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 3.8 or 3.8/4.0"
            />
            <p className="mt-1 text-sm text-white-500">
              Only include if 3.5 or higher
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-white border border-gray-300 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{education ? 'Update Education' : 'Add Education'}</span>
          </button>
        </div>
      </form>

      {/* Examples */}
      <div className="mt-6 bg-neutral-700 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">📚 Examples:</h4>
        <div className="space-y-2 text-sm text-white">
          <div>
            <strong>University:</strong> &quot;Bachelor of Science in Computer Science&quot;
          </div>
          <div>
            <strong>Bootcamp:</strong> &quot;Full Stack Web Development Certificate&quot;
          </div>
          <div>
            <strong>Online Course:</strong> &quot;Google Data Analytics Professional Certificate&quot;
          </div>
          <div>
            <strong>Trade School:</strong> &quot;Associate Degree in Automotive Technology&quot;
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EducationEntryForm;