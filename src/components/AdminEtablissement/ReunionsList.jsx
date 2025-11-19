import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { SUCCESS_MESSAGES, JOURS_SEMAINE, FREQUENCES_REUNION } from '../../utils/constants';
import Navbar from '../Shared/Navbar';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import Input from '../Shared/Input';
import Select from '../Shared/Select';
import Loader from '../Shared/Loader';

export default function ReunionsList() {
  const { userEtablissement } = useAuth();
  const [reunions, setReunions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReunion, setEditingReunion] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    jourSemaine: '1',
    heureDebut: '10:00',
    heureFin: '11:00',
    frequence: 'hebdomadaire',
    lieu: '',
    urlVisio: '',
    actif: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userEtablissement) {
      fetchReunions();
    }
  }, [userEtablissement]);

  async function fetchReunions() {
    try {
      const reunionsData = await apiClient.getReunions(userEtablissement.id);
      setReunions(reunionsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des réunions:', error);
      alert('Erreur lors du chargement des réunions');
    } finally {
      setLoading(false);
    }
  }

  function openModal(reunion = null) {
    if (reunion) {
      setEditingReunion(reunion);
      setFormData({
        nom: reunion.nom || '',
        description: reunion.description || '',
        jourSemaine: String(reunion.jour_semaine),
        heureDebut: reunion.heure_debut || '10:00',
        heureFin: reunion.heure_fin || '11:00',
        frequence: reunion.frequence || 'hebdomadaire',
        lieu: reunion.lieu || '',
        urlVisio: reunion.url_visio || '',
        actif: reunion.actif !== false,
      });
    } else {
      setEditingReunion(null);
      setFormData({
        nom: '',
        description: '',
        jourSemaine: '1',
        heureDebut: '10:00',
        heureFin: '11:00',
        frequence: 'hebdomadaire',
        lieu: '',
        urlVisio: '',
        actif: true,
      });
    }
    setShowModal(true);
    setErrors({});
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.heureDebut) newErrors.heureDebut = 'L\'heure de début est requise';
    if (!formData.heureFin) newErrors.heureFin = 'L\'heure de fin est requise';

    if (formData.heureDebut && formData.heureFin && formData.heureDebut >= formData.heureFin) {
      newErrors.heureFin = 'L\'heure de fin doit être après l\'heure de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const reunionData = {
        etablissement_id: userEtablissement.id,
        nom: formData.nom,
        description: formData.description,
        jour_semaine: parseInt(formData.jourSemaine),
        heure_debut: formData.heureDebut,
        heure_fin: formData.heureFin,
        frequence: formData.frequence,
        lieu: formData.lieu,
        url_visio: formData.urlVisio,
        actif: formData.actif,
      };

      if (editingReunion) {
        await apiClient.updateReunion(editingReunion.id, reunionData);
        alert(SUCCESS_MESSAGES.REUNION_UPDATED);
      } else {
        await apiClient.createReunion(reunionData);
        alert(SUCCESS_MESSAGES.REUNION_CREATED);
      }

      setShowModal(false);
      fetchReunions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reunion) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${reunion.nom}" ?`)) {
      return;
    }

    try {
      await apiClient.deleteReunion(reunion.id);
      alert(SUCCESS_MESSAGES.REUNION_DELETED);
      fetchReunions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function getJourLabel(jourSemaine) {
    const jour = JOURS_SEMAINE.find(j => j.value === jourSemaine);
    return jour ? jour.label : '';
  }

  function getFrequenceLabel(frequence) {
    const freq = FREQUENCES_REUNION.find(f => f.value === frequence);
    return freq ? freq.label : frequence;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Réunions</h1>
            <Button onClick={() => openModal()}>
              + Nouvelle réunion
            </Button>
          </div>

          {loading ? (
            <Loader text="Chargement des réunions..." />
          ) : reunions.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                Aucune réunion. Créez-en une pour commencer.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reunions.map((reunion) => (
                <Card key={reunion.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reunion.nom}
                        </h3>
                        {!reunion.actif && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactif
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        📅 {getJourLabel(reunion.jour_semaine)} • {reunion.heure_debut?.substring(0, 5)} - {reunion.heure_fin?.substring(0, 5)}
                      </p>

                      <p className="text-sm text-gray-600 mb-2">
                        🔁 {getFrequenceLabel(reunion.frequence)}
                      </p>

                      {reunion.lieu && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {reunion.lieu}
                        </p>
                      )}

                      {reunion.url_visio && (
                        <a
                          href={reunion.url_visio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 block mb-2"
                        >
                          🎥 Lien visio
                        </a>
                      )}

                      {reunion.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {reunion.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openModal(reunion)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(reunion)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal création/édition réunion */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50 relative">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingReunion ? 'Modifier la réunion' : 'Nouvelle réunion'}
                  </h3>

                  <Input
                    label="Nom de la réunion"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    error={errors.nom}
                    required
                  />

                  <div className="mb-4">
                    <label htmlFor="reunion-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="reunion-description"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Jour de la semaine"
                      value={formData.jourSemaine}
                      onChange={(e) => setFormData({ ...formData, jourSemaine: e.target.value })}
                      options={JOURS_SEMAINE}
                      required
                    />

                    <Select
                      label="Fréquence"
                      value={formData.frequence}
                      onChange={(e) => setFormData({ ...formData, frequence: e.target.value })}
                      options={FREQUENCES_REUNION}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Heure de début"
                      type="time"
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                      error={errors.heureDebut}
                      required
                    />

                    <Input
                      label="Heure de fin"
                      type="time"
                      value={formData.heureFin}
                      onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                      error={errors.heureFin}
                      required
                    />
                  </div>

                  <Input
                    label="Lieu"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    placeholder="Salle de réunion A, Bureau..."
                  />

                  <Input
                    label="Lien visioconférence"
                    type="url"
                    value={formData.urlVisio}
                    onChange={(e) => setFormData({ ...formData, urlVisio: e.target.value })}
                    placeholder="https://zoom.us/..."
                  />

                  <div className="mb-4">
                    <label htmlFor="reunion-actif" className="flex items-center">
                      <input
                        id="reunion-actif"
                        name="actif"
                        type="checkbox"
                        checked={formData.actif}
                        onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Réunion active
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <Button type="submit" loading={submitting}>
                    {editingReunion ? 'Mettre à jour' : 'Créer la réunion'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    type="button"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
