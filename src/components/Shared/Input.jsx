/**
 * Composant Input réutilisable
 * @param {Object} props
 * @param {string} props.label - Label du champ
 * @param {string} props.error - Message d'erreur
 * @param {string} props.type - Type d'input
 * @param {boolean} props.required - Champ obligatoire
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.id - ID unique pour le champ
 * @param {string} props.name - Nom du champ pour le formulaire
 */
export default function Input({
  label,
  error,
  type = 'text',
  required = false,
  className = '',
  id,
  name,
  ...props
}) {
  // Génère un ID unique si non fourni
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;
  const inputName = name || inputId;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={inputName}
        type={type}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
