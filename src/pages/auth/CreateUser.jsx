import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createUser as createUserApi } from '../../api/auth';
import { Building2, LockKeyhole, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import './CreateUser.css';

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
    <main className="create-user-page">
      <section className="create-user-intro">
        <div className="create-user-intro-icon"><UsersRound size={22} /></div>
        <div>
          <p className="create-user-eyebrow">Access management</p>
          <h2>Create a system user</h2>
          <p>Set up a secure account and assign only the access required for the user’s role.</p>
        </div>
      </section>

      <div className="create-user-layout">
        <Card className="create-user-card">
          <CardHeader title="User details" />
          <CardContent>
          {error && (
            <div className="create-user-alert create-user-alert-error" role="alert">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="create-user-alert create-user-alert-success" role="status">
              {successMsg}
            </div>
          )}
          <form onSubmit={handleCreateUser} className="create-user-form">
            <Input 
              label="Username" 
              type="text" 
              placeholder="e.g. arun.kumar"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <p className="create-user-field-note"><LockKeyhole size={14} /> Use a unique password and share it securely with the new user.</p>
            
            <fieldset className="create-user-role-picker" disabled={isLoading}>
              <legend><span>2</span><div><strong>Access role</strong><small>Choose the access level for this user</small></div></legend>
              <div className="create-user-role-options">
                <button
                  type="button"
                  className={`create-user-role-option ${role === 'MANAGER' ? 'selected' : ''}`}
                  onClick={() => setRole('MANAGER')}
                >
                  <ShieldCheck size={19} />
                  <span><strong>Factory Manager</strong><small>Full operational access</small></span>
                </button>
                <button
                  type="button"
                  className={`create-user-role-option ${role === 'OUTLET' ? 'selected' : ''}`}
                  onClick={() => setRole('OUTLET')}
                >
                  <Building2 size={19} />
                  <span><strong>Outlet Account</strong><small>Access for one assigned outlet</small></span>
                </button>
              </div>
            </fieldset>

            {role === 'OUTLET' && (
              <Input 
                label="Assigned outlet ID" 
                type="text" 
                placeholder="e.g. OUT001"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                disabled={isLoading}
              />
            )}

            <Button type="submit" variant="primary" className="create-user-submit" disabled={isLoading}>
              <UserPlus size={18} />
              {isLoading ? 'Creating user…' : 'Create user'}
            </Button>
          </form>
          </CardContent>
        </Card>

        <aside className="create-user-guidance" aria-label="Role guidance">
          <div className="create-user-guidance-icon"><ShieldCheck size={20} /></div>
          <h3>Choose access carefully</h3>
          <p>Roles control what the user can view and manage in the system.</p>
          <div className="create-user-role">
            <ShieldCheck size={18} />
            <div><strong>Factory Manager</strong><span>Full access to orders, load plans, dispatch and users.</span></div>
          </div>
          <div className="create-user-role">
            <Building2 size={18} />
            <div><strong>Outlet Account</strong><span>Limited access, restricted to the assigned outlet.</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default CreateUser;
