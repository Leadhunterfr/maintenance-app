import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SUCCESS_MESSAGES, ROLES } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';
import Navbar from '../Shared/Navbar';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import Input from '../Shared/Input';
import Loader from '../Shared/Loader';

export default function UsersList() {
  const { userEtablissement } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    fonction: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userEtablissement) {
      fetchUsers();
    }
  }, [userEtablissement]);

  async function fetchUsers() {
    try {
      // TODO: Implémenter la gestion des utilisateurs avec PostgreSQL
      // Pour le moment, utilisez les contacts avec le rôle "responsable" pour donner accès
      setUsers([]);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(user = null) {
    if (user) {
      setEditingUser(user);
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        fonction: user.fonction || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        nom: '',
        email: '',
        fonction: '',
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
    if (!formData.fonction) newErrors.fonction = 'La fonction est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    alert('Gestion des utilisateurs : Fonctionnalité en cours de développement.\n\nPour donner accès à quelqu\'un, créez un contact avec le rôle "Responsable" dans la section Contacts.');
    setShowModal(false);
  }

  async function handleDelete(user) {
    alert('Gestion des utilisateurs : Fonctionnalité en cours de développement.\n\nUtilisez la section Contacts pour gérer les personnes ayant accès.');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Gérez les utilisateurs de votre établissement
              </p>
            </div>
            <Button onClick={() => openModal()}>+ Nouvel utilisateur</Button>
          </div>

          {loading ? (
            <Loader text="Chargement des utilisateurs..." />
          ) : users.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                Aucun utilisateur pour le moment. Créez-en un pour commencer.
              </p>
            </Card>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fonction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date création
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.nom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.fonction}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.createdAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(user)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal création/modification utilisateur */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500/75 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                  </h3>

                  <Input
                    label="Nom complet"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    error={errors.nom}
                    required
                    placeholder="Jean Dupont"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    required
                    disabled={editingUser !== null}
                    placeholder="jean.dupont@example.com"
                  />

                  <Input
                    label="Fonction"
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                    error={errors.fonction}
                    required
                    placeholder="Technicien de maintenance"
                  />

                  {!editingUser && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Un email sera automatiquement envoyé à l'utilisateur
                        pour qu'il puisse créer son mot de passe.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <Button type="submit" loading={submitting}>
                    {editingUser ? 'Mettre à jour' : 'Créer l\'utilisateur'}
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
