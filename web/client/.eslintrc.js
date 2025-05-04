module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Disable unused vars warnings
    '@typescript-eslint/no-unused-vars': 'off',
    
    // Disable missing dependency warnings in useEffect
    'react-hooks/exhaustive-deps': 'off',
    
    // Disable naming convention warnings
    'react/jsx-pascal-case': 'off'
  }
}; 