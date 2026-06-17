import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createUser as createUserApi } from '../../api/auth';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [outletId, setOutletId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    
    if (role === 'OUTLET' && !outletId) {
      setError('Outlet ID is required when assigning the OUTLET role.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        username,
        password,
        role,
        ...(role === 'OUTLET' ? { outletId } : {})
      };
      
      const response = await createUserApi(payload);
      
      // Successfully created
      setSuccessMsg(response.message || 'User created successfully.');
      
      // Reset form
      setUsername('');
      setPassword('');
      setRole('MANAGER');
      setOutletId('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card style={{ maxWidth: '500px' }}>
        <CardHeader title="Create New System User" />
        <CardContent>
          {error && (
            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {successMsg}
            </div>
          )}
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Username" 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <Input 
              label="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            
            <Select 
              label="System Role"
              options={[
                { label: 'Factory Manager (Full Access)', value: 'MANAGER' },
                { label: 'Outlet Account (Limited Access)', value: 'OUTLET' }
              ]}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            />

            {role === 'OUTLET' && (
              <Input 
                label="Outlet ID" 
                type="text" 
                placeholder="e.g. OUT001"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                disabled={isLoading}
              />
            )}

            <Button type="submit" variant="primary" style={{ marginTop: '0.5rem' }} disabled={isLoading}>
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUser;
