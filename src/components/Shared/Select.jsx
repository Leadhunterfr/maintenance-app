/**
 * Composant Select réutilisable
 * @param {Object} props
 * @param {string} props.label - Label du champ
 * @param {string} props.error - Message d'erreur
 * @param {Array} props.options - Options du select [{value, label}]
 * @param {boolean} props.required - Champ obligatoire
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.id - ID unique pour le champ
 * @param {string} props.name - Nom du champ pour le formulaire
 */
export default function Select({
  label,
  error,
  options = [],
  required = false,
  className = '',
  id,
  name,
  ...props
}) {
  // Génère un ID unique si non fourni
  const selectId = id || `select-${name || Math.random().toString(36).substr(2, 9)}`;
  const selectName = name || selectId;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={selectName}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        required={required}
        {...props}
      >
        <option value="">Sélectionner...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
