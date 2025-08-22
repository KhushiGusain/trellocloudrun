'use client';

const PasswordStrength = ({ password = '' }) => {
  const getStrength = (password) => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let score = 0;
    

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { level: 1, text: 'Weak', color: 'var(--color-error)' };
    if (score <= 4) return { level: 2, text: 'Medium', color: '#f59e0b' };
    return { level: 3, text: 'Strong', color: 'var(--color-success)' };
  };
  
  const strength = getStrength(password);
  
  if (!password) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex space-x-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`
              h-1 flex-1 rounded-full transition-all duration-300
              ${level <= strength.level 
                ? 'opacity-100' 
                : 'opacity-20 bg-gray-200'
              }
            `}
            style={{
              backgroundColor: level <= strength.level ? strength.color : '#e5e7eb'
            }}
          />
        ))}
      </div>
      <p 
        className="text-xs font-medium"
        style={{ color: strength.color }}
      >
        Password strength: {strength.text}
      </p>
    </div>
  );
};

export { PasswordStrength };
