import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { PERIODICITES, SUCCESS_MESSAGES } from '../../utils/constants';
import { formatDate, calculateNextDate, getStatutBadgeClass, getStatutLabel } from '../../utils/helpers';
import Navbar from '../Shared/Navbar';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import Input from '../Shared/Input';
import Select from '../Shared/Select';
import Loader from '../Shared/Loader';

export default function FichesList() {
  const { userEtablissement } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFiche, setEditingFiche] = useState(null);
  const [formData, setFormData] = useState({
    nomTache: '',
    urlPdf: '',
    frequenceMois: '6',
    prochainEnvoi: '',
    responsableId: '',
    responsableAdjointId: '',
    executantIds: [],
    contactIds: [],
    commentaire: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userEtablissement) {
      fetchData();
    }
  }, [userEtablissement]);

  async function fetchData() {
    try {
      // Récupère les fiches
      const fichesData = await apiClient.getFiches(userEtablissement.id);

      // Convertir les noms de champs snake_case vers camelCase
      const fichesFormatted = fichesData.map(fiche => ({
        id: fiche.id,
        nomTache: fiche.nom_tache,
        urlPdf: fiche.url_pdf,
        frequenceMois: fiche.frequence_mois,
        prochainEnvoi: fiche.prochain_envoi,
        dernierEnvoi: fiche.dernier_envoi,
        responsableNom: fiche.responsable_nom,
        responsableEmail: fiche.responsable_email,
        responsableAdjointNom: fiche.responsable_adjoint_nom,
        responsableAdjointEmail: fiche.responsable_adjoint_email,
        executants: Array.isArray(fiche.executants) ? fiche.executants : [],
        contactIds: fiche.contact_ids || [],
        commentaire: fiche.commentaire,
        statut: fiche.statut,
      }));

      // Trie par date
      fichesFormatted.sort((a, b) => {
        const dateA = new Date(a.prochainEnvoi || 0);
        const dateB = new Date(b.prochainEnvoi || 0);
        return dateA - dateB;
      });

      setFiches(fichesFormatted);

      // Récupère les contacts
      const contactsData = await apiClient.getContacts(userEtablissement.id);
      setContacts(contactsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  function openModal(fiche = null) {
    if (fiche) {
      setEditingFiche(fiche);
      // Trouver les IDs des contacts correspondants
      const responsable = contacts.find(c => c.email === fiche.responsableEmail);
      const adjoint = contacts.find(c => c.email === fiche.responsableAdjointEmail);
      const executantIds = fiche.executants?.map(ex => ex.id) || [];

      setFormData({
        nomTache: fiche.nomTache || '',
        urlPdf: fiche.urlPdf || '',
        frequenceMois: String(fiche.frequenceMois || '6'),
        prochainEnvoi: fiche.prochainEnvoi ? new Date(fiche.prochainEnvoi).toISOString().split('T')[0] : '',
        responsableId: responsable?.id || '',
        responsableAdjointId: adjoint?.id || '',
        executantIds: executantIds,
        contactIds: fiche.contactIds || [],
        commentaire: fiche.commentaire || '',
      });
    } else {
      setEditingFiche(null);
      setFormData({
        nomTache: '',
        urlPdf: '',
        frequenceMois: '6',
        prochainEnvoi: '',
        responsableId: '',
        responsableAdjointId: '',
        executantIds: [],
        contactIds: [],
        commentaire: '',
      });
    }
    setShowModal(true);
    setErrors({});
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.nomTache) newErrors.nomTache = 'Le nom de la tâche est requis';
    if (!formData.urlPdf) newErrors.urlPdf = 'L\'URL du PDF est requise';
    if (!formData.prochainEnvoi) newErrors.prochainEnvoi = 'La date est requise';
    if (formData.contactIds.length === 0) newErrors.contactIds = 'Sélectionnez au moins un contact';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Récupérer les infos des contacts sélectionnés
      const responsable = contacts.find(c => c.id === parseInt(formData.responsableId));
      const adjoint = contacts.find(c => c.id === parseInt(formData.responsableAdjointId));

      // Convertir les noms de champs camelCase vers snake_case pour l'API
      const ficheData = {
        etablissement_id: userEtablissement.id,
        nom_tache: formData.nomTache,
        url_pdf: formData.urlPdf,
        frequence_mois: parseInt(formData.frequenceMois),
        prochain_envoi: new Date(formData.prochainEnvoi).toISOString(),
        dernier_envoi: null,
        responsable_nom: responsable?.nom || '',
        responsable_email: responsable?.email || '',
        responsable_adjoint_nom: adjoint?.nom || '',
        responsable_adjoint_email: adjoint?.email || '',
        executant_ids: formData.executantIds,
        contact_ids: formData.contactIds,
        commentaire: formData.commentaire,
        statut: 'en_attente',
      };

      if (editingFiche) {
        await apiClient.updateFiche(editingFiche.id, ficheData);
        alert(SUCCESS_MESSAGES.FICHE_UPDATED);
      } else {
        await apiClient.createFiche(ficheData);
        alert(SUCCESS_MESSAGES.FICHE_CREATED);
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(fiche) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${fiche.nomTache}" ?`)) {
      return;
    }

    try {
      await apiClient.deleteFiche(fiche.id);
      alert(SUCCESS_MESSAGES.FICHE_DELETED);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function toggleContact(contactId) {
    setFormData((prev) => {
      const newContactIds = prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId];
      return { ...prev, contactIds: newContactIds };
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Fiches de maintenance</h1>
            <Button onClick={() => openModal()}>
              + Nouvelle fiche
            </Button>
          </div>

          {loading ? (
            <Loader text="Chargement des fiches..." />
          ) : fiches.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                Aucune fiche de maintenance. Créez-en une pour commencer.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {fiches.map((fiche) => (
                <Card key={fiche.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {fiche.nomTache}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutBadgeClass(fiche.statut)}`}>
                          {getStatutLabel(fiche.statut)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <p className="mb-1">
                            <span className="font-medium">Périodicité :</span> {fiche.frequenceMois} mois
                          </p>
                          <p className="mb-1">
                            <span className="font-medium">Prochain envoi :</span>{' '}
                            {fiche.prochainEnvoi && formatDate(new Date(fiche.prochainEnvoi))}
                          </p>
                          {fiche.dernierEnvoi && (
                            <p>
                              <span className="font-medium">Dernier envoi :</span>{' '}
                              {formatDate(new Date(fiche.dernierEnvoi))}
                            </p>
                          )}
                        </div>

                        <div>
                          {fiche.responsableNom && (
                            <p className="mb-1">
                              <span className="font-medium">Responsable :</span> {fiche.responsableNom}
                            </p>
                          )}
                          {fiche.responsableAdjointNom && (
                            <p className="mb-1">
                              <span className="font-medium">Responsable adjoint :</span> {fiche.responsableAdjointNom}
                            </p>
                          )}
                          {fiche.executants && fiche.executants.length > 0 && (
                            <p>
                              <span className="font-medium">Exécutant{fiche.executants.length > 1 ? 's' : ''} :</span>{' '}
                              {fiche.executants.map(ex => ex.nom).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {fiche.contactIds && fiche.contactIds.map((contactId) => {
                          const contact = contacts.find((c) => c.id === contactId);
                          return contact ? (
                            <span
                              key={contactId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {contact.nom}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="secondary" onClick={() => openModal(fiche)}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(fiche)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  {fiche.urlPdf && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={fiche.urlPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        📄 Voir la fiche PDF
                      </a>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal création/édition fiche */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50 relative">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingFiche ? 'Modifier la fiche' : 'Nouvelle fiche de maintenance'}
                  </h3>

                  <Input
                    label="Nom de la tâche"
                    value={formData.nomTache}
                    onChange={(e) => setFormData({ ...formData, nomTache: e.target.value })}
                    error={errors.nomTache}
                    required
                  />

                  <Input
                    label="URL du PDF (Drive, Dropbox...)"
                    type="url"
                    value={formData.urlPdf}
                    onChange={(e) => setFormData({ ...formData, urlPdf: e.target.value })}
                    error={errors.urlPdf}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Périodicité"
                      value={formData.frequenceMois}
                      onChange={(e) => setFormData({ ...formData, frequenceMois: e.target.value })}
                      options={PERIODICITES}
                      required
                    />

                    <Input
                      label="Prochaine date d'envoi"
                      type="date"
                      value={formData.prochainEnvoi}
                      onChange={(e) => setFormData({ ...formData, prochainEnvoi: e.target.value })}
                      error={errors.prochainEnvoi}
                      required
                    />
                  </div>

                  <hr className="my-4" />

                  <h4 className="text-sm font-medium text-gray-900 mb-3">Assignation</h4>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsable principal
                    </label>
                    <select
                      value={formData.responsableId}
                      onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="">-- Sélectionner un contact --</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.nom} ({contact.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsable adjoint
                    </label>
                    <select
                      value={formData.responsableAdjointId}
                      onChange={(e) => setFormData({ ...formData, responsableAdjointId: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="">-- Sélectionner un contact --</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.nom} ({contact.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exécutants de la tâche (plusieurs possibles)
                    </label>
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {contacts.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">Aucun contact disponible</p>
                      ) : (
                        contacts.map((contact) => (
                          <label
                            key={contact.id}
                            className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.executantIds.includes(contact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    executantIds: [...formData.executantIds, contact.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    executantIds: formData.executantIds.filter(id => id !== contact.id)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">
                              {contact.nom} <span className="text-gray-500">({contact.email})</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Sélectionnez un ou plusieurs contacts qui exécuteront cette tâche
                    </p>
                  </div>

                  <hr className="my-4" />

                  <div className="mb-4">
                    <label className="label">
                      Contacts à notifier <span className="text-red-500">*</span>
                    </label>
                    {contacts.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Aucun contact disponible. Créez-en d'abord dans l'onglet Contacts.
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {contacts.map((contact) => (
                          <label key={contact.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.contactIds.includes(contact.id)}
                              onChange={() => toggleContact(contact.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {contact.nom} ({contact.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.contactIds && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactIds}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <Button type="submit" loading={submitting}>
                    {editingFiche ? 'Mettre à jour' : 'Créer la fiche'}
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
