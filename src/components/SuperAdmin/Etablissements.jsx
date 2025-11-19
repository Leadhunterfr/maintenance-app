import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import { SUCCESS_MESSAGES } from '../../utils/constants';
import Navbar from '../Shared/Navbar';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import Input from '../Shared/Input';
import Loader from '../Shared/Loader';

export default function Etablissements() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEtablissements();
  }, []);

  async function fetchEtablissements() {
    try {
      const data = await apiClient.getEtablissements();
      setEtablissements(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des établissements:', error);
      alert('Erreur lors du chargement des établissements');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.adresse) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.codePostal) newErrors.codePostal = 'Le code postal est requis';
    if (!formData.ville) newErrors.ville = 'La ville est requise';

    // Validation des champs admin (optionnels mais si l'un est rempli, tous doivent l'être)
    const hasAdminInfo = formData.adminEmail || formData.adminName || formData.adminPassword;
    if (hasAdminInfo) {
      if (!formData.adminName) newErrors.adminName = 'Le nom de l\'admin est requis';
      if (!formData.adminEmail) newErrors.adminEmail = 'L\'email de l\'admin est requis';
      if (!formData.adminPassword) newErrors.adminPassword = 'Le mot de passe est requis';
      if (formData.adminPassword && formData.adminPassword.length < 6) {
        newErrors.adminPassword = 'Le mot de passe doit contenir au moins 6 caractères';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await apiClient.createEtablissement({
        nom: formData.nom,
        adresse: formData.adresse,
        code_postal: formData.codePostal,
        ville: formData.ville,
        pays: 'France',
        telephone: '',
        email: '',
        notes: '',
        modules: ['maintenance'],
        admin_name: formData.adminName,
        admin_email: formData.adminEmail,
        admin_password: formData.adminPassword,
      });

      alert(SUCCESS_MESSAGES.ETABLISSEMENT_CREATED);
      setShowModal(false);
      setFormData({
        nom: '',
        adresse: '',
        codePostal: '',
        ville: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      });
      fetchEtablissements();
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      alert('Erreur : ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(etablissement) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${etablissement.nom} ?`)) {
      return;
    }

    try {
      await apiClient.deleteEtablissement(etablissement.id);
      alert('Établissement supprimé');
      fetchEtablissements();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Établissements</h1>
            <Button onClick={() => setShowModal(true)}>
              + Nouvel établissement
            </Button>
          </div>

          {loading ? (
            <Loader text="Chargement des établissements..." />
          ) : etablissements.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                Aucun établissement pour le moment. Créez-en un pour commencer.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {etablissements.map((etab) => (
                <Card key={etab.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {etab.nom}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {etab.adresse}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {etab.code_postal} {etab.ville}
                      </p>
                      {etab.email && (
                        <p className="text-xs text-gray-500">
                          {etab.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(etab)}
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

      {/* Modal création établissement */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Nouvel établissement
                  </h3>

                  <Input
                    label="Nom de l'établissement"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    error={errors.nom}
                    required
                  />

                  <Input
                    label="Adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    error={errors.adresse}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Code postal"
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      error={errors.codePostal}
                      required
                    />

                    <Input
                      label="Ville"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      error={errors.ville}
                      required
                    />
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">
                      Administrateur de l'établissement (optionnel)
                    </h4>

                    <Input
                      label="Nom de l'admin"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      error={errors.adminName}
                      placeholder="Ex: Jean Dupont"
                    />

                    <Input
                      label="Email de l'admin"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      error={errors.adminEmail}
                      placeholder="admin@etablissement.fr"
                    />

                    <Input
                      label="Mot de passe"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      error={errors.adminPassword}
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <Button type="submit" loading={submitting}>
                    Créer l'établissement
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
