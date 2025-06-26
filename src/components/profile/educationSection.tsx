import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, GraduationCap, Calendar } from 'lucide-react';
import { useProfile, EducationEntry } from '@/context/profileContext';
import EducationEntryForm from './educationEntryForm';

const EducationSection = () => {
  const { profile, deleteEducationEntry } = useProfile();
  const [editingEducation, setEditingEducation] = useState<EducationEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (education: EducationEntry) => {
    setEditingEducation(education);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      deleteEducationEntry(id);
    }
  };

  const handleCloseForm = () => {
    setEditingEducation(null);
    setShowAddForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
          <p className="text-gray-600">Manage your educational background and qualifications</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingEducation(null);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Education</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(showAddForm || editingEducation) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <EducationEntryForm
              education={editingEducation}
              onClose={handleCloseForm}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education List */}
      <div className="space-y-4">
        {profile.education.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No education entries yet</p>
            <p>Add your educational background to get started</p>
          </div>
        ) : (
          profile.education.map((education, index) => (
            <motion.div
              key={education.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">{education.school}</h3>
                  </div>
                  
                  <p className="text-gray-700 font-medium mb-2">{education.degree}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{education.dates}</span>
                    </div>
                    {education.gpa && (
                      <div>
                        <span className="font-medium">GPA: {education.gpa}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(education)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(education.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">🎓 Education Tips:</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• List education in reverse chronological order (most recent first)</li>
          <li>• Include relevant coursework, honors, or achievements</li>
          <li>• Add GPA if it&apos;s 3.5 or higher (or equivalent)</li>
          <li>• Include certifications, bootcamps, and professional development</li>
          <li>• Don&apos;t forget about relevant online courses or training</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default EducationSection;