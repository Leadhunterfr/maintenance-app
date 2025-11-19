import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { SUCCESS_MESSAGES } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';
import Navbar from '../Shared/Navbar';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import Input from '../Shared/Input';
import Loader from '../Shared/Loader';

export default function ContactsList() {
  const { userEtablissement } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userEtablissement) {
      fetchContacts();
    }
  }, [userEtablissement]);

  async function fetchContacts() {
    try {
      const contactsData = await apiClient.getContacts(userEtablissement.id);

      // Trie par nom
      contactsData.sort((a, b) => a.nom.localeCompare(b.nom));

      setContacts(contactsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
      alert('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  }

  function openModal(contact = null) {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        nom: contact.nom || '',
        email: contact.email || '',
        telephone: contact.telephone || '',
        role: contact.role || 'user',
      });
    } else {
      setEditingContact(null);
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        role: 'user',
      });
    }
    setShowModal(true);
    setErrors({});
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const contactData = {
        etablissement_id: userEtablissement.id,
        nom: formData.nom,
        prenom: '',
        fonction: '',
        email: formData.email,
        telephone: formData.telephone,
        mobile: '',
        notes: '',
        role: formData.role,
      };

      if (editingContact) {
        await apiClient.updateContact(editingContact.id, contactData);
        alert(SUCCESS_MESSAGES.CONTACT_UPDATED);
      } else {
        await apiClient.createContact(contactData);
        alert(SUCCESS_MESSAGES.CONTACT_CREATED);
      }

      setShowModal(false);
      fetchContacts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contact) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${contact.nom} ?`)) {
      return;
    }

    try {
      await apiClient.deleteContact(contact.id);
      alert(SUCCESS_MESSAGES.CONTACT_DELETED);
      fetchContacts();
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
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <Button onClick={() => openModal()}>
              + Nouveau contact
            </Button>
          </div>

          {loading ? (
            <Loader text="Chargement des contacts..." />
          ) : contacts.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                Aucun contact. Créez-en un pour commencer.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.nom}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          contact.role === 'responsable' || contact.role === 'admin_etablissement'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.role === 'responsable' || contact.role === 'admin_etablissement' ? 'Responsable' : 'Utilisateur'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        📧 {contact.email}
                      </p>
                      {contact.telephone && (
                        <p className="text-sm text-gray-600">
                          📞 {contact.telephone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openModal(contact)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(contact)}
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

      {/* Modal création/édition contact */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50 relative">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
                  </h3>

                  <Input
                    label="Nom complet"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    error={errors.nom}
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    required
                  />

                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    error={errors.telephone}
                  />

                  <div className="mb-4">
                    <label htmlFor="contact-role" className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <select
                      id="contact-role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="responsable">Responsable</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Les responsables peuvent se connecter et gérer les fiches
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <Button type="submit" loading={submitting}>
                    {editingContact ? 'Mettre à jour' : 'Créer le contact'}
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
