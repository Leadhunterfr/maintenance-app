import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROUTES, MODULE_MENU_ITEMS, MODULES_LABELS } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

export default function Navbar() {
  const { currentUser, userRole, userEtablissement, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  }

  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;
  const isAdminEtablissement = userRole === ROLES.ADMIN_ETABLISSEMENT || userRole === ROLES.RESPONSABLE || userRole === 'responsable' || userRole === 'admin_etablissement';

  // Récupère les modules actifs de l'établissement
  const modulesActifs = userEtablissement?.modulesActifs || [];

  // Génère les items de menu dynamiquement selon les modules actifs
  const getModuleMenuItems = () => {
    const menuItems = [];

    modulesActifs.forEach((moduleKey) => {
      const moduleItems = MODULE_MENU_ITEMS[moduleKey];
      if (moduleItems) {
        // Ajoute un groupe de menu par module
        menuItems.push({
          moduleKey,
          label: MODULES_LABELS[moduleKey],
          items: moduleItems,
        });
      }
    });

    return menuItems;
  };

  const moduleMenuGroups = getModuleMenuItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et titre */}
          <div className="flex">
            <Link
              to={isSuperAdmin ? ROUTES.SUPER_ADMIN_DASHBOARD : ROUTES.ADMIN_DASHBOARD}
              className="flex items-center"
            >
              <span className="text-xl font-bold text-primary-600">
                Gestion Maintenance
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {isSuperAdmin && (
                <>
                  <Link
                    to={ROUTES.SUPER_ADMIN_DASHBOARD}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    to={ROUTES.SUPER_ADMIN_ETABLISSEMENTS}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    Établissements
                  </Link>
                </>
              )}

              {isAdminEtablissement && (
                <>
                  <Link
                    to={ROUTES.ADMIN_DASHBOARD}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    Dashboard
                  </Link>

                  {/* Affiche dynamiquement les menus selon les modules actifs */}
                  {moduleMenuGroups.map((group) => (
                    group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))
                  ))}

                  <Link
                    to={ROUTES.ADMIN_USERS}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    Utilisateurs
                  </Link>

                  <Link
                    to={ROUTES.ADMIN_SETTINGS}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    Paramètres
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Profil utilisateur */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {userEtablissement && (
                <span className="hidden sm:block text-sm text-gray-700">
                  {userEtablissement.nom}
                </span>
              )}

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(currentUser?.email || 'U')}
                </div>

                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
