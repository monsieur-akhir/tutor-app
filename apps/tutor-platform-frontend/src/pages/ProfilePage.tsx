import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { User, Edit3, Save, X, MapPin, Phone, Mail, GraduationCap, Star, Clock, DollarSign } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, loadProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    skills: '',
    languages: '',
    location: '',
    hourlyRate: 0,
    experience: '',
    education: '',
    certifications: '',
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '15:00', available: false },
      sunday: { start: '10:00', end: '15:00', available: false }
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
        location: profile.location || '',
        hourlyRate: profile.hourlyRate || 0,
        experience: profile.experience || '',
        education: profile.education || '',
        certifications: profile.certifications || '',
        availability: profile.availability || formData.availability
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean)
      };
      await updateProfile(updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      student: 'Étudiant',
      parent: 'Parent',
      tutor: 'Tuteur',
      coach: 'Coach',
      mentor: 'Mentor'
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête du profil */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-lg text-gray-600">{getRoleLabel(user.role)}</p>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </>
              )}
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{profile.rating?.toFixed(1) || 'N/A'}</p>
              <p className="text-sm text-gray-600">Note moyenne</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{profile.totalSessions || 0}</p>
              <p className="text-sm text-gray-600">Sessions totales</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{profile.hourlyRate || 0}€</p>
              <p className="text-sm text-gray-600">Tarif horaire</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <GraduationCap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{profile.experience || 'N/A'}</p>
              <p className="text-sm text-gray-600">Expérience</p>
            </div>
          </div>
        </div>

        {/* Formulaire de profil */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du profil</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bio */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biographie
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Parlez-nous de vous, de votre expérience et de votre approche..."
              />
            </div>

            {/* Compétences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Mathématiques, Physique, Chimie..."
              />
              <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
            </div>

            {/* Langues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langues parlées
              </label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Français, Anglais, Espagnol..."
              />
              <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Ville, région..."
                />
              </div>
            </div>

            {/* Tarif horaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarif horaire (€)
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                disabled={!isEditing}
                min="0"
                step="0.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="25.00"
              />
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Années d'expérience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="5 ans"
              />
            </div>

            {/* Éducation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formation
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Master en Mathématiques"
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Certification pédagogique..."
              />
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Sauvegarder</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
